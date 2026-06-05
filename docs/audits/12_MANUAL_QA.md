# RUSH — Manual QA Report (Phase 15)

Réalisé le 6 juin 2026.

## Matrice de Validation Manuelle des Routes

Ce rapport consigne les résultats des tests de navigation et de fonctionnement réalisés sur l'application Next.js RUSH V3 après l'intégration système complète.

| Route | Expected Behavior | Actual Behavior | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **`/`** | Affichage de la homepage client RUSH avec hero, catégories, bannières, et cartes d'enrôlement partenaires. Sans double footer. | Homepage premium, visuels normés, cartes partenaires présentes. | **OK** | Aucun problème détecté. |
| **`/categories`** | Liste de tous les produits avec onglets de filtrage par catégorie et barre de recherche. | Catégories et produits listés. Filtrage et recherche instantanés. | **OK** | Aucun problème détecté. |
| **`/categories/boissons`** | Filtrage direct sur la catégorie Boissons. | Produits boissons filtrés correctement. | **OK** | Aucun problème détecté. |
| **`/products/p1`** | Fiche détaillée de "Bananes plantain mûres" (prix 1500 FCFA), boutons de quantité et variantes. | Produit affiché avec galerie, variantes et bouton ajouter. | **OK** | Aucun problème détecté. |
| **`/products/p2`** | Fiche détaillée de "Tomates fraîches" (prix 1000 FCFA). | Produit affiché correctement. | **OK** | Aucun problème détecté. |
| **`/products/unknown`** | Écran d'erreur personnalisé `Produit introuvable` avec bouton retour vers `/categories`. | Affiche le message exact demandé sans 404 brute Next.js. | **FIXED** | Résolu lors de ce sprint. |
| **`/cart`** | Liste des articles dans le panier, calcul des totaux et bouton valider. | Articles listés avec modification des quantités en direct. | **OK** | Aucun problème détecté. |
| **`/checkout`** | Choix des méthodes de paiement (MoMo/OM/Cash), coordonnées et validation de la commande. | Formulaire complet, validation déclenche la création de commande. | **OK** | Aucun problème détecté. |
| **`/orders`** | Historique des commandes de l'utilisateur avec bouton de suivi en direct. | Commandes listées proprement avec jalons. | **OK** | Aucun problème détecté. |
| **`/orders/RSH-20492`** | Page de suivi active MTN MoMo en cours de livraison avec timeline animée et articles commandés. | Commande affichée en direct, timeline verte, actions ok. | **OK** | Aucun problème détecté. |
| **`/orders/RSH-20377`** | Détails d'une commande passée et déjà livrée. | Commande livrée affichée correctement. | **OK** | Aucun problème détecté. |
| **`/orders/unknown`** | Écran d'erreur personnalisé `Commande introuvable` avec bouton retour vers `/orders`. | Affiche le message exact demandé sans 404 brute Next.js. | **FIXED** | Résolu lors de ce sprint. |
| **`/promos`** | Liste des codes promos actifs avec boutons de copie un-clic fonctionnels. | Page créée avec codes et copie locale (RUSH25). | **OK** | Aucun problème détecté. |
| **`/merchant`** | Landing page d'acquisition marchands (`merchant.rush`) avec tarifs et bouton d'inscription. | Landing page acquisition avec FAQ et CTA partenaires. | **OK** | Aucun problème détecté. |
| **`/merchant/dashboard`** | Tableau de bord commerçant (gestion catalogue et commandes). | Tableau de bord avec catalogue, commandes reçues et abonnements. | **OK** | Aucun problème détecté. |
| **`/rider`** | Landing page d'acquisition livreurs (`rider.rush`) avec conditions d'inscription. | Landing page acquisition avec documents requis et FAQ. | **OK** | Aucun problème détecté. |
| **`/rider/dashboard`** | Tableau de bord livreur (enrôlement, CNI/casier, courses assignées). | Tableau de bord de livraison actif simulé. | **OK** | Aucun problème détecté. |
| **`/courier`** | Redirection vers la nouvelle route `/rider`. | Redirige immédiatement l'utilisateur vers `/rider`. | **FIXED** | Redirection implémentée. |
| **`/drive`** | Page du service de livraison à la demande B2B (`drive.rush`). | Présentation drive.rush avec simulateur de tarif de course. | **OK** | Aucun problème détecté. |
| **`/admin`** | Dashboard de supervision admin (sécurisé). | Bloque l'accès aux non-admins et redirige vers `/account` ou `/`. | **OK** | Aucun problème détecté. |

---

## Conclusion de la QA
Toutes les routes critiques et de démonstration de RUSH V3 ont été entièrement vérifiées et validées. Aucune route publique ne produit d'erreur HTTP 404. Les redirections et les états d'erreurs (fallbacks) sont pris en charge de manière robuste. Le build de production Next.js compile parfaitement sans aucun avertissement.
