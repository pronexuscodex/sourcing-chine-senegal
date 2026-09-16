'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, LoaderCircle, Send } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { QuoteStatusBadge } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { formatAmount, formatDate } from '../../../../lib/format';

interface QuoteItemView {
  id: string;
  productCost: number;
  chinaInlandShipping: number;
  supplierFees: number;
  qualityControlFee: number;
  consolidationFee: number;
  internationalFreight: number;
  otherCosts: number;
  serviceFee: number;
  realCost: number;
  margin: number;
  clientPrice: number;
  requestItem: { description: string | null; quantity: number };
  supplier: { name: string; platform: string | null } | null;
}

interface QuoteView {
  id: string;
  code: string;
  status: string;
  currency: string;
  validUntil: string;
  items: QuoteItemView[];
  request: { code: string; destination: string };
}

export default function AdminQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['admin', 'quotes', params.id],
    queryFn: () => authFetch((token) => api.get<QuoteView>(`/admin/quotes/${params.id}`, token)),
  });

  const send = useMutation({
    mutationFn: () => authFetch((token) => api.patch(`/admin/quotes/${params.id}/send`, undefined, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes', params.id] });
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

  const totalClientPrice = quote.items.reduce((sum, item) => sum + item.clientPrice, 0);
  const totalMargin = quote.items.reduce((sum, item) => sum + item.margin, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/quotes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Devis
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{quote.code}</h1>
        <QuoteStatusBadge status={quote.status} />
      </div>
      <p className="text-sm text-gray-500">
        {quote.request.code} — {quote.request.destination} — valable jusqu&apos;au {formatDate(quote.validUntil)}
      </p>

      <div className="flex flex-col gap-3 overflow-x-auto">
        {quote.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-card p-4">
            <p className="font-medium">
              {item.requestItem.description ?? 'Produit sans description'} — quantité {item.requestItem.quantity}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Fournisseur : {item.supplier ? `${item.supplier.name}${item.supplier.platform ? ` (${item.supplier.platform})` : ''}` : 'non précisé'}
            </p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                <tr className="text-gray-500">
                  <td className="py-0.5">Coût produit</td>
                  <td className="py-0.5 text-right">{formatAmount(item.productCost, quote.currency)}</td>
                </tr>
                <tr className="text-gray-500">
                  <td className="py-0.5">Transport + frais + QC + consolidation + fret + autres</td>
                  <td className="py-0.5 text-right">
                    {formatAmount(
                      item.chinaInlandShipping +
                        item.supplierFees +
                        item.qualityControlFee +
                        item.consolidationFee +
                        item.internationalFreight +
                        item.otherCosts,
                      quote.currency,
                    )}
                  </td>
                </tr>
                <tr className="text-gray-500">
                  <td className="py-0.5">Frais de service</td>
                  <td className="py-0.5 text-right">{formatAmount(item.serviceFee, quote.currency)}</td>
                </tr>
                <tr className="border-t border-gray-100 font-medium text-gray-700">
                  <td className="py-1">Coût réel (interne)</td>
                  <td className="py-1 text-right">{formatAmount(item.realCost, quote.currency)}</td>
                </tr>
                <tr className="font-medium text-emerald-700">
                  <td className="py-1">Marge (interne)</td>
                  <td className="py-1 text-right">{formatAmount(item.margin, quote.currency)}</td>
                </tr>
                <tr className="font-semibold text-gray-900">
                  <td className="py-1">Prix client</td>
                  <td className="py-1 text-right">{formatAmount(item.clientPrice, quote.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-sm text-gray-500">Marge totale (interne) : {formatAmount(totalMargin, quote.currency)}</span>
        <span className="text-lg font-semibold">{formatAmount(totalClientPrice, quote.currency)}</span>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {quote.status === 'DRAFT' && (
        <button
          onClick={() => {
            setError(null);
            send.mutate();
          }}
          disabled={send.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
        >
          {send.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.25} />
          )}
          Envoyer au client
        </button>
      )}
    </div>
  );
}
