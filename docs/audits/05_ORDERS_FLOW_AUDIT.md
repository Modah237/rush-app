# RUSH — 05 Orders Flow Audit

Réalisé le 5 juin 2026.

## Audit du Flux et du Suivi de Commande

Ce rapport valide le cycle de vie d'une commande du client, de l'historique au live-tracking.

### 1. Structure de Navigation
* Les cartes de commandes de la page `/orders` (onglets "En cours" et "Historique") appellent la navigation `router.push('/orders/' + o.id)`.
* Le bouton **Suivre en direct** sur les cartes de commandes actives appelle également `/orders/${o.id}`.
* Ces appels sont correctement capturés par la route dynamique physique `app/orders/[reference]/page.tsx` et résolus de manière transparente.

### 2. Normalisation des Statuts de Commandes
Les statuts sont alignés sur le type enum de base de données `order_status` :
* `pending` : En attente de paiement (MTN / OM).
* `confirmed` : Validé, en attente de préparation.
* `preparing` : En cours de préparation par la boutique.
* `out_for_delivery` : Remis au livreur, en transit.
* `delivered` : Remis au client (clôture).
* `cancelled` : Annulé.

### 3. Cohérence de la Timeline de Suivi
La frise chronologique de suivi (`TRACKING_STEPS`) comprend 4 jalons :
1. **Commande confirmée :** Validée par la plateforme.
2. **En préparation :** Emballage par le commerçant.
3. **En route vers vous :** Livraison active par le coursier.
4. **Livré :** Remise des articles au domicile.

### 4. Carte Interactive SVG de Live-Tracking
La page de suivi comprend une zone visuelle SVG simulant le trajet en direct de la moto du livreur (avec calcul dynamique de sa position gauche/basse selon l'étape courante de livraison et affichage du nom et du téléphone du livreur).

### 5. Écran de Commande Introuvable
Si l'ID de commande saisi n'existe pas, la page de suivi intercepte l'erreur et affiche un écran d'avertissement personnalisé RUSH :
* Titre : `Commande introuvable`
* Description : `Cette commande n’existe pas ou n’est plus accessible.`
* Action : `[Retour à Mes commandes]` (bouton redirigeant vers `/orders`).
Aucune 404 brute de Next.js n'est exposée au client.

---

## Conclusion de l'audit
Le cycle de vie et le suivi temps réel des commandes sont robustes. La normalisation des statuts garantit un affichage cohérent de la timeline de livraison et de la carte interactive SVG.
