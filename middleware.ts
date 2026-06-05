import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Rafraîchissement automatique de session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Protection d'accès de l'espace Admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Rediriger vers la page compte pour se connecter
      return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        // Rediriger vers l'accueil si le rôle n'est pas admin
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      // Sécurité par défaut en cas d'erreur de base de données
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Fichiers exclus (images, css statique, etc.) pour éviter des requêtes SQL inutiles.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ogg)$).*)',
  ],
};
