import { NextResponse } from 'next/server';
import { CAMEROON_CITIES, CAMEROON_ZONES } from '@/lib/cameroon-geo';
import { RUSH_PROMOS } from '@/lib/promos';

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const fapshiConfigured = Boolean(process.env.FAPSHI_API_USER && process.env.FAPSHI_API_KEY);

  return NextResponse.json({
    status: 'ok',
    service: 'rush-app',
    version: '3.2.0',
    mode: supabaseConfigured ? 'live' : 'sandbox',
    integrations: {
      supabase: supabaseConfigured,
      fapshi: fapshiConfigured,
    },
    coverage: {
      cities: CAMEROON_CITIES.length,
      zones: CAMEROON_ZONES.length,
      activePromos: RUSH_PROMOS.length,
    },
    timestamp: new Date().toISOString(),
  });
}
