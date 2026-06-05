# RUSH — 07 Courier Audit

Réalisé le 5 juin 2026.

## Audit de l'Espace Livreur & Suivi des Candidatures

Ce rapport analyse la sécurité, la validation d'identité et les règles d'attribution des courses pour les livreurs partenaires de RUSH.

### 1. Route et Interface de l'Espace Livreur
L'espace livreur est disponible sur la route `/courier` (fichier `app/courier/page.tsx`). Il s'agit d'un tableau de bord de simulation permettant aux livreurs de soumettre leurs justificatifs d'identité et de suivre l'état de leurs livraisons.

### 2. Inscription et Dépôt des Pièces Justificatives
Pour devenir livreur RUSH, l'utilisateur doit soumettre :
* Une pièce d'identité en cours de validité (`identity_document_url`).
* Un justificatif de domicile récent (`proof_of_address_url`).
* Un extrait de casier judiciaire (`criminal_record_url`).
Ces informations sont enregistrées dans la table `public.courier_applications`. Le livreur renseigne également son type de véhicule (moto, voiture, etc.) et son immatriculation.

### 3. Statuts et Flux de Validation
Le cycle de validation de la candidature du livreur suit le type enum `courier_application_status` :
* `submitted` : Candidature déposée.
* `under_review` : En cours d'analyse par l'équipe administrative.
* `approved` : Validé (le livreur peut maintenant travailler).
* `rejected` : Candidature rejetée (avec motif).

La fonction utilitaire PostgreSQL `public.is_courier_approved(courier_uid uuid)` permet de vérifier instantanément si un coursier a été validé par l'administration :
```sql
select exists (
  select 1 
  from public.courier_applications 
  where user_id = courier_uid 
    and status = 'approved'
)
```

### 4. Enforcement Métier : Attribution de Course et Validation
Un livreur ne peut pas recevoir d'attribution de commande ou de livraison si sa candidature n'est pas au statut `approved`. Cette règle est renforcée directement par le trigger `check_courier_approval_for_assignment` sur les tables `orders` et `deliveries` :
```sql
create or replace function public.check_courier_approval_for_assignment()
returns trigger as $$
begin
  if new.courier_id is not null then
    if not public.is_courier_approved(new.courier_id) then
      raise exception 'Un livreur ne peut recevoir aucune livraison tant que son dossier n’est pas approved.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
```

### 5. Isolation des Données (RLS)
Le livreur ne peut accéder qu'aux informations qui le concernent directement :
* **Candidature :** Un livreur ne peut voir que sa propre fiche de candidature (`user_id = auth.uid()`).
* **Livraisons :** Un livreur ne peut voir et modifier que les livraisons qui lui ont été explicitement attribuées (`courier_id = auth.uid()`).

---

## Conclusion de l'audit
Le processus d'intégration et d'enforcement des livreurs est totalement étanche. Le trigger d'attribution de course empêche toute affectation accidentelle ou malveillante à un livreur non vérifié, garantissant la sécurité des colis et de la clientèle.
