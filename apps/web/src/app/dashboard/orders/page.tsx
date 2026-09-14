'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { OrderStatusBadge } from '../../../components/status-badge';
import { Spinner } from '../../../components/spinner';
import { formatAmount, formatDate } from '../../../lib/format';

interface OrderView {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export default function OrdersListPage() {
  const { authFetch } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => authFetch((token) => api.get<OrderView[]>('/orders/mine', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mes commandes</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement de vos commandes…" />
        </div>
      )}

      {!isLoading && orders?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Package className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Vous n&apos;avez pas encore de commande.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {orders?.map((order) => (
          <li key={order.id}>
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{order.code}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-gray-400">Commandée le {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatAmount(order.totalAmount, order.currency)}</span>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
