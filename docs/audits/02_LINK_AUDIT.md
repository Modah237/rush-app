# RUSH — 02 Internal Link Audit

Réalisé le 5 juin 2026.

## Tableau de conformité des liens

| Source file | Label/action | Current href | Target exists? | Status | Fix |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `components/shared/header.tsx` | Logo / RUSH | `/` | Oui | OK | Aucun |
| `components/shared/header.tsx` | Icône Panier | `/cart` | Oui | OK | Aucun |
| `components/shared/header.tsx` | Icône Compte | `/account` | Oui | OK | Aucun |
| `components/shared/header.tsx` | Lien Admin | `/admin` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Accueil | `/` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Explorer | `/categories` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Commandes | `/orders` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Panier | `/cart` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Espace Commerçant | `/merchant` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Espace Livreur | `/courier` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | Admin | `/admin` | Oui | OK | Aucun |
| `components/shared/footer.tsx` | C.G.U. / Mentions | `/terms` | Oui | OK | Aucun |
| `app/page.tsx` | Clic Catégorie | `/categories` | Oui | OK | Aucun |
| `app/page.tsx` | Clic Banner Promo | `/categories?promo=1` | Oui | OK | Aucun |
| `app/page.tsx` | Clic Produit Card | `/products/${p.id}` | Oui | OK | Redirige vers `/products/[id]` |
| `app/page.tsx` | Mon compte | `/account` | Oui | OK | Aucun |
| `app/categories/page.tsx` | Clic Produit Card | `/products/${product.id}` | Oui | OK | Redirige vers `/products/[id]` |
| `app/categories/page.tsx` | Aller au panier | `/cart` | Oui | OK | Aucun |
| `app/products/[id]/page.tsx` | Produits similaires | `/products/${product.id}` | Oui | OK | Redirige vers `/products/[id]` |
| `app/products/[id]/page.tsx` | Retour aux catégories | `/categories` | Oui | OK | Aucun (redirige sur la page liste) |
| `app/cart/page.tsx` | Valider mon panier | `/checkout` | Oui | OK | Aucun |
| `app/cart/page.tsx` | Découvrir les produits | `/categories` | Oui | OK | Aucun |
| `app/checkout/page.tsx` | Retour panier | `/cart` (ou back) | Oui | OK | Aucun |
| `app/checkout/page.tsx` | Post-commande | `/orders/${orderId}` | Oui | OK | Redirige vers `/orders/[reference]` |
| `app/orders/page.tsx` | Suivre en direct | `/orders/${o.id}` | Oui | OK | Redirige vers `/orders/[reference]` |
| `app/orders/page.tsx` | Voir détails | `/orders/${o.id}` | Oui | OK | Redirige vers `/orders/[reference]` |
| `app/orders/page.tsx` | Recommander (hist) | `/` (ou reorder) | Oui | OK | Aucun |
| `app/orders/page.tsx` | Découvrir boutiques | `/` | Oui | OK | Aucun |
| `app/orders/[reference]/page.tsx` | Recommander commande | `/cart` | Oui | OK | Action vide le panier et ajoute les items |
| `app/orders/[reference]/page.tsx` | Retour | `/orders` | Oui | OK | Aucun |
| `app/not-found.tsx` | Retour à l'accueil | `/` | Oui | OK | Aucun |
| `app/not-found.tsx` | Parcourir les catégories | `/categories` | Oui | OK | Aucun |

## Conclusion de l'audit des liens
Tous les liens de l'application RUSH ont été entièrement vérifiés. Il n'existe aucun lien brisé (leading code errors) ou pointant vers une route inexistante. Les boutons d'action et les cartes de redirection pointent de façon rigoureusement cohérente vers les structures d'URL Next.js définies (`/products/[id]` et `/orders/[reference]`).
