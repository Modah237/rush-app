# RUSH — 04 Cart & Checkout Audit

Réalisé le 5 juin 2026.

## Analyse du Système de Panier et Checkout

Ce rapport détaille la robustesse et la sécurité du flux de commande du client, de la mise au panier à la création de commande.

### 1. État du panier (`cart-context`)
Le panier est géré dans `context/cart-context.tsx` à l'aide d'un contexte React fournissant des fonctions fluides comme `addToCart`, `removeFromCart`, `updateQty`, et `clearCart`. L'état est persistant via le stockage local.

### 2. Utilisation de `localStorage`
* Les articles du panier sont sérialisés et enregistrés sous la clé `rush_cart`.
* Le code promo actif (ex: `RUSH25` copié depuis la page `/promos`) est enregistré sous la clé `rush_promo` afin de l'appliquer automatiquement lors de l'accès au checkout.

### 3. Recalcul et Validation côté Serveur
Lors de la soumission du checkout via la Server Action `placeOrder` dans `app/actions/checkout.ts`, le serveur ne fait pas confiance au prix du panier fourni par le client.
* Il recharge les produits directement depuis la source de données serveur (`MOCK_PRODUCTS`).
* Il recalcule strictement le sous-total : `unitPrice = product.price + priceDelta`.

### 4. Validation des Stocks
La Server Action vérifie que le stock restant pour chaque produit est supérieur ou égal à la quantité demandée :
`if (product.stock < item.qty) return { success: false, message: 'Stock insuffisant' }`

### 5. Calcul des Frais de Livraison
La règle de calcul est appliquée de manière uniforme :
* Si le sous-total est supérieur ou égal à **10 000 FCFA**, la livraison est **gratuite**.
* Sinon, les frais de livraison s'élèvent à **700 FCFA**.

### 6. Traitement des Codes Promo
Le code `RUSH25` est supporté en dur dans la Server Action et applique une réduction immédiate de **25%** sur le sous-total des articles.

### 7. Simulation et Redirection Post-Checkout
* En cas de paiement à la livraison (Cash) : redirection vers `/orders/${orderId}?confirm_cash=1`.
* En cas de paiement mobile (MTN/Orange) : initialisation de la transaction Fapshi (en mode sandbox par défaut) et redirection vers le suivi `/orders/${orderId}?simulated_payment=1`.

---

## Conclusion de l'audit
Le flux du panier au checkout est entièrement sécurisé contre la falsification des prix et la commande de produits en rupture de stock. Le recalcul et la validation sont strictement confinés au serveur de validation dans `placeOrder()`.
