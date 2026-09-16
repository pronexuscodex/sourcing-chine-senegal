'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, Factory, FileText, ListChecks, Package, Ship, Truck } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

const CARDS = [
  { label: 'Demandes', description: 'Demandes de sourcing à analyser', icon: ListChecks, href: '/admin/requests', permission: 'sourcing-requests:read:all' },
  { label: 'Devis', description: 'Créer, envoyer et suivre les devis', icon: FileText, href: '/admin/quotes', permission: 'quotes:read' },
  { label: 'Commandes', description: 'Suivi des commandes clients', icon: Package, href: '/admin/orders', permission: 'orders:read:all' },
  { label: 'Fournisseurs', description: 'Fiches et évaluations des fournisseurs', icon: Factory, href: '/admin/suppliers', permission: 'suppliers:read' },
  { label: 'Colis', description: 'Réception et contrôle qualité en entrepôt', icon: Boxes, href: '/admin/warehouse', permission: 'warehouse:read' },
  { label: 'Expéditions', description: 'Consolidation et suivi du transport', icon: Ship, href: '/admin/shipments', permission: 'warehouse:read' },
  { label: 'Livraisons', description: 'Livraisons finales aux clients', icon: Truck, href: '/admin/deliveries', permission: 'warehouse:read' },
];

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const cards = CARDS.filter((card) => user?.permissions.includes(card.permission));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord équipe</h1>
        <p className="mt-1 text-gray-600">Pipeline sourcing → devis → commande.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ label, description, icon: Icon, href }) => (
          <Link
            key={href}
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
      </div>
    </div>
  );
}
