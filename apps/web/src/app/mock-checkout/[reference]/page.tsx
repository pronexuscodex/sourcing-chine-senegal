'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Check, CreditCard, LoaderCircle, ShieldAlert, X } from 'lucide-react';
import { api, ApiError } from '../../../lib/api-client';
import { formatAmount } from '../../../lib/format';

export default function MockCheckoutPage() {
  const params = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<'SUCCEEDED' | 'FAILED' | null>(null);

  const transactionId = searchParams.get('transactionId') ?? '';
  const amount = Number(searchParams.get('amount') ?? 0);
  const currency = searchParams.get('currency') ?? 'XOF';
  const orderId = searchParams.get('orderId') ?? '';

  const simulate = useMutation({
    mutationFn: (status: 'SUCCEEDED' | 'FAILED') =>
      api.post('/payments/webhook/MOCK', { orderTransactionId: transactionId, amount, status }),
    onSuccess: (_data, status) => setOutcome(status),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (outcome) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        {outcome === 'SUCCEEDED' ? (
          <>
            <Check className="h-10 w-10 rounded-full bg-emerald-100 p-2 text-emerald-700" strokeWidth={2.25} />
            <h1 className="text-xl font-semibold">Paiement simulé avec succès</h1>
            <p className="text-sm text-gray-600">La commande sera confirmée dans quelques instants.</p>
          </>
        ) : (
          <>
            <X className="h-10 w-10 rounded-full bg-red-100 p-2 text-red-700" strokeWidth={2.25} />
            <h1 className="text-xl font-semibold">Paiement simulé en échec</h1>
            <p className="text-sm text-gray-600">Vous pouvez retourner sur la commande pour réessayer.</p>
          </>
        )}
        <Link href={`/dashboard/orders/${orderId}`} className="mt-2 text-sm font-medium underline">
          Retour à la commande
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
        <ShieldAlert className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
        Page de paiement simulée — développement uniquement, aucun prestataire réel n&apos;est appelé.
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-card p-6 text-center">
        <CreditCard className="mx-auto h-8 w-8 text-gray-400" strokeWidth={1.75} />
        <p className="mt-3 text-sm text-gray-500">Montant à payer</p>
        <p className="text-2xl font-semibold">{formatAmount(amount, currency)}</p>
        <p className="mt-1 text-xs text-gray-400">Référence {params.reference}</p>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            setError(null);
            simulate.mutate('SUCCEEDED');
          }}
          disabled={simulate.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
        >
          {simulate.isPending && simulate.variables === 'SUCCEEDED' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.25} />
          )}
          Simuler un paiement réussi
        </button>
        <button
          onClick={() => {
            setError(null);
            simulate.mutate('FAILED');
          }}
          disabled={simulate.isPending}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-card transition-colors hover:bg-gray-50 hover:shadow-card-hover disabled:opacity-50"
        >
          {simulate.isPending && simulate.variables === 'FAILED' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <X className="h-4 w-4" strokeWidth={2.25} />
          )}
          Simuler un échec
        </button>
      </div>
    </main>
  );
}
