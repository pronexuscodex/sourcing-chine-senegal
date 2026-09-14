'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Boxes, MapPin, PackageSearch, Plus } from 'lucide-react';
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
  createdAt: string;
  items: RequestItemView[];
}

export default function RequestsListPage() {
  const { authFetch } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['sourcing-requests', 'mine'],
    queryFn: () => authFetch((token) => api.get<SourcingRequestView[]>('/sourcing-requests/mine', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes demandes</h1>
        <Link
          href="/dashboard/requests/new"
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Nouvelle demande
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement de vos demandes…" />
        </div>
      )}

      {!isLoading && requests?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <PackageSearch className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Vous n&apos;avez pas encore de demande de sourcing.</p>
          <Link href="/dashboard/requests/new" className="text-sm font-medium text-gray-900 underline">
            Créer votre première demande
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {requests?.map((req) => (
          <li key={req.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{req.code}</span>
              <SourcingRequestStatusBadge status={req.status} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
              {req.destination}
            </p>
            {req.items.map((item) => (
              <p key={item.id} className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Boxes className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                {item.description ?? 'Produit sans description'} — quantité {item.quantity}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
