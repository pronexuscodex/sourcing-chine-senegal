'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, X } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { QuoteStatusBadge } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { formatAmount, formatDate } from '../../../../lib/format';

interface QuoteItemView {
  id: string;
  clientPrice: number;
  serviceFee: number;
  requestItem: {
    description: string | null;
    quantity: number;
    color: string | null;
    size: string | null;
  };
}

interface QuoteView {
  id: string;
  code: string;
  status: string;
  currency: string;
  validUntil: string;
  items: QuoteItemView[];
}

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quotes', params.id],
    queryFn: () => authFetch((token) => api.get<QuoteView>(`/quotes/${params.id}`, token)),
  });

  const respond = useMutation({
    mutationFn: (action: 'accept' | 'reject') =>
      authFetch((token) => api.post(`/quotes/${params.id}/${action}`, undefined, token)),
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      if (action === 'accept') {
        router.push('/dashboard/orders');
      } else {
        queryClient.invalidateQueries({ queryKey: ['quotes', params.id] });
      }
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement du devis…" />
      </div>
    );
  }

  if (!quote) return null;

  const total = quote.items.reduce((sum, item) => sum + item.clientPrice, 0);
  const canRespond = quote.status === 'SENT';

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/quotes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Mes devis
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{quote.code}</h1>
        <QuoteStatusBadge status={quote.status} />
      </div>
      <p className="text-sm text-gray-500">Valable jusqu&apos;au {formatDate(quote.validUntil)}</p>

      <ul className="flex flex-col gap-3">
        {quote.items.map((item) => (
          <li key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-card p-4">
            <p className="font-medium">{item.requestItem.description ?? 'Produit sans description'}</p>
            <p className="mt-1 text-sm text-gray-500">
              Quantité {item.requestItem.quantity}
              {item.requestItem.color ? ` — ${item.requestItem.color}` : ''}
              {item.requestItem.size ? ` — ${item.requestItem.size}` : ''}
            </p>
            <p className="mt-2 text-right font-semibold">{formatAmount(item.clientPrice, quote.currency)}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="font-medium">Total</span>
        <span className="text-lg font-semibold">{formatAmount(total, quote.currency)}</span>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {canRespond && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              respond.mutate('accept');
            }}
            disabled={respond.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
          >
            {respond.isPending && respond.variables === 'accept' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <Check className="h-4 w-4" strokeWidth={2.25} />
            )}
            Accepter le devis
          </button>
          <button
            onClick={() => {
              setError(null);
              respond.mutate('reject');
            }}
            disabled={respond.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-card transition-colors hover:bg-gray-50 hover:shadow-card-hover disabled:opacity-50"
          >
            {respond.isPending && respond.variables === 'reject' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <X className="h-4 w-4" strokeWidth={2.25} />
            )}
            Refuser
          </button>
        </div>
      )}
    </div>
  );
}
