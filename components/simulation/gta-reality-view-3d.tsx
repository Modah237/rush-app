'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import Icon from '@/components/shared/icon';
import {
  City3DSceneData,
  compileDouala3D,
  compileYaounde3D,
  geoToWorld3D,
} from '@/lib/geospatial-compiler';
import { GtaActor } from '@/lib/gta-agents';
import { Order } from '@/types';

export interface GtaRealityView3DProps {
  actors: GtaActor[];
  orders: Order[];
  activeCityId?: 'douala' | 'yaounde';
  onSelectActor?: (actorId: string) => void;
}

type CameraMode = 'chase' | 'drone' | 'orbit';

export default function GtaRealityView3D({
  actors,
  orders,
  activeCityId = 'douala',
  onSelectActor,
}: GtaRealityView3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration & États UI
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [selectedCity, setSelectedCity] = useState<'douala' | 'yaounde'>(activeCityId);
  const [isNightMode, setIsNightMode] = useState(true);
  const [fps, setFps] = useState(60);
  const [selectedRusherId, setSelectedRusherId] = useState<string>('');

  // Références Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Objets dynamiques Three.js
  const rusherMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const clientPinsRef = useRef<Map<string, THREE.Group>>(new Map());
  const shopMarkersRef = useRef<Map<string, THREE.Group>>(new Map());
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Contrôles souris pour le mode Orbit
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 45 });

  // Liste des rushers disponibles pour la caméra de poursuite
  const rushers = useMemo(() => actors.filter((a) => a.role === 'rusher'), [actors]);

  useEffect(() => {
    if (rushers.length > 0 && !selectedRusherId) {
      setSelectedRusherId(rushers[0].id);
    }
  }, [rushers, selectedRusherId]);

  const activeRusher = useMemo(() => {
    return rushers.find((r) => r.id === selectedRusherId) || rushers[0];
  }, [rushers, selectedRusherId]);

  // Données de la ville compilée depuis OpenStreetMap
  const cityData: City3DSceneData = useMemo(() => {
    return selectedCity === 'douala' ? compileDouala3D() : compileYaounde3D();
  }, [selectedCity]);

  // Initialisation du monde 3D
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    // 1. Scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x090a0f : 0xd8e2ec);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x090a0f : 0xd8e2ec, 0.008);
    sceneRef.current = scene;

    // 2. Caméra
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.5, 600);
    camera.position.set(0, 15, 30);
    cameraRef.current = camera;

    // 3. Renderer WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Éclairage
    const ambientLight = new THREE.AmbientLight(isNightMode ? 0x1e293b : 0xffffff, isNightMode ? 0.9 : 1.2);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(isNightMode ? 0x38bdf8 : 0xfffbeb, isNightMode ? 0.6 : 1.8);
    sunLight.position.set(60, 100, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 5. Sol / Asphalte urbain
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x0f172a : 0x334155,
      roughness: 0.85,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 6. Compilation du réseau routier
    cityData.roads.forEach((road) => {
      const dx = road.end.x - road.start.x;
      const dz = road.end.z - road.start.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const roadGeo = new THREE.PlaneGeometry(road.width, length);
      const roadMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? 0x161c28 : 0x242d3d,
        roughness: 0.7,
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = angle;
      roadMesh.position.set(
        (road.start.x + road.end.x) / 2,
        0.02,
        (road.start.z + road.end.z) / 2
      );
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);

      // Lignes de marquage au sol
      const lineGeo = new THREE.PlaneGeometry(0.35, length);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.rotation.z = angle;
      lineMesh.position.set(
        (road.start.x + road.end.x) / 2,
        0.03,
        (road.start.z + road.end.z) / 2
      );
      scene.add(lineMesh);
    });

    // 7. Compilation des Bâtiments 3D
    cityData.buildings.forEach((bld) => {
      const bldGeo = new THREE.BoxGeometry(bld.size.x, bld.size.y, bld.size.z);
      const bldMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bld.color),
        roughness: 0.6,
        metalness: 0.2,
      });
      const bldMesh = new THREE.Mesh(bldGeo, bldMat);
      bldMesh.position.set(bld.position.x, bld.position.y, bld.position.z);
      bldMesh.castShadow = true;
      bldMesh.receiveShadow = true;
      scene.add(bldMesh);

      // Toiture colorée
      const roofGeo = new THREE.BoxGeometry(bld.size.x + 0.4, 0.6, bld.size.z + 0.4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bld.roofColor),
        roughness: 0.4,
      });
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(bld.position.x, bld.position.y + bld.size.y / 2 + 0.3, bld.position.z);
      scene.add(roofMesh);

      // Enseigne lumineuse Néon (Style Cyberpunk / GTA de nuit)
      if (bld.hasNeonSign && bld.neonColor) {
        const neonGeo = new THREE.BoxGeometry(bld.size.x * 0.5, 1.2, 0.4);
        const neonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(bld.neonColor) });
        const neonMesh = new THREE.Mesh(neonGeo, neonMat);
        neonMesh.position.set(bld.position.x, bld.position.y + bld.size.y / 2 - 1.5, bld.position.z + bld.size.z / 2 + 0.3);
        scene.add(neonMesh);

        if (isNightMode) {
          const pointLight = new THREE.PointLight(new THREE.Color(bld.neonColor), 2, 25);
          pointLight.position.set(bld.position.x, bld.position.y, bld.position.z + bld.size.z / 2 + 2);
          scene.add(pointLight);
        }
      }
    });

    // 8. Palmiers / Végétation urbaine
    cityData.trees.forEach((tree) => {
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.position.set(tree.position.x, 2.25, tree.position.z);
      trunkMesh.castShadow = true;
      scene.add(trunkMesh);

      const leavesGeo = new THREE.ConeGeometry(2.4 * tree.scale, 3.2, 5);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      const leavesMesh = new THREE.Mesh(leavesGeo, leavesMat);
      leavesMesh.position.set(tree.position.x, 4.8, tree.position.z);
      leavesMesh.castShadow = true;
      scene.add(leavesMesh);
    });

    // 9. Lampadaires d'éclairage urbain
    const lightsGroup = new THREE.Group();
    cityData.streetLights.forEach((sl) => {
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 6, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
      const poleMesh = new THREE.Mesh(poleGeo, poleMat);
      poleMesh.position.set(sl.position.x, 3, sl.position.z);
      lightsGroup.add(poleMesh);

      const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.25, 0.4);
      const lampHeadMat = new THREE.MeshBasicMaterial({ color: isNightMode ? 0xfef08a : 0x94a3b8 });
      const lampHeadMesh = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      lampHeadMesh.position.set(sl.position.x, 6, sl.position.z);
      lightsGroup.add(lampHeadMesh);

      if (isNightMode) {
        const spotLight = new THREE.SpotLight(0xfef08a, 2.5, 22, Math.PI / 4, 0.4);
        spotLight.position.set(sl.position.x, 5.8, sl.position.z);
        spotLight.target.position.set(sl.position.x + (sl.facingAngle > 0 ? 3 : -3), 0, sl.position.z);
        lightsGroup.add(spotLight);
        lightsGroup.add(spotLight.target);
      }
    });
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Gestion du redimensionnement
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Contrôles de souris interactifs
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      orbitAngleRef.current.theta -= deltaX * 0.008;
      orbitAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.1, orbitAngleRef.current.phi - deltaY * 0.008));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitAngleRef.current.radius = Math.max(10, Math.min(120, orbitAngleRef.current.radius + e.deltaY * 0.05));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Boucle de rendu 60 FPS
    let frameCount = 0;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      // Calcul FPS
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      // Mise à jour de la caméra selon le mode sélectionné
      const targetRusherMesh = activeRusher ? rusherMeshesRef.current.get(activeRusher.id) : null;
      const targetPos = targetRusherMesh ? targetRusherMesh.position : new THREE.Vector3(0, 0, 0);

      if (cameraMode === 'chase' && targetRusherMesh) {
        // Caméra de poursuite Tesla Reality View / GTA 3ème personne
        const offset = new THREE.Vector3(0, 4.5, -9);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRusherMesh.rotation.y);
        const desiredCamPos = targetPos.clone().add(offset);
        camera.position.lerp(desiredCamPos, 0.08);

        const lookTarget = targetPos.clone().add(new THREE.Vector3(0, 1.8, 4));
        camera.lookAt(lookTarget);
      } else if (cameraMode === 'drone') {
        // Vue tactique en surplomb
        const dronePos = targetPos.clone().add(new THREE.Vector3(0, 35, -25));
        camera.position.lerp(dronePos, 0.05);
        camera.lookAt(targetPos);
      } else {
        // Mode Orbite Libre
        const r = orbitAngleRef.current.radius;
        const theta = orbitAngleRef.current.theta;
        const phi = orbitAngleRef.current.phi;

        camera.position.x = targetPos.x + r * Math.sin(phi) * Math.sin(theta);
        camera.position.y = targetPos.y + r * Math.cos(phi);
        camera.position.z = targetPos.z + r * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 1.5, 0)));
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [selectedCity, isNightMode, cameraMode, activeRusher, cityData]);

  // Synchronisation des acteurs GTA (Motos Rushers 3D) dans la scène
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 1. Mise à jour ou création des Motos Rushers
    rushers.forEach((rusher) => {
      let group = rusherMeshesRef.current.get(rusher.id);

      if (!group) {
        group = new THREE.Group();

        // Châssis Moto Rouge RUSH
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.7, 2.2);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xf50012, // Rouge RUSH signature
          metalness: 0.6,
          roughness: 0.3,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.55;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // Roues Moto (Avant & Arrière)
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        
        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0.35, 0.85);
        group.add(frontWheel);

        const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.position.set(0, 0.35, -0.85);
        group.add(rearWheel);

        // Pilote Rusher (Buste & Casque)
        const riderGeo = new THREE.BoxGeometry(0.6, 0.8, 0.5);
        const riderMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
        const riderMesh = new THREE.Mesh(riderGeo, riderMat);
        riderMesh.position.set(0, 1.15, -0.15);
        group.add(riderMesh);

        const helmetGeo = new THREE.SphereGeometry(0.3, 12, 12);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
        helmetMesh.position.set(0, 1.7, -0.1);
        group.add(helmetMesh);

        // Boîtier de livraison RUSH à l'arrière
        const boxGeo = new THREE.BoxGeometry(0.85, 0.75, 0.75);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x140e0d });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(0, 1.05, -0.85);
        group.add(boxMesh);

        // Phare avant avec SpotLight volumétrique (Tesla Reality View)
        const headlight = new THREE.SpotLight(0xfffbeb, 4, 30, Math.PI / 5, 0.25);
        headlight.position.set(0, 0.7, 1.1);
        headlight.target.position.set(0, 0.1, 8);
        group.add(headlight);
        group.add(headlight.target);

        // Feu arrière rouge
        const tailLight = new THREE.PointLight(0xef4444, 1.8, 8);
        tailLight.position.set(0, 0.7, -1.1);
        group.add(tailLight);

        scene.add(group);
        rusherMeshesRef.current.set(rusher.id, group);
      }

      // Calcul de position 3D à partir des coordonnées GPS réelles
      const targetPos3D = geoToWorld3D(
        { lat: rusher.lat, lng: rusher.lng },
        cityData.originGeo,
        cityData.worldScale
      );

      // Calcul de direction et inclinaison
      const currentPos = group.position;
      const dx = targetPos3D.x - currentPos.x;
      const dz = targetPos3D.z - currentPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.05) {
        const targetAngle = Math.atan2(dx, dz);
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetAngle, 0.15);
        // Léger banking dans les virages façon moto
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -dx * 0.1, 0.1);
      }

      group.position.x = THREE.MathUtils.lerp(group.position.x, targetPos3D.x, 0.12);
      group.position.z = THREE.MathUtils.lerp(group.position.z, targetPos3D.z, 0.12);
    });

    // 2. Pins de livraison des clients avec cercle de dropoff
    orders.forEach((order) => {
      if (order.status === 'out_for_delivery' && order.delivery_lat && order.delivery_lng) {
        let pin = clientPinsRef.current.get(order.id);
        if (!pin) {
          pin = new THREE.Group();

          // Anneau lumineux au sol
          const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.position.y = 0.05;
          pin.add(ringMesh);

          // Pin flottant
          const pinGeo = new THREE.ConeGeometry(0.7, 1.8, 8);
          const pinMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 });
          const pinMesh = new THREE.Mesh(pinGeo, pinMat);
          pinMesh.rotation.x = Math.PI;
          pinMesh.position.y = 2.5;
          pin.add(pinMesh);

          scene.add(pin);
          clientPinsRef.current.set(order.id, pin);
        }

        const dropPos = geoToWorld3D(
          { lat: order.delivery_lat, lng: order.delivery_lng },
          cityData.originGeo,
          cityData.worldScale
        );
        pin.position.set(dropPos.x, 0, dropPos.z);
      }
    });
  }, [rushers, orders, cityData]);

  // Vitesse simulée en km/h calculée pour le HUD Tesla Reality View
  const estimatedSpeedKmh = useMemo(() => {
    if (!activeRusher) return 0;
    if (activeRusher.status === 'delivering') return 42 + Math.round(Math.sin(Date.now() / 800) * 8);
    return 24 + Math.round(Math.cos(Date.now() / 900) * 5);
  }, [activeRusher]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border-warm-light shadow-warm-3 bg-[#090A0F] select-none">
      {/* Canvas Three.js */}
      <div ref={containerRef} className="w-full h-[460px] md:h-[540px] cursor-grab active:cursor-grabbing" />

      {/* HUD Top Bar : Overlay Cyberpunk / Tesla Reality View */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Statut Télémétrie Rusher */}
        <div className="pointer-events-auto bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 flex items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
            <span className="font-black text-[12px] tracking-wide uppercase">
              {activeRusher ? activeRusher.name : 'Rusher Moto'}
            </span>
          </div>
          <span className="h-3.5 w-px bg-white/20" />
          <div className="flex items-baseline gap-1">
            <span className="font-black text-lg text-brand font-mono">{estimatedSpeedKmh}</span>
            <span className="text-[10px] font-bold text-white/70">km/h</span>
          </div>
          <span className="h-3.5 w-px bg-white/20" />
          <div className="text-[10.5px] font-mono text-white/80 hidden sm:block">
            {activeRusher ? `${activeRusher.lat.toFixed(4)}°N, ${activeRusher.lng.toFixed(4)}°E` : ''}
          </div>
        </div>

        {/* Contrôles Mode Caméra & Affichage */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-white/15 text-white">
          {/* Mode Caméra */}
          {(['chase', 'drone', 'orbit'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCameraMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                cameraMode === mode ? 'bg-brand text-white shadow-brand' : 'text-white/75 hover:bg-white/10'
              }`}
            >
              {mode === 'chase' ? 'Poursuite' : mode === 'drone' ? 'Drone' : 'Orbite'}
            </button>
          ))}

          <span className="h-4 w-px bg-white/20 mx-1" />

          {/* Toggle Jour / Nuit */}
          <button
            type="button"
            onClick={() => setIsNightMode((v) => !v)}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 cursor-pointer"
            title={isNightMode ? 'Passer en mode Jour' : 'Passer en mode Nuit (Néons)'}
          >
            <Icon name={isNightMode ? 'sun' : 'moon'} size={15} />
          </button>

          <span className="h-4 w-px bg-white/20 mx-1" />

          {/* FPS Counter */}
          <span className="font-mono text-[10px] font-bold px-1.5 text-success">
            {fps} FPS
          </span>
        </div>
      </div>

      {/* HUD Bottom Bar : Sélection du Rusher et Ville */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Switcher de Ville */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => setSelectedCity('douala')}
            className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
              selectedCity === 'douala' ? 'bg-white text-ink shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            Douala (Akwa)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCity('yaounde')}
            className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
              selectedCity === 'yaounde' ? 'bg-white text-ink shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            Yaoundé (Bastos)
          </button>
        </div>

        {/* Sélecteur de Rusher à suivre */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 text-white">
          <span className="text-[10.5px] font-bold text-white/60 hidden sm:inline">Suivre Rusher :</span>
          {rushers.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedRusherId(r.id);
                if (onSelectActor) onSelectActor(r.id);
              }}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-black cursor-pointer transition-all ${
                selectedRusherId === r.id ? 'bg-brand text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {r.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
