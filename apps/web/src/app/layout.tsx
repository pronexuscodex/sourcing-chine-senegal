import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const SITE_NAME = 'SinoSen';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sinosen-web.onrender.com';
const DESCRIPTION =
  "SinoSen simplifie l'import Chine → Sénégal : envoyez un lien produit ou une description, recevez un devis clair, et suivez votre commande de la Chine jusqu'à votre porte à Dakar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Sourcing Chine → Sénégal`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'sourcing Chine Sénégal',
    'import Chine Dakar',
    'achat Alibaba Sénégal',
    'commande 1688 Sénégal',
    'transitaire Chine Sénégal',
    'devis import Chine',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Sourcing Chine → Sénégal`,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} — Sourcing Chine → Sénégal`,
    description: DESCRIPTION,
  },
  // Pas de directive robots explicite ici — omise = indexable par défaut, ce
  // qui est correct pour les pages publiques. dashboard/layout.tsx et
  // admin/layout.tsx posent leur propre <meta name="robots" content="noindex">
  // en JSX brut (ce sont des Client Components, donc l'API Metadata ne peut
  // pas s'y appliquer) ; définir une valeur ici créerait DEUX balises robots
  // conflictuelles sur ces pages au lieu d'une seule.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
