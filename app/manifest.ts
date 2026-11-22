import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RUSH. — Livraison Ultra Rapide au Cameroun',
    short_name: 'RUSH.',
    description: 'Courses, repas et essentiels livrés en 25 minutes au Cameroun. Paiement MTN MoMo, Orange Money et Cash.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F7',
    theme_color: '#F50012',
    orientation: 'portrait',
    lang: 'fr',
    icons: [
      {
        src: '/rush/brand/mark-red.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/rush/brand/mark-red.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Explorer les produits',
        short_name: 'Catégories',
        url: '/categories',
      },
      {
        name: 'Mes commandes',
        short_name: 'Commandes',
        url: '/orders',
      },
      {
        name: 'Carte Cameroun',
        short_name: 'Carte',
        url: '/carte',
      },
    ],
  };
}
