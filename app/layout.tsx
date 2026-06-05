import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import Header from '@/components/shared/header';
import TabBar from '@/components/shared/tab-bar';
import Footer from '@/components/shared/footer';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RUSH. — Livraison Ultra Rapide au Cameroun',
  description: 'Commandez vos produits en supermarché, fruits, boissons, restaurants et recevez-les en 25 minutes à Douala, Yaoundé. Paiements MTN MoMo, Orange Money et Cash.',
  keywords: 'RUSH, livraison rapide, Cameroun, MTN MoMo, Orange Money, Douala, supermarché',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${jakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-app text-ink">
        <CartProvider>
          {/* Header desktop/tablette uniquement */}
          <Header />
          
          {/* Zone de contenu adaptative */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-0 md:px-6 pb-[86px] md:pb-8">
            {children}
          </main>

          {/* Footer global sur écrans larges */}
          <Footer />
          
          {/* TabBar mobile uniquement */}
          <TabBar />
        </CartProvider>
      </body>
    </html>
  );
}
