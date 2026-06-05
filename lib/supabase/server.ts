import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Le comportement setAll peut lever une exception s'il est appelé depuis
            // un Server Component (car les cookies ne peuvent pas être modifiés après le rendu).
            // Cela peut être ignoré si le middleware gère le rafraîchissement des tokens.
          }
        },
      },
    }
  );
}
