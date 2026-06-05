# RUSH — Asset Audit Report (Phase 1)

Ce rapport dresse l'inventaire complet des ressources visuelles de la plateforme RUSH, réalisé le 5 juin 2026. Tous les fichiers d'images et logos ont été analysés et normalisés dans le dossier public `public/rush/` afin d'assurer un accès direct et d'éviter les liens brisés.

## Table d'audit des actifs (Audited Assets)

| Asset Path | Type | Dimensions | Suggested Use | Status | Normalized Target Path |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `rush/assets/logo-horizontal.jpeg` | JPEG | 300x161 | Logo de marque horizontal principal | **USE** | `public/rush/brand/logo-horizontal.jpg` |
| `rush/assets/logo-mark.jpeg` | JPEG | 1105x1600 | Logo icône vertical grand format | **USE** | `public/rush/brand/logo-mark.jpg` |
| `rush/assets/mark-red.png` | PNG | 1105x1600 | Marque RUSH rouge transparente | **USE** | `public/rush/brand/mark-red.png` |
| `rush/assets/mark-white.png` | PNG | 1105x1600 | Marque RUSH blanche transparente | **USE** | `public/rush/brand/mark-white.png` |
| `public/assets/rush_courier.png` | JPEG | 1024x1024 | Visuel principal livreur RUSH | **USE** | `public/rush/rider/courier-hero.jpg` |
| `uploads/WhatsApp Image... (10).jpeg` | JPEG | 1600x1600 | Image de fond pour le héros client | **USE** | `public/rush/home/home-hero.jpg` |
| `uploads/WhatsApp Image... (1).jpeg` | JPEG | 1600x856 | Grille ou bandeau de catégories | **USE** | `public/rush/home/categories-grid.jpg` |
| `uploads/WhatsApp Image... (3).jpeg` | JPEG | 1600x373 | Bannière promo 1 (RUSH25) | **USE** | `public/rush/home/banner-promo-1.jpg` |
| `uploads/WhatsApp Image... (4).jpeg` | JPEG | 1600x373 | Bannière promo 2 (Mobile Money) | **USE** | `public/rush/home/banner-promo-2.jpg` |
| `uploads/WhatsApp Image... (6).jpeg` | JPEG | 1600x373 | Bannière promo 3 (Grocery Packs) | **USE** | `public/rush/home/banner-promo-3.jpg` |
| `uploads/WhatsApp Image... .jpeg` | JPEG | 1472x832 | Image d'arrière-plan client ou splash | **USE** | `public/rush/home/hero-bg.jpg` |
| `uploads/WhatsApp Image... (5).jpeg` | JPEG | 1104x1600 | Flyer d'enrôlement commerçant | **USE** | `public/rush/merchant/partner-join.jpg` |
| `uploads/WhatsApp Image... (7).jpeg` | JPEG | 1104x1600 | Flyer marketing ou promotionnel | **USE** | `public/rush/merchant/flyer.jpg` |
| `uploads/WhatsApp Image... (9).jpeg` | JPEG | 1472x832 | Capture d'écran application livreur | **USE** | `public/rush/rider/app-preview.jpg` |
| `uploads/WhatsApp Image... (11).jpeg` | JPEG | 1472x832 | Visuel de livraison pro B2B | **USE** | `public/rush/drive/b2b-delivery.jpg` |
| `uploads/WhatsApp Image... (2).jpeg` | JPEG | 300x161 | Doublon exact de `logo-horizontal.jpeg` | **DUPLICATE** | - |
| `uploads/WhatsApp Image... (8).jpeg` | JPEG | 1105x1600 | Doublon exact de `logo-mark.jpeg` | **DUPLICATE** | - |

---

## Classification des actifs par domaine

### 1. Brand (Marque)
* **Logo principal :** `public/rush/brand/logo-horizontal.jpg`
* **Badge rouge :** `public/rush/brand/mark-red.png`
* **Badge blanc :** `public/rush/brand/mark-white.png`
* **Favicon / App Icon :** `public/favicon.ico`

### 2. Homepage (Accueil)
* **Visuel Hero :** `public/rush/home/home-hero.jpg`
* **Fond Hero :** `public/rush/home/hero-bg.jpg`
* **Bandeau de catégories :** `public/rush/home/categories-grid.jpg`
* **Bannières promotionnelles :**
  * `public/rush/home/banner-promo-1.jpg` (RUSH25)
  * `public/rush/home/banner-promo-2.jpg` (MoMo / Orange Money)
  * `public/rush/home/banner-promo-3.jpg` (Packs mensuels)

### 3. Products & Shops (Produits & Magasins)
* **Cartes produits / détails :** Utilisation des glyphs ou des fallbacks vectoriels dynamiques en plus des miniatures distantes (via Unsplash) pour une tolérance totale aux pannes réseau.

### 4. Espace Marchand (`merchant.rush`)
* **Flyer d'enrôlement :** `public/rush/merchant/partner-join.jpg`
* **Visuel promotionnel commerçant :** `public/rush/merchant/flyer.jpg`

### 5. Espace Livreur (`rider.rush`)
* **Image d'accueil livreur :** `public/rush/rider/courier-hero.jpg`
* **Mockup de l'application mobile :** `public/rush/rider/app-preview.jpg`

### 6. Livraison Pro (`drive.rush`)
* **Image d'illustration B2B :** `public/rush/drive/b2b-delivery.jpg`
