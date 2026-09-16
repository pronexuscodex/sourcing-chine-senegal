'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { Logo } from '../components/logo';

// Organization + WebSite JSON-LD (rich results, Sitelinks Search Box) — l'URL
// du site sera à mettre à jour une fois le domaine final acheté.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'SinoSen',
      description:
        "SinoSen simplifie l'import Chine → Sénégal : devis clair, suivi de commande, livraison à Dakar.",
      url: 'https://sinosen-web.onrender.com',
      areaServed: { '@type': 'Country', name: 'Sénégal' },
    },
    {
      '@type': 'WebSite',
      name: 'SinoSen',
      url: 'https://sinosen-web.onrender.com',
      inLanguage: 'fr',
    },
  ],
};

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const ctaHref = !isLoading && user ? '/dashboard/requests/new' : '/register';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <Logo className="h-10 w-10" />
      <h1 className="text-2xl font-semibold">Sourcing Chine → Sénégal</h1>
      <p className="text-gray-600">
        Envoyez un lien, une photo ou une description du produit que vous recherchez. Nous nous
        occupons du reste.
      </p>
      <Link
        href={ctaHref}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={2} />
        Je veux acheter un produit
      </Link>
      {!isLoading && !user && (
        <p className="flex items-center gap-1 text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="inline-flex items-center gap-0.5 underline">
            Se connecter
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </p>
      )}
    </main>
  );
}
