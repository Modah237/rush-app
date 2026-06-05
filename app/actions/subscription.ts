'use server';

import { createClient } from '@/lib/supabase/server';
import { initiatePayment } from '@/lib/fapshi';

interface SubscriptionResult {
  success: boolean;
  paymentUrl?: string;
  message?: string;
}

/**
 * Initialise l'abonnement commerçant de 15 000 FCFA
 */
export async function createSubscriptionPayment(vendorId: string): Promise<SubscriptionResult> {
  const amount = 15000;
  const currency = 'FCFA';

  try {
    const supabase = await createClient();

    // 1. Récupérer le numéro de téléphone et le profil du commerçant
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', vendorId)
      .single();

    if (profileErr || !profile) {
      return { success: false, message: 'Profil commerçant introuvable.' };
    }

    const phone = profile.phone || '677112233'; // Fallback numéro MoMo simulé

    // 2. Créer un enregistrement d'abonnement en attente (pending)
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours de validité

    const { data: sub, error: subErr } = await supabase
      .from('vendor_subscriptions')
      .insert({
        vendor_id: vendorId,
        plan_name: 'RUSH Pro Mensuel',
        amount,
        currency,
        status: 'pending',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (subErr || !sub) {
      console.error('Erreur insertion vendor_subscriptions:', subErr);
      return { success: false, message: 'Erreur lors de la création de la demande d\'abonnement.' };
    }

    // 3. Créer un enregistrement de paiement d'abonnement en attente
    const { data: subPay, error: subPayErr } = await supabase
      .from('subscription_payments')
      .insert({
        vendor_id: vendorId,
        subscription_id: sub.id,
        amount,
        currency,
        payment_method: 'mtn', // MoMo par défaut pour la Cameroun
        payment_status: 'payment_pending',
      })
      .select('id')
      .single();

    if (subPayErr || !subPay) {
      console.error('Erreur insertion subscription_payments:', subPayErr);
      return { success: false, message: 'Erreur de traitement financier.' };
    }

    // Lier le payment_id dans vendor_subscriptions
    await supabase
      .from('vendor_subscriptions')
      .update({ payment_id: subPay.id })
      .eq('id', sub.id);

    // 4. Lancer le paiement Fapshi (MoMo / OM)
    const externalId = `SUB-${sub.id}`;
    const redirectUrl = `${process.env.APP_URL || 'http://localhost:3000'}/merchant?status=success_sub&sub_id=${sub.id}`;

    const payment = await initiatePayment({
      amount,
      phone,
      externalId,
      redirectUrl,
    });

    if (payment.success) {
      return {
        success: true,
        paymentUrl: payment.paymentUrl,
        message: 'Abonnement initié avec succès.',
      };
    } else {
      return {
        success: false,
        message: payment.message || 'Impossible d\'initier le paiement de l\'abonnement.',
      };
    }
  } catch (err) {
    console.error('Erreur serveur abonnement commerçant:', err);
    return { success: false, message: 'Une erreur serveur est survenue.' };
  }
}
