'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, MapPin, PackageSearch } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { SourcingRequestStatusBadge } from '../../../components/status-badge';
import { Spinner } from '../../../components/spinner';

interface RequestItemView {
  id: string;
  description: string | null;
  quantity: number;
}

interface SourcingRequestView {
  id: string;
  code: string;
  status: string;
  destination: string;
  items: RequestItemView[];
  customer: { firstName: string; lastName: string };
}

export default function AdminRequestsListPage() {
  const { authFetch } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'sourcing-requests'],
    queryFn: () => authFetch((token) => api.get<SourcingRequestView[]>('/admin/sourcing-requests', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Demandes de sourcing</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des demandes…" />
        </div>
      )}

      {!isLoading && requests?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <PackageSearch className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucune demande pour le moment.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {requests?.map((req) => (
          <li key={req.id}>
            <Link
              href={`/admin/requests/${req.id}`}
              className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{req.code}</span>
                  <SourcingRequestStatusBadge status={req.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {req.customer.firstName} {req.customer.lastName}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                  {req.destination}
                </p>
                {req.items.map((item) => (
                  <p key={item.id} className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <Boxes className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                    {item.description ?? 'Produit sans description'} — quantité {item.quantity}
                  </p>
                ))}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
