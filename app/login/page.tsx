'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import {
  normalizeCameroonPhone,
  requestEmailOtp,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '@/lib/auth';
import { useRushStore } from '@/context/rush-store-context';

export default function LoginPage() {
  const router = useRouter();
  const { updateUserProfile, pushToast } = useRushStore();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('678451290');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const phoneInfo = normalizeCameroonPhone(phone);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('');

    if (mode === 'phone') {
      const res = await requestPhoneOtp(phone);
      setStatusMsg(res.message);
      if (res.success) {
        setOtpSent(true);
        pushToast(res.mode === 'live' ? 'Code SMS envoyé' : 'Code Sandbox : 123456', 'info');
      }
    } else {
      const res = await requestEmailOtp(email);
      setStatusMsg(res.message);
      if (res.success) {
        pushToast('Vérifiez votre boîte mail', 'info');
      }
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await verifyPhoneOtp(phone, otpCode);
    setStatusMsg(res.message);
    setIsLoading(false);

    if (res.success && res.user) {
      updateUserProfile({
        phone: phoneInfo.localNine,
        name: res.user.full_name || 'Client RUSH',
      });
      pushToast('Connexion réussie !', 'success');
      router.push('/account');
    }
  };

  return (
    <div className="page-enter min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md card bg-surface p-6 rounded-[24px] border border-border-warm shadow-warm-2 flex flex-col gap-5">
        <div className="text-center">
          <Link href="/" className="font-black text-3xl tracking-tighter text-ink">
            RUSH<span className="text-brand">.</span>
          </Link>
          <h1 className="font-black text-xl text-ink mt-2">Connexion Cameroun OTP</h1>
          <p className="text-[13px] font-semibold text-ink-muted mt-1">
            Connectez-vous rapidement avec votre numéro MTN, Orange ou par e-mail.
          </p>
        </div>

        <div className="flex bg-bg-app-light p-1 rounded-pill border border-border-warm-light">
          <button
            type="button"
            onClick={() => {
              setMode('phone');
              setOtpSent(false);
              setStatusMsg('');
            }}
            className={`flex-1 h-9 rounded-pill text-[12.5px] font-black cursor-pointer transition-colors ${
              mode === 'phone' ? 'bg-ink text-white' : 'text-ink-muted'
            }`}
          >
            Téléphone (+237)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('email');
              setOtpSent(false);
              setStatusMsg('');
            }}
            className={`flex-1 h-9 rounded-pill text-[12.5px] font-black cursor-pointer transition-colors ${
              mode === 'email' ? 'bg-ink text-white' : 'text-ink-muted'
            }`}
          >
            E-mail
          </button>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            {mode === 'phone' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="text-[12px] font-extrabold text-ink-light">Numéro mobile</label>
                  {phoneInfo.valid && (
                    <span className="rounded-pill bg-green-tint text-success px-2 py-0.5 text-[10.5px] font-black">
                      {phoneInfo.operator} Cameroun
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand">
                  <Icon name="phone" size={18} className="text-ink-muted" />
                  <span className="font-black text-[14px] text-ink-light ml-2">+237</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="678451290"
                    maxLength={12}
                    className="flex-1 bg-transparent outline-none font-bold text-[14.5px] ml-2 text-ink"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.cm"
                  className="w-full bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm font-bold text-[14px] text-ink outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-pill bg-brand text-white font-black text-[13.5px] shadow-brand hover:bg-brand-hover cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Envoi en cours...' : mode === 'phone' ? 'Recevoir mon code OTP SMS' : 'Recevoir mon lien magique'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                Code de vérification à 6 chiffres ({phoneInfo.e164})
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
              {isLoading ? 'Vérification...' : 'Valider et me connecter'}
            </button>
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="text-[12px] font-bold text-ink-muted hover:text-brand cursor-pointer"
            >
              Changer de numéro
            </button>
          </form>
        )}

        {statusMsg && (
          <div className="rounded-md bg-bg-app-light border border-border-warm px-3.5 py-2.5 text-[12px] font-bold text-ink-light">
            {statusMsg}
          </div>
        )}

        <div className="text-center text-[12.5px] font-semibold text-ink-muted pt-2 border-t border-border-warm-light">
          Nouveau sur RUSH ?{' '}
          <Link href="/register" className="text-brand font-black hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
