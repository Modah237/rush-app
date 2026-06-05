# RUSH — Route Audit Report (Phase 2)

Ce rapport dresse l'état complet du système de routage Next.js App Router pour la plateforme RUSH, daté du 5 juin 2026.

## Manifeste technique des routes (25 Routes)

| Route | File Path | Exists | Current Behavior | Incoming Links | Outgoing Links | Data Source | Auth | Status | Fix Required |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `/` | `app/page.tsx` | **Yes** | Page d'accueil client RUSH | Header, Footer | `/categories`, `/cart`, `/orders`, `/merchant`, `/rider`, `/drive` | `lib/data/` | None | **OK** | Reconstruire pour en faire la vitrine marketplace. |
| `/categories` | `app/categories/page.tsx` | **Yes** | Liste et filtre des catégories | Header, `/` | `/products/[id]`, `/cart` | `lib/data/` | None | **OK** | Aucune. |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | **Yes** | Catégorie filtrée spécifique | `/categories` | `/products/[id]` | `lib/data/` | None | **OK** | Aucune. |
| `/products/[id]` | `app/products/[id]/page.tsx` | **Yes** | Détail d'un produit (e.g. `p1`) | `/`, `/categories` | `/cart`, `/categories` | `lib/data/` | None | **OK** | Gérer le cas de produit non trouvé avec l'écran `ProductNotFound`. |
| `/cart` | `app/cart/page.tsx` | **Yes** | Panier d'achat local client | Header, `/products/[id]` | `/checkout`, `/categories` | `CartContext` | None | **OK** | Aucune. |
| `/checkout` | `app/checkout/page.tsx` | **Yes** | Écran de validation & paiement MoMo | `/cart` | `/orders/[reference]` | `CartContext` | None | **OK** | Rediriger vers la référence de commande créée. |
| `/orders` | `app/orders/page.tsx` | **Yes** | Liste des commandes de l'utilisateur | Footer, Header | `/orders/[reference]` | `MOCK_ORDERS` | None | **OK** | Corriger les liens de suivi vers `/orders/[reference]`. |
| `/orders/[reference]` | `app/orders/[reference]/page.tsx` | **Yes** | Suivi d'une commande (e.g. `RSH-20492`)| `/orders`, `/checkout` | `/orders`, `/` | `MOCK_ORDERS` | None | **OK** | Gérer le cas de commande non trouvée avec l'écran `OrderNotFound`. |
| `/promos` | `app/promos/page.tsx` | **Yes** | Page des codes de réductions | `/`, Header | `/categories` | Codes mockés | None | **OK** | Aucune. |
| `/merchant` | `app/merchant/page.tsx` | **Yes** | Acquisition marchands (`merchant.rush`) | Footer | `/merchant/dashboard`, `/` | Statique | None | **OK** | Transformer en landing page acquisition (déplacer dashboard). |
| `/merchant/dashboard` | `app/merchant/dashboard/page.tsx` | **No** | Dashboard de gestion commerçant | `/merchant` | `/merchant/dashboard` | Supabase & Mock | None | **TODO** | Créer le fichier et y déplacer le code de gestion du catalogue. |
| `/rider` | `app/rider/page.tsx` | **No** | Acquisition livreurs (`rider.rush`) | Footer | `/rider/dashboard`, `/` | Statique | None | **TODO** | Créer le fichier avec les avantages, conditions et FAQ. |
| `/rider/dashboard` | `app/rider/dashboard/page.tsx` | **No** | Dashboard de livraison livreurs | `/rider` | `/rider/dashboard` | Mock livreur | None | **TODO** | Créer le fichier et y déplacer la logique de livraison. |
| `/courier` | `app/courier/page.tsx` | **Yes** | Ancienne route livreur | Footer | `/` | None | None | **BROKEN** | Rediriger immédiatement vers `/rider` via `redirect('/rider')`. |
| `/drive` | `app/drive/page.tsx` | **No** | Service B2B livraison à la demande | Footer | `/drive`, `/` | Statique | None | **TODO** | Créer la page de présentation drive.rush. |
| `/admin` | `app/admin/page.tsx` | **Yes** | Dashboard d'administration global | Logo Point, Footer | `/` | Supabase | Admin | **OK** | Protégé par middleware. Masquer de la navigation publique. |
| `/account` | `app/account/page.tsx` | **Yes** | Gestion du compte et profil client | Header | `/orders`, `/` | Session | None | **OK** | Aucune. |
| `/login` | - | **No** | Intégré à la page `/account` | Aucun | - | - | - | **OK** | L'authentification est simulée directement dans `/account`. |
| `/register` | - | **No** | Intégré à la page `/account` | Aucun | - | - | - | **OK** | L'authentification est simulée directement dans `/account`. |
| `/help` | `app/help/page.tsx` | **No** | Page d'aide et assistance RUSH | Footer | `/` | Statique | None | **TODO** | Créer une page d'aide propre aux couleurs de RUSH. |
| `/contact` | `app/contact/page.tsx` | **No** | Formulaire de contact | Footer | `/` | Statique | None | **TODO** | Créer une page contact / support. |
| `/faq` | `app/faq/page.tsx` | **No** | FAQ générale RUSH | Footer | `/` | Statique | None | **TODO** | Créer une page FAQ. |
| `/terms` | `app/terms/page.tsx` | **Yes** | Conditions Générales d'Utilisation | Footer | `/` | Statique | None | **OK** | Aucune. |
| `/privacy` | `app/privacy/page.tsx` | **No** | Politique de confidentialité | Footer | `/` | Statique | None | **TODO** | Créer un placeholder premium de charte de vie privée. |
| `/refunds` | `app/refunds/page.tsx` | **No** | Politique de remboursement | Footer | `/` | Statique | None | **TODO** | Créer un placeholder de remboursement. |

---

## Synthèse du Plan de Réparation
1. **Création des pages d'acquisition :** `/rider` et `/drive` seront créées comme de nouveaux répertoires et fichiers physiques.
2. **Scission de l'Espace Marchand :** La route `/merchant` devient statique et le dashboard est déplacé sous `/merchant/dashboard`.
3. **Scission de l'Espace Livreur :** La route `/rider` devient statique et le dashboard est créé sous `/rider/dashboard`. La route historique `/courier` effectue une redirection automatique vers `/rider`.
4. **Création des placeholders premium :** Les pages `/help`, `/contact`, `/faq`, `/privacy`, et `/refunds` seront ajoutées pour éviter toute 404 brute.
