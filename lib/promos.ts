export interface PromoDefinition {
  code: string;
  discountLabel: string;
  title: string;
  description: string;
  minAmount: number;
  minAmountLabel: string;
  expiry: string;
  tint: string;
  ink: string;
  type: 'percent' | 'fixed' | 'free_delivery' | 'gift';
  value: number;
  requiredPaymentMethod?: 'mtn' | 'orange';
}

export const RUSH_PROMOS: PromoDefinition[] = [
  {
    code: 'RUSH25',
    discountLabel: '-25%',
    title: 'Offre Spéciale RUSH',
    description: 'Bénéficiez de 25% de réduction immédiate sur tous vos articles favoris.',
    minAmount: 0,
    minAmountLabel: 'Sans minimum',
    expiry: "Valable jusqu'au 31 Déc 2026",
    tint: '#FFE9EB',
    ink: '#F50012',
    type: 'percent',
    value: 25,
  },
  {
    code: 'BIENVENUE',
    discountLabel: 'Gratuit',
    title: 'Livraison Offerte',
    description: 'Frais de livraison offerts pour célébrer votre première commande RUSH.',
    minAmount: 3000,
    minAmountLabel: 'Min. commande 3 000 FCFA',
    expiry: 'Valable 30 jours',
    tint: '#E6F6EC',
    ink: '#15A05A',
    type: 'free_delivery',
    value: 0,
  },
  {
    code: 'MOMO500',
    discountLabel: '-500 F',
    title: 'Bonus MTN MoMo',
    description: 'Réduction exclusive de 500 FCFA sur votre commande dès 5 000 FCFA.',
    minAmount: 5000,
    minAmountLabel: 'Min. commande 5 000 FCFA',
    expiry: 'Valable tout le mois',
    tint: '#FFF6D6',
    ink: '#C79A00',
    type: 'fixed',
    value: 500,
    requiredPaymentMethod: 'mtn',
  },
  {
    code: 'ORANGEDG',
    discountLabel: 'Offert',
    title: 'Ndolé de Fête',
    description: 'Une portion individuelle de Ndolé traditionnel offerte (ou -1 000 FCFA dès 15 000 FCFA).',
    minAmount: 15000,
    minAmountLabel: 'Min. commande 15 000 FCFA',
    expiry: 'Ce week-end uniquement',
    tint: '#FFE9D6',
    ink: '#E2730B',
    type: 'fixed',
    value: 1000,
  },
];

export interface PromoEvaluation {
  valid: boolean;
  promo?: PromoDefinition;
  discountAmount: number;
  freeDelivery: boolean;
  reason?: string;
}

/**
 * Évalue un code promo de façon déterministe côté client et serveur.
 */
export function evaluatePromoCode(
  rawCode: string | null | undefined,
  subtotal: number,
  paymentMethod?: 'mtn' | 'orange' | 'cash'
): PromoEvaluation {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, discountAmount: 0, freeDelivery: false };
  }

  const normalized = rawCode.trim().toUpperCase();
  const promo = RUSH_PROMOS.find((p) => p.code === normalized);
  if (!promo) {
    return {
      valid: false,
      discountAmount: 0,
      freeDelivery: false,
      reason: 'Code invalide ou expiré.',
    };
  }

  if (subtotal < promo.minAmount) {
    return {
      valid: false,
      promo,
      discountAmount: 0,
      freeDelivery: false,
      reason: `Minimum requis : ${promo.minAmount.toLocaleString('fr-FR')} FCFA.`,
    };
  }

  if (promo.requiredPaymentMethod && paymentMethod && paymentMethod !== promo.requiredPaymentMethod) {
    return {
      valid: false,
      promo,
      discountAmount: 0,
      freeDelivery: false,
      reason: `Réservé aux paiements ${promo.requiredPaymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'}.`,
    };
  }

  let discountAmount = 0;
  let freeDelivery = false;

  if (promo.type === 'percent') {
    discountAmount = Math.round((subtotal * promo.value) / 100);
  } else if (promo.type === 'fixed') {
    discountAmount = Math.min(subtotal, promo.value);
  } else if (promo.type === 'free_delivery') {
    freeDelivery = true;
  }

  return {
    valid: true,
    promo,
    discountAmount,
    freeDelivery,
  };
}
