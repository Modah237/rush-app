# RUSH — Internal Link Audit Report (Phase 2 & 3)

Ce rapport recense la configuration des composants de navigation et des éléments interactifs (liens `<Link>`, boutons `router.push`, redirections) pour garantir une navigation cohérente et sans erreurs de routage.

## Matrice des Liens Internes & Actions de Navigation

| Source Component | Element Type | Target Path | Old Value | Action | Correct Value | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| `Header` | Link | `/` | `/` | None | `/` | **OK** |
| `Header` | Link | `/categories` | `/categories` | None | `/categories` | **OK** |
| `Header` | Link | `/promos` | `/categories?promo=1` | Update | `/promos` | **FIX** |
| `Header` | Link | `/orders` | `/orders` | None | `/orders` | **OK** |
| `Header` | Link | `/admin` | - | None | *Masqué* | **OK** |
| `Footer` | Link | `/` | `/` | None | `/` | **OK** |
| `Footer` | Link | `/merchant` | `/merchant` | None | `/merchant` | **OK** |
| `Footer` | Link | `/merchant/dashboard`| - | **NEW** | `/merchant/dashboard` | **FIX** |
| `Footer` | Link | `/rider` | `/courier` | Update | `/rider` | **FIX** |
| `Footer` | Link | `/rider/dashboard` | - | **NEW** | `/rider/dashboard` | **FIX** |
| `Footer` | Link | `/drive` | - | **NEW** | `/drive` | **FIX** |
| `Footer` | Link | `/help` | - | **NEW** | `/help` | **FIX** |
| `Footer` | Link | `/contact` | - | **NEW** | `/contact` | **FIX** |
| `Footer` | Link | `/faq` | - | **NEW** | `/faq` | **FIX** |
| `Footer` | Link | `/privacy` | - | **NEW** | `/privacy` | **FIX** |
| `Footer` | Link | `/refunds` | - | **NEW** | `/refunds` | **FIX** |
| `Homepage (Hero)` | Form action | `/categories` | `/categories` | None | `/categories?q=...` | **OK** |
| `Homepage (Join)` | Card CTA | `/merchant` | - | **NEW** | `/merchant` | **FIX** |
| `Homepage (Join)` | Card CTA | `/rider` | - | **NEW** | `/rider` | **FIX** |
| `Homepage (Join)` | Card CTA | `/drive` | - | **NEW** | `/drive` | **FIX** |
| `ProductCard` | Card link | `/products/[id]` | `/products/[id]` | None | `/products/${p.id}` | **OK** |
| `OrderCard` | Card link | `/orders/[ref]` | `/orders/[ref]` | None | `/orders/${o.id}` | **OK** |
| `Courier page` | Redirect | `/rider` | - | **NEW** | `/rider` (redirect) | **FIX** |

---

## Directives d'Implémentation des Liens

1. **Utilisation systématique des Route Helpers :**
   Tous les composants de cartes et de navigation utiliseront les route helpers définis dans `lib/routes.ts` pour générer dynamiquement leurs URLs. Cela préviendra toute coquille de frappe et simplifiera le typage.
   
2. **Exclusion d'Admin de la navigation publique :**
   Aucun bouton "Admin" ne doit figurer dans le Header client standard. L'accès à `/admin` se fait via le logo principal (point rouge) ou l'adresse URL directe.
   
3. **Redirections Edge & Client-side :**
   Toute tentative d'accès à la route obsolète `/courier` sera automatiquement interceptée et redirigée vers `/rider` pour rediriger les livreurs vers la landing page officielle de rider.rush.
