# RUSH — 08 Admin Audit

Réalisé le 5 juin 2026.

## Audit de la Sécurité et de la Supervision de l'Espace Administrateur

Ce rapport détaille les contrôles de sécurité restreignant l'accès aux privilèges d'administration sur RUSH.

### 1. Route et Supervision de l'Espace Admin
Le tableau de bord d'administration est disponible sur la route `/admin` (fichier `app/admin/page.tsx`). Il permet de valider les marchands, d'approuver ou de rejeter les candidatures de livreurs, de superviser les commandes en temps réel, de valider les transactions et de gérer les litiges.

### 2. Isolation Visuelle de la Navigation
Par mesure de discrétion et de sécurité (Security through Obscurity), aucun bouton ou lien menant vers `/admin` n'est affiché dans l'interface de navigation publique destinée aux clients ordinaires. L'accès s'effectue par saisie directe de l'URL ou via le compte connecté d'un administrateur.

### 3. Protection d'Accès par Middleware (Next.js Edge Middleware)
La route `/admin` est strictement protégée par le fichier `middleware.ts` à la racine du projet. 
Si une requête cible une sous-page `/admin` :
1. Le middleware interroge la session de l'utilisateur connecté via Supabase Auth.
2. Si l'utilisateur n'est pas connecté, il est immédiatement redirigé vers la page de connexion `/account`.
3. Si l'utilisateur est connecté, le middleware effectue une requête SQL sécurisée sur la table `profiles` pour vérifier son rôle.
4. Si le rôle de l'utilisateur n'est pas `'admin'`, il est instantanément redirigé vers la page d'accueil `/` avec un accès refusé.

```typescript
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/account', request.url));
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
```

### 4. Permissions SQL (Bypass de RLS)
Dans PostgreSQL (Supabase), le rôle de l'administrateur est configuré pour avoir accès en lecture et écriture sur toutes les tables de la base de données.
* Les politiques RLS intègrent systématiquement une clause autorisant les administrateurs :
  `or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`
* Les actions critiques (validation d'abonnements marchands, approbation de pièces d'identité de livreurs) sont exclusivement réservées au rôle `admin` :
  `using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))`

---

## Conclusion de l'audit
La sécurité du panneau d'administration est robuste. La double barrière (Edge Middleware bloquant l'accès HTTP aux non-admins et politiques RLS PostgreSQL restreignant l'accès aux données au niveau de la base de données) garantit une étanchéité sans faille de la plateforme RUSH.
