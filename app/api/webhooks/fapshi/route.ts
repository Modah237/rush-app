import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Token/Secret de Webhook configuré dans le dashboard de Fapshi
const FAPSHI_WEBHOOK_SECRET = process.env.FAPSHI_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    // Récupérer la signature Fapshi depuis les entêtes
    const signature = req.headers.get('x-fapshi-signature');

    // 1. Validation de la signature Fapshi si configurée (Sécurité de production)
    if (FAPSHI_WEBHOOK_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', FAPSHI_WEBHOOK_SECRET);
      const digest = hmac.update(bodyText).digest('hex');
      
      if (digest !== signature) {
        console.error('Signature Fapshi non valide.');
        return NextResponse.json({ error: 'Signature non valide.' }, { status: 401 });
      }
    }

    // Le corps attendu de Fapshi :
    // {
    //   "amount": 12300,
    //   "externalId": "RSH-20512",
    //   "status": "successful" | "failed",
    //   "transId": "FAP-12345",
    //   "phone": "678451290"
    // }
    const { amount, externalId, status, transId, phone } = body;

    if (!externalId || !status || !transId) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }
    console.log(`Notification Fapshi reçue pour la commande / abonnement : ${externalId} avec le statut : ${status}`);

    const isSuccess = status === 'successful';
    const supabase = await createClient();

    // 2. Traitement s'il s'agit d'un abonnement commerçant
    if (externalId.startsWith('SUB-')) {
      const subId = externalId.slice(4); // ID de l'abonnement
      
      // Mettre à jour le paiement d'abonnement
      const { data: subPayment, error: subPayErr } = await supabase
        .from('subscription_payments')
        .update({
          payment_status: isSuccess ? 'paid' : 'failed',
          transaction_reference: transId,
        })
        .eq('subscription_id', subId)
        .select('*')
        .maybeSingle();

      if (subPayErr) {
        console.error(`Erreur mise à jour paiement abonnement : ${subId}`, subPayErr);
      }

      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours de validité

      // Mettre à jour l'abonnement commerçant
      const { data: sub, error: subErr } = await supabase
        .from('vendor_subscriptions')
        .update({
          status: isSuccess ? 'active' : 'cancelled',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subId)
        .select('vendor_id')
        .maybeSingle();

      if (subErr || !sub) {
        console.error(`Abonnement introuvable ou erreur : ${subId}`, subErr);
        return NextResponse.json({ success: false, message: 'Abonnement introuvable.' });
      }

      // Activer l'abonnement de la boutique en base
      if (isSuccess) {
        const { error: shopErr } = await supabase
          .from('shops')
          .update({
            subscription_status: 'active',
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('owner_id', sub.vendor_id);

        if (shopErr) {
          console.error(`Erreur activation boutique commerçant:`, shopErr);
        }
      }

      return NextResponse.json({ success: true, message: 'Abonnement traité avec succès.' });
    }

    // 3. Traitement standard d'une commande client
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', externalId)
      .single();

    if (fetchError || !order) {
      console.error(`Commande introuvable en base pour le webhook : ${externalId}`);
      return NextResponse.json({ success: false, message: 'Commande introuvable.' });
    }

    // Mettre à jour la transaction de paiement dans la table "payments"
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        payment_status: isSuccess ? 'paid' : 'failed',
        transaction_reference: transId,
        webhook_payload: body,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', externalId);

    if (paymentError) {
      console.error('Erreur lors de la mise à jour de la table payments:', paymentError);
    }

    // Mettre à jour la commande
    const nextOrderStatus = isSuccess ? 'confirmed' : 'cancelled';
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: nextOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', externalId);

    if (orderUpdateError) {
      console.error('Erreur lors de la mise à jour de la commande:', orderUpdateError);
    }

    // Enregistrer le jalon de statut
    await supabase.from('order_status_events').insert({
      order_id: externalId,
      status: nextOrderStatus,
      notes: isSuccess 
        ? `Paiement mobile réussi de ${formatPrice(amount)} via Fapshi.` 
        : `Échec du paiement Fapshi. Commande annulée automatiquement.`,
    });

    return NextResponse.json({ success: true, message: 'Webhook traité avec succès.' });

  } catch (error: any) {
    console.error('Erreur de traitement du webhook Fapshi:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}

function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}
