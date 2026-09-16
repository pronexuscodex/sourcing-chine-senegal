'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle, Plus, Ship } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api, ApiError } from '../../../lib/api-client';
import { Spinner } from '../../../components/spinner';
import { formatDate } from '../../../lib/format';

interface ShipmentView {
  id: string;
  code: string;
  status: string;
  departedAt: string | null;
  arrivedAt: string | null;
  packages: { id: string }[];
}

export default function AdminShipmentsListPage() {
  const { authFetch, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['admin', 'shipments'],
    queryFn: () => authFetch((token) => api.get<ShipmentView[]>('/admin/shipments', token)),
  });

  const create = useMutation({
    mutationFn: () => authFetch((token) => api.post<{ id: string }>('/admin/shipments', undefined, token)),
    onSuccess: (shipment) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      router.push(`/admin/shipments/${shipment.id}`);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const canCreate = user?.permissions.includes('warehouse:write');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expéditions</h1>
        {canCreate && (
          <button
            onClick={() => {
              setError(null);
              create.mutate();
            }}
            disabled={create.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
          >
            {create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Plus className="h-4 w-4" strokeWidth={2.25} />}
            Nouvelle expédition
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des expéditions…" />
        </div>
      )}

      {!isLoading && shipments?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Ship className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucune expédition pour le moment.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {shipments?.map((shipment) => (
          <li key={shipment.id}>
            <Link
              href={`/admin/shipments/${shipment.id}`}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-card p-4 transition-shadow hover:border-gray-300 hover:shadow-card-hover"
            >
              <div>
                <span className="font-medium">{shipment.code}</span>
                <p className="mt-1 text-sm text-gray-500">
                  {shipment.packages.length} colis
                  {shipment.departedAt ? ` — parti le ${formatDate(shipment.departedAt)}` : ''}
                  {shipment.arrivedAt ? ` — arrivé le ${formatDate(shipment.arrivedAt)}` : ''}
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
