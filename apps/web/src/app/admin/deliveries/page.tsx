'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { DeliveryStatusBadge } from '../../../components/status-badge';
import { Spinner } from '../../../components/spinner';

interface DeliveryView {
  id: string;
  status: string;
  order: { code: string };
  address: { line1: string; city: string };
}

export default function AdminDeliveriesListPage() {
  const { authFetch } = useAuth();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['admin', 'deliveries'],
    queryFn: () => authFetch((token) => api.get<DeliveryView[]>('/admin/deliveries', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Livraisons</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des livraisons…" />
        </div>
      )}

      {!isLoading && deliveries?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Truck className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucune livraison pour le moment.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {deliveries?.map((delivery) => (
          <li key={delivery.id}>
            <Link
              href={`/admin/deliveries/${delivery.id}`}
              className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Commande {delivery.order.code}</span>
                  <DeliveryStatusBadge status={delivery.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {delivery.address.line1}, {delivery.address.city}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
