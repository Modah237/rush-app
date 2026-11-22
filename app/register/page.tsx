'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import { CAMEROON_CITIES } from '@/lib/cameroon-geo';
import { normalizeCameroonPhone, requestPhoneOtp, verifyPhoneOtp } from '@/lib/auth';
import { useRushStore } from '@/context/rush-store-context';
import { UserRole } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const { updateUserProfile, pushToast } = useRushStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [role, setRole] = useState<UserRole>('client');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const phoneInfo = normalizeCameroonPhone(phone);

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatusMsg('Veuillez saisir votre nom complet.');
      return;
    }
    setIsLoading(true);
    const res = await requestPhoneOtp(phone);
    setStatusMsg(res.message);
    setIsLoading(false);
    if (res.success) {
      setOtpSent(true);
      pushToast(res.mode === 'live' ? 'Code SMS envoyé' : 'Code Sandbox : 123456', 'info');
    }
  };

  const handleConfirmRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await verifyPhoneOtp(phone, otpCode, { fullName: fullName.trim(), role, city });
    setStatusMsg(res.message);
    setIsLoading(false);

    if (res.success) {
      updateUserProfile({
        name: fullName.trim(),
        phone: phoneInfo.localNine,
        city,
      });
      pushToast('Compte RUSH créé avec succès !', 'success');
      if (role === 'vendor') {
        router.push('/merchant/dashboard');
      } else if (role === 'courier') {
        router.push('/rider/dashboard');
      } else {
        router.push('/account');
      }
    }
  };

  return (
    <div className="page-enter min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md card bg-surface p-6 rounded-[24px] border border-border-warm shadow-warm-2 flex flex-col gap-5">
        <div className="text-center">
          <Link href="/" className="font-black text-3xl tracking-tighter text-ink">
            RUSH<span className="text-brand">.</span>
          </Link>
          <h1 className="font-black text-xl text-ink mt-2">Créer un compte RUSH</h1>
          <p className="text-[13px] font-semibold text-ink-muted mt-1">
            Inscription rapide avec validation OTP mobile (+237).
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleStartRegister} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[12px] font-extrabold text-ink-light mb-1 ml-1">Nom complet</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex. Samuel Eto'o"
                className="w-full bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm font-bold text-[14px] text-ink outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-[12px] font-extrabold text-ink-light">Téléphone (+237)</label>
                {phoneInfo.valid && (
                  <span className="rounded-pill bg-green-tint text-success px-2 py-0.5 text-[10px] font-black">
                    {phoneInfo.operator}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm focus-within:ring-2 focus-within:ring-brand">
                <Icon name="phone" size={16} className="text-ink-muted" />
                <span className="font-black text-[13.5px] text-ink-light ml-2">+237</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="678451290"
                  className="flex-1 bg-transparent outline-none font-bold text-[14px] ml-2 text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1 ml-1">Ville</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-bg-app-light rounded-md px-3 h-11 border border-border-warm font-bold text-[13px] text-ink outline-none"
                >
                  {CAMEROON_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1 ml-1">Profil</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-bg-app-light rounded-md px-3 h-11 border border-border-warm font-bold text-[13px] text-ink outline-none"
                >
                  <option value="client">Client</option>
                  <option value="vendor">Commerçant</option>
                  <option value="courier">Livreur (Rusher)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 mt-2 rounded-pill bg-brand text-white font-black text-[13.5px] shadow-brand hover:bg-brand-hover cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Envoi OTP...' : 'Continuer & Recevoir le code SMS'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                Code OTP reçu sur {phoneInfo.e164}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-bg-app-light rounded-md px-4 h-12 border border-border-warm text-center font-black text-xl tracking-[0.35em] text-ink outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-pill bg-success text-white font-black text-[13.5px] cursor-pointer hover:opacity-95 disabled:opacity-60"
            >
              {isLoading ? 'Création...' : 'Activer mon compte RUSH'}
            </button>
          </form>
        )}

        {statusMsg && (
          <div className="rounded-md bg-bg-app-light border border-border-warm px-3.5 py-2.5 text-[12px] font-bold text-ink-light">
            {statusMsg}
          </div>
        )}

        <div className="text-center text-[12.5px] font-semibold text-ink-muted pt-2 border-t border-border-warm-light">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-brand font-black hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
