/**
 * Service d'intégration de l'API de paiement Fapshi
 * Permet d'initier et de vérifier des transactions MTN Mobile Money et Orange Money au Cameroun.
 */

const FAPSHI_API_URL = process.env.FAPSHI_API_URL || 'https://api.fapshi.com';
const FAPSHI_API_USER = process.env.FAPSHI_API_USER || '';
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY || '';

interface InitiatePaymentParams {
  amount: number;
  phone: string; // ex: 678451290 ou 699000000
  email?: string;
  externalId: string; // ID de notre commande (ex: RSH-20512)
  redirectUrl: string;
}

interface InitiatePaymentResponse {
  success: boolean;
  paymentUrl?: string; // Lien de redirection
  message?: string;
  transId?: string; // ID de transaction côté Fapshi
}

export async function initiatePayment({
  amount,
  phone,
  email = 'client@rush.cm',
  externalId,
  redirectUrl,
}: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
  // Si les clés de production ne sont pas configurées, on simule un paiement sandbox réussi
  if (!FAPSHI_API_USER || !FAPSHI_API_KEY) {
    console.warn("Fapshi API credentials manquants. Mode sandbox simulation activé.");
    const isSub = externalId.startsWith('SUB-');
    const fallbackUrl = isSub 
      ? `/merchant?simulated_subscription=1&sub_id=${externalId}`
      : `/orders/${externalId}?simulated_payment=1`;
    return {
      success: true,
      paymentUrl: fallbackUrl,
      transId: `FAP-${Math.floor(Math.random() * 900000 + 100000)}`,
      message: 'Simulation Sandbox initialisée avec succès.',
    };
  }

  // Nettoyage du numéro de téléphone (Fapshi attend le format standard camerounais sans code pays par défaut, ou avec)
  // Par exemple : 678451290 (9 chiffres) ou 237678451290
  let cleanPhone = phone.replace(/\s+/g, '');
  if (cleanPhone.startsWith('+237')) {
    cleanPhone = cleanPhone.slice(4);
  } else if (cleanPhone.startsWith('237') && cleanPhone.length > 9) {
    cleanPhone = cleanPhone.slice(3);
  }

  try {
    const response = await fetch(`${FAPSHI_API_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_user': FAPSHI_API_USER,
        'api_key': FAPSHI_API_KEY,
      },
      body: JSON.stringify({
        amount: amount,
        phone: cleanPhone,
        email: email,
        userId: 'RUSH_PLATFORM',
        externalId: externalId,
        redirectUrl: redirectUrl,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        message: errData.message || 'Erreur lors de l\'initialisation du paiement Fapshi',
      };
    }

    const data = await response.json();
    // Le format de retour de Fapshi : { link: "https://fapshi.com/pay/...", transId: "..." }
    return {
      success: true,
      paymentUrl: data.link,
      transId: data.transId,
      message: 'Paiement Fapshi initialisé avec succès.',
    };
  } catch (error) {
    console.error('Erreur de requête Fapshi initiatePayment:', error);
    return {
      success: false,
      message: 'Impossible de contacter le service de paiement Fapshi.',
    };
  }
}

/**
 * Permet de vérifier le statut d'une transaction Fapshi
 */
export async function verifyPayment(transId: string): Promise<{ success: boolean; status: 'paid' | 'failed' | 'pending'; raw?: any }> {
  if (!FAPSHI_API_USER || !FAPSHI_API_KEY) {
    return { success: true, status: 'paid' }; // Sandbox simulation
  }

  try {
    const response = await fetch(`${FAPSHI_API_URL}/payment/status/${transId}`, {
      method: 'GET',
      headers: {
        'api_user': FAPSHI_API_USER,
        'api_key': FAPSHI_API_KEY,
      },
    });

    if (!response.ok) {
      return { success: false, status: 'pending' };
    }

    const data = await response.json();
    // Format attendu : { status: "successful" | "failed" | "pending", ... }
    let status: 'paid' | 'failed' | 'pending' = 'pending';
    if (data.status === 'successful') status = 'paid';
    else if (data.status === 'failed') status = 'failed';

    return {
      success: true,
      status,
      raw: data,
    };
  } catch (error) {
    console.error('Erreur verification paiement Fapshi:', error);
    return { success: false, status: 'pending' };
  }
}
