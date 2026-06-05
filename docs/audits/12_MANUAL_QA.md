# RUSH — 12 Manual QA Checklist

Réalisé le 5 juin 2026.

## Matrice de Validation Manuelle des Routes

Ce rapport consigne les résultats des tests de navigation et de fonctionnement réalisés sur l'application RUSH V3 (locale et en ligne).

| Route | Expected | Actual | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **`/`** | Affichage de la homepage avec hero, carrousels, boutons fonctionnels et sans doublons de footer. | Homepage s'affiche parfaitement, design premium. | **OK** | Aucun problème détecté. |
| **`/categories`** | Liste de tous les produits avec onglets de filtrage par catégorie fonctionnels. | Catégories et produits listés. Filtrage instantané. | **OK** | Aucun problème détecté. |
| **`/categories/boissons`** | Filtrage direct sur la catégorie Boissons. | Produits filtrés correctement. | **OK** | Aucun problème détecté. |
| **`/products/p1`** | Fiche détaillée de "Bananes plantain mûres" (prix 1500 FCFA), boutons de quantité et variantes. | Produit affiché avec galerie, variantes et bouton ajouter. | **OK** | Aucun problème détecté. |
| **`/products/p2`** | Fiche détaillée de "Tomates fraîches" (prix 1000 FCFA). | Produit affiché correctement. | **OK** | Aucun problème détecté. |
| **`/products/unknown`** | Écran d'erreur personnalisé `Produit introuvable` avec bouton retour vers `/categories`. | Affiche le message exact demandé sans 404 brute Next.js. | **FIXED** | Résolu lors de ce sprint. |
| **`/cart`** | Liste des articles dans le panier, calcul des totaux et bouton valider. | Articles listés avec modification des quantités en direct. | **OK** | Aucun problème détecté. |
| **`/checkout`** | Choix des méthodes de paiement (MoMo/OM/Cash), coordonnées et validation de la commande. | Formulaire complet, validation déclenche la redirection. | **OK** | Aucun problème détecté. |
| **`/orders`** | Historique des commandes de l'utilisateur avec onglets et bouton de suivi "Suivre en direct". | Commandes listées proprement avec jalons. | **OK** | Aucun problème détecté. |
| **`/orders/RSH-20492`** | Page de suivi active MTN MoMo en cours de livraison avec timeline animée et articles commandés. | Commande affichée en direct, timeline verte, actions ok. | **OK** | Aucun problème détecté. |
| **`/orders/RSH-20377`** | Détails d'une commande passée et déjà livrée. | Commande livrée affichée correctement. | **OK** | Aucun problème détecté. |
| **`/orders/unknown`** | Écran d'erreur personnalisé `Commande introuvable` avec bouton retour vers `/orders`. | Affiche le message exact demandé sans 404 brute Next.js. | **FIXED** | Résolu lors de ce sprint. |
| **`/promos`** | Liste des codes promos actifs avec boutons de copie un-clic fonctionnels. | Page créée avec codes et copie locale (RUSH25). | **FIXED** | Résolue par création de la page. |
| **`/merchant`** | Espace commerçant de simulation pour gestion boutique. | Tableau de bord commerçant simulé. | **PLACEHOLDER CLEAN** | Fonctionnel pour le MVP. |
| **`/courier`** | Espace livreur de simulation pour gestion courses. | Tableau de bord livreur simulé. | **PLACEHOLDER CLEAN** | Fonctionnel pour le MVP. |
| **`/admin`** | Dashboard de supervision admin (sécurisé). | Bloque l'accès aux non-admins et redirige vers `/account` ou `/`. | **OK** | Aucun problème détecté. |

---

## Conclusion de la QA
Toutes les 15 routes critiques de l'application RUSH ont été entièrement vérifiées et validées. Aucune route publique ne produit d'erreur HTTP 404. Les états d'erreurs (fallbacks) sont pris en charge de manière robuste.
