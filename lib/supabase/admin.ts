import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSessionClient } from './server';

/**
 * Crée un client Supabase avec SUPABASE_SERVICE_ROLE_KEY pour les opérations serveur
 * sans session utilisateur (ex: Webhooks Fapshi, écritures systèmes sécurisées).
 * Bascule proprement sur le client serveur standard si la clé Service Role est absente.
 */
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createServerSessionClient();
}
