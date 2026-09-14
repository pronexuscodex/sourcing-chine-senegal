'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { DeliveryStatusBadge } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { formatDate } from '../../../../lib/format';

interface DeliveryView {
  id: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  order: { code: string };
  address: { label: string | null; line1: string; line2: string | null; city: string; region: string | null; phone: string | null };
}

export default function AdminDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['admin', 'deliveries', params.id],
    queryFn: () => authFetch((token) => api.get<DeliveryView>(`/admin/deliveries/${params.id}`, token)),
  });

  const complete = useMutation({
    mutationFn: () => authFetch((token) => api.patch(`/admin/deliveries/${params.id}/complete`, undefined, token)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries', params.id] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const canComplete = user?.permissions.includes('warehouse:write');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de la livraison…" />
      </div>
    );
  }

  if (!delivery) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/deliveries" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Livraisons
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commande {delivery.order.code}</h1>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
          {delivery.address.label ?? 'Adresse de livraison'}
        </p>
        <p className="mt-1 text-gray-600">
          {delivery.address.line1}
          {delivery.address.line2 ? `, ${delivery.address.line2}` : ''}
        </p>
        <p className="text-gray-600">
          {delivery.address.city}
          {delivery.address.region ? `, ${delivery.address.region}` : ''}
        </p>
        {delivery.address.phone && <p className="mt-1 text-gray-500">{delivery.address.phone}</p>}
      </div>

      <p className="text-sm text-gray-500">
        Créée le {formatDate(delivery.createdAt)}
        {delivery.deliveredAt ? ` — livrée le ${formatDate(delivery.deliveredAt)}` : ''}
      </p>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {canComplete && delivery.status === 'PENDING' && (
        <button
          onClick={() => {
            setError(null);
            complete.mutate();
          }}
          disabled={complete.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {complete.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />}
          Marquer comme livrée
        </button>
      )}
    </div>
  );
}
