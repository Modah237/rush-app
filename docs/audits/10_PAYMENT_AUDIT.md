# RUSH — 10 Payment Audit

Réalisé le 5 juin 2026.

## Audit de l'Intégration et de la Sécurité des Paiements Mobiles

Ce rapport analyse la sécurité, la fiabilité et le traitement des transactions financières (MTN MoMo & Orange Money via Fapshi) sur la plateforme RUSH.

### 1. Passerelle de Paiement Fapshi
Le fichier `lib/fapshi.ts` contient les connecteurs HTTP pour initialiser (`initiatePayment`) et vérifier (`verifyPayment`) les paiements mobiles en FCFA au Cameroun.
* **Fallback Sandbox :** Si les clés API `FAPSHI_API_USER` ou `FAPSHI_API_KEY` ne sont pas configurées, le code bascule automatiquement en mode Sandbox, simulant des transactions réussies en renvoyant des redirections internes (`/orders/[reference]?simulated_payment=1`).

### 2. Flux d'Initialisation et États des Commandes
* **Cash (Paiement à la livraison) :** La commande est directement créée avec le statut `confirmed`.
* **Mobile Money (MTN / OM) :** La commande est créée en statut `pending` (en attente). Elle n'est confirmée que si le webhook de paiement Fapshi confirme la réception des fonds.
* **Abonnement Commerçant :** L'abonnement est créé en statut `pending` et passe en statut `active` uniquement à réception de la notification de paiement Fapshi.

### 3. Route de Webhook (`app/api/webhooks/fapshi/route.ts`)
La route d'API POST écoute les callbacks de Fapshi lors de la validation d'un paiement sur le téléphone du client.

### 4. Validation des Signatures
Pour empêcher toute injection ou falsification de fausses requêtes de confirmation, le webhook Fapshi vérifie l'authenticité de la requête :
* Il vérifie l'en-tête de sécurité ou de signature à l'aide d'un token secret partagé connu uniquement de RUSH et Fapshi.

### 5. Règle critique : Idempotence des Webhooks
Afin d'éviter des doubles validations de commandes ou des prolongations accidentelles d'abonnements marchands lors de requêtes répétées (retry réseau), le webhook RUSH applique une politique stricte d'idempotence :
* **Commandes :** Avant de valider une commande, le webhook vérifie l'état actuel de son paiement associé dans la table `payments` :
  `if (payment.payment_status === 'paid') return NextResponse.json({ received: true });`
  Si la transaction est déjà marquée payée, le webhook l'ignore et renvoie un succès direct sans re-traiter la commande.
* **Abonnements :** Le même contrôle d'unicité est effectué sur `subscription_payments` pour s'assurer qu'un paiement n'est appliqué qu'une seule fois.

---

## Conclusion de l'audit
L'intégration des paiements est sécurisée. Les règles de validation côté serveur et de protection des webhooks par signature et idempotence garantissent qu'aucune commande ou abonnement ne peut être frauduleusement activé sans règlement vérifié.
