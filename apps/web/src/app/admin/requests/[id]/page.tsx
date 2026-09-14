'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SOURCING_REQUEST_STATUS_TRANSITIONS, type SourcingRequestStatus } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, ArrowRight, FilePlus, LoaderCircle, MapPin, Wallet } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { SourcingRequestStatusBadge, sourcingRequestStatusLabel } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { formatAmount } from '../../../../lib/format';

interface RequestItemView {
  id: string;
  description: string | null;
  productLink: string | null;
  quantity: number;
  color: string | null;
  size: string | null;
  budgetAmount: number | null;
  budgetCurrency: string;
  comments: string | null;
}

interface SourcingRequestView {
  id: string;
  code: string;
  status: string;
  destination: string;
  items: RequestItemView[];
  customer: { firstName: string; lastName: string; companyName: string | null };
}

export default function AdminRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: request, isLoading } = useQuery({
    queryKey: ['admin', 'sourcing-requests', params.id],
    queryFn: () => authFetch((token) => api.get<SourcingRequestView>(`/admin/sourcing-requests/${params.id}`, token)),
  });

  const transition = useMutation({
    mutationFn: (status: SourcingRequestStatus) =>
      authFetch((token) => api.patch(`/admin/sourcing-requests/${params.id}/status`, { status }, token)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'sourcing-requests'] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de la demande…" />
      </div>
    );
  }

  if (!request) return null;

  const nextStatuses = SOURCING_REQUEST_STATUS_TRANSITIONS[request.status as SourcingRequestStatus] ?? [];
  const canTransition = user?.permissions.includes('sourcing-requests:write');
  const canQuote = user?.permissions.includes('quotes:write') && request.status !== 'CLOSED';

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/requests" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Demandes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{request.code}</h1>
        <SourcingRequestStatusBadge status={request.status} />
      </div>

      <div className="text-sm text-gray-600">
        <p className="font-medium text-gray-900">
          {request.customer.firstName} {request.customer.lastName}
        </p>
        {request.customer.companyName && <p>{request.customer.companyName}</p>}
        <p className="mt-1 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
          {request.destination}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {request.items.map((item) => (
          <li key={item.id} className="rounded-lg border border-gray-200 p-4">
            <p className="font-medium">{item.description ?? 'Produit sans description'}</p>
            {item.productLink && (
              <a href={item.productLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                {item.productLink}
              </a>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Quantité {item.quantity}
              {item.color ? ` — ${item.color}` : ''}
              {item.size ? ` — ${item.size}` : ''}
            </p>
            {item.budgetAmount && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Wallet className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                Budget indicatif : {formatAmount(item.budgetAmount, item.budgetCurrency)}
              </p>
            )}
            {item.comments && <p className="mt-2 text-sm text-gray-500">« {item.comments} »</p>}
          </li>
        ))}
      </ul>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {canQuote && (
          <Link
            href={`/admin/requests/${request.id}/quote/new`}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
          >
            <FilePlus className="h-4 w-4" strokeWidth={2.25} />
            Créer un devis
          </Link>
        )}
        {canTransition &&
          nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setError(null);
                transition.mutate(status);
              }}
              disabled={transition.isPending}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {transition.isPending && transition.variables === status ? (
                <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              ) : (
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              )}
              {sourcingRequestStatusLabel(status)}
            </button>
          ))}
      </div>
    </div>
  );
}
