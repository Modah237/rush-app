import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';

export interface CameroonPhoneInfo {
  valid: boolean;
  e164: string;
  localNine: string;
  operator: 'MTN' | 'Orange' | 'Camtel' | 'Nexttel' | 'Inconnu';
}

export interface AuthActionResult {
  success: boolean;
  mode: 'live' | 'sandbox';
  message: string;
  user?: {
    id: string;
    phone?: string;
    email?: string;
    full_name?: string;
    role?: UserRole;
  };
}

/**
 * Normalise et valide un numéro mobile camerounais (+237 6XX XX XX XX).
 */
export function normalizeCameroonPhone(raw: string): CameroonPhoneInfo {
  const digits = raw.replace(/\D/g, '');
  let local = digits;
  if (digits.startsWith('237') && digits.length >= 12) {
    local = digits.slice(3);
  } else if (digits.startsWith('00237') && digits.length >= 14) {
    local = digits.slice(5);
  }

  const valid = /^6\d{8}$/.test(local);
  let operator: CameroonPhoneInfo['operator'] = 'Inconnu';
  if (valid) {
    const p2 = local.slice(0, 2);
    const p3 = parseInt(local.slice(0, 3), 10);
    if (p2 === '67' || (p3 >= 650 && p3 <= 654) || (p3 >= 680 && p3 <= 683)) {
      operator = 'MTN';
    } else if (p2 === '69' || (p3 >= 655 && p3 <= 659) || (p3 >= 686 && p3 <= 689)) {
      operator = 'Orange';
    } else if (p2 === '62') {
      operator = 'Camtel';
    } else if (p2 === '66') {
      operator = 'Nexttel';
    }
  }

  return {
    valid,
    e164: valid ? `+237${local}` : '',
    localNine: local,
    operator,
  };
}

const SANDBOX_AUTH_KEY = 'rush_auth_session';

export function getLocalAuthSession(): AuthActionResult['user'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SANDBOX_AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthActionResult['user']) : null;
  } catch {
    return null;
  }
}

export function clearLocalAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SANDBOX_AUTH_KEY);
  } catch {
    // ignore
  }
}

export async function requestPhoneOtp(phone: string): Promise<AuthActionResult> {
  const info = normalizeCameroonPhone(phone);
  if (!info.valid) {
    return {
      success: false,
      mode: 'sandbox',
      message: 'Numéro camerounais invalide (format attendu : 6XX XX XX XX).',
    };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: info.e164 });
    if (!error) {
      return {
        success: true,
        mode: 'live',
        message: `Code OTP SMS envoyé par Supabase au ${info.e164} (${info.operator}).`,
      };
    }
    // Si le provider SMS n'est pas configuré sur le projet Supabase, bascule propre en Sandbox
    console.warn('Supabase Phone OTP indisponible, bascule Sandbox:', error.message);
  } catch {
    // Supabase env absent -> mode Sandbox
  }

  return {
    success: true,
    mode: 'sandbox',
    message: `Mode Sandbox actif : utilisez le code de test 123456 pour ${info.e164} (${info.operator}).`,
  };
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
  metadata?: { fullName?: string; role?: UserRole; city?: string }
): Promise<AuthActionResult> {
  const info = normalizeCameroonPhone(phone);
  if (!info.valid) {
    return { success: false, mode: 'sandbox', message: 'Numéro camerounais invalide.' };
  }
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) {
    return { success: false, mode: 'sandbox', message: 'Le code OTP doit contenir 6 chiffres.' };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: info.e164,
      token: cleanToken,
      type: 'sms',
    });

    if (!error && data.user) {
      if (metadata?.fullName || metadata?.role) {
        await supabase.auth.updateUser({
          data: {
            full_name: metadata.fullName,
            role: metadata.role || 'client',
            city: metadata.city || 'Douala',
          },
        });
      }
      const userObj = {
        id: data.user.id,
        phone: info.e164,
        full_name: metadata?.fullName || data.user.user_metadata?.full_name || 'Client RUSH',
        role: (metadata?.role || data.user.user_metadata?.role || 'client') as UserRole,
      };
      return {
        success: true,
        mode: 'live',
        message: 'Connexion OTP vérifiée avec succès.',
        user: userObj,
      };
    }
  } catch {
    // Fallback sandbox ci-dessous
  }

  if (cleanToken !== '123456') {
    return {
      success: false,
      mode: 'sandbox',
      message: 'Code OTP incorrect. En mode Sandbox local, utilisez 123456.',
    };
  }

  const sandboxUser = {
    id: `local-${info.localNine}`,
    phone: info.e164,
    full_name: metadata?.fullName || 'Client RUSH',
    role: (metadata?.role || 'client') as UserRole,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SANDBOX_AUTH_KEY, JSON.stringify(sandboxUser));
  }

  return {
    success: true,
    mode: 'sandbox',
    message: 'Session OTP Cameroun activée.',
    user: sandboxUser,
  };
}

export async function requestEmailOtp(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, mode: 'sandbox', message: 'Adresse e-mail invalide.' };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
      },
    });
    if (!error) {
      return {
        success: true,
        mode: 'live',
        message: `Lien magique / code envoyé à ${trimmed}.`,
      };
    }
  } catch {
    // Fallback sandbox
  }

  return {
    success: true,
    mode: 'sandbox',
    message: `Mode Sandbox : utilisez la connexion par numéro +237 (code 123456) pour ${trimmed}.`,
  };
}

export async function signOutUser(): Promise<void> {
  clearLocalAuthSession();
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore when offline
  }
}
