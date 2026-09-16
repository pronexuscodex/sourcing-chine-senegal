'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { QuoteStatusBadge } from '../../../components/status-badge';
import { Spinner } from '../../../components/spinner';
import { formatAmount } from '../../../lib/format';

interface QuoteItemView {
  clientPrice: number;
  requestItem: { description: string | null };
}

interface QuoteView {
  id: string;
  code: string;
  status: string;
  currency: string;
  items: QuoteItemView[];
  request: { code: string; destination: string };
}

export default function AdminQuotesListPage() {
  const { authFetch } = useAuth();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['admin', 'quotes'],
    queryFn: () => authFetch((token) => api.get<QuoteView[]>('/admin/quotes', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Devis</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des devis…" />
        </div>
      )}

      {!isLoading && quotes?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <FileText className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucun devis pour le moment.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {quotes?.map((quote) => {
          const total = quote.items.reduce((sum, item) => sum + item.clientPrice, 0);
          return (
            <li key={quote.id}>
              <Link
                href={`/admin/quotes/${quote.id}`}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-card p-4 transition-shadow hover:border-gray-300 hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{quote.code}</span>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {quote.request.code} — {quote.items[0]?.requestItem.description ?? 'Produit sans description'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatAmount(total, quote.currency)}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
