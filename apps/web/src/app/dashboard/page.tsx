'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, CreditCard, FileText, Headset, ListChecks, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api-client';

interface CustomerProfile {
  firstName: string;
  lastName: string;
}

const ACTIVE_CARDS = [
  { label: 'Mes demandes', description: 'Suivi de vos demandes de sourcing', icon: ListChecks, href: '/dashboard/requests' },
  { label: 'Mes devis', description: 'Devis reçus à accepter ou refuser', icon: FileText, href: '/dashboard/quotes' },
  { label: 'Mes commandes', description: 'Suivi de vos commandes en cours', icon: Package, href: '/dashboard/orders' },
];

const COMING_SOON_CARDS = [
  { label: 'Mes paiements', description: 'Historique de vos paiements', icon: CreditCard },
  { label: 'Support', description: 'Contacter notre équipe', icon: Headset },
];

export default function DashboardOverviewPage() {
  const { authFetch } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['customers', 'me'],
    queryFn: () => authFetch((token) => api.get<CustomerProfile>('/customers/me', token)),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Bonjour {profile?.firstName ?? ''}</h1>
        <p className="mt-1 text-gray-600">Suivez vos demandes, devis et commandes depuis votre tableau de bord.</p>
      </div>

      <Link
        href="/dashboard/requests/new"
        className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-4 text-center font-medium text-white hover:bg-gray-800"
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={2} />
        Je veux acheter un produit
      </Link>

      <div className="grid grid-cols-2 gap-4">
        {ACTIVE_CARDS.map(({ label, description, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <Icon className="h-5 w-5 shrink-0 text-gray-700" strokeWidth={2} />
            <div>
              <div className="flex items-center gap-1 font-medium">
                {label}
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 transition group-hover:translate-x-0.5" />
              </div>
              <div className="text-sm text-gray-500">{description}</div>
            </div>
          </Link>
        ))}

        {COMING_SOON_CARDS.map(({ label, description, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-gray-400">
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <div>
              <div className="font-medium">{label}</div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                Bientôt disponible
              </div>
              <div className="sr-only">{description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
