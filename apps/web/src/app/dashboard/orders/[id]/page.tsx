'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Check, Circle, CircleDot, LoaderCircle, Wallet } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { OrderStatusBadge, orderStatusLabel } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { formatAmount, formatDate } from '../../../../lib/format';

interface OrderView {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface TrackingStep {
  step: string;
  state: 'done' | 'current' | 'pending';
}

interface TrackingEvent {
  type: string;
  description: string | null;
  occurredAt: string;
}

interface TrackingView {
  code: string;
  status: string;
  steps: TrackingStep[];
  events: TrackingEvent[];
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['orders', params.id],
    queryFn: () => authFetch((token) => api.get<OrderView>(`/orders/${params.id}`, token)),
  });

  const { data: tracking, isLoading: trackingLoading } = useQuery({
    queryKey: ['orders', params.id, 'tracking'],
    queryFn: () => authFetch((token) => api.get<TrackingView>(`/orders/${params.id}/tracking`, token)),
  });

  const pay = useMutation({
    mutationFn: () => authFetch((token) => api.post<{ paymentUrl: string }>(`/orders/${params.id}/payment-intent`, undefined, token)),
    onSuccess: (result) => {
      window.location.href = result.paymentUrl;
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (orderLoading || trackingLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de la commande…" />
      </div>
    );
  }

  if (!order || !tracking) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Mes commandes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.code}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Commandée le {formatDate(order.createdAt)}</span>
        <span className="font-semibold text-gray-900">{formatAmount(order.totalAmount, order.currency)}</span>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {order.status === 'PAYMENT_PENDING' && (
        <button
          onClick={() => {
            setError(null);
            pay.mutate();
          }}
          disabled={pay.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pay.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Wallet className="h-4 w-4" strokeWidth={2.25} />
          )}
          Payer maintenant
        </button>
      )}

      <div>
        <h2 className="text-sm font-medium text-gray-700">Suivi de la commande</h2>
        <ol className="mt-3 flex flex-col gap-0">
          {tracking.steps.map((step) => (
            <li key={step.step} className="flex gap-3">
              <div className="flex flex-col items-center">
                {step.state === 'done' ? (
                  <Check className="h-4 w-4 rounded-full bg-emerald-600 p-0.5 text-white" strokeWidth={3} />
                ) : step.state === 'current' ? (
                  <CircleDot className="h-4 w-4 text-gray-900" strokeWidth={2.5} />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" strokeWidth={2} />
                )}
                <div
                  className={`w-px flex-1 ${step.state === 'done' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                  style={{ minHeight: '1.25rem' }}
                />
              </div>
              <p
                className={`pb-5 text-sm ${
                  step.state === 'pending' ? 'text-gray-400' : step.state === 'current' ? 'font-medium text-gray-900' : 'text-gray-600'
                }`}
              >
                {orderStatusLabel(step.step)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {tracking.events.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700">Historique</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {tracking.events.map((event, index) => (
              <li key={index} className="text-sm text-gray-500">
                <span className="text-gray-400">{formatDate(event.occurredAt)}</span> — {event.description ?? event.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
