'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, ArrowRight, Boxes, LoaderCircle, Truck } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { OrderStatusBadge, orderStatusLabel, PackageStatusBadge, DeliveryStatusBadge } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { Select } from '../../../../components/select';
import { formatAmount, formatDate } from '../../../../lib/format';

interface AddressView {
  id: string;
  label: string | null;
  line1: string;
  city: string;
}

interface OrderView {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  customer: { firstName: string; lastName: string; addresses: AddressView[] };
}

interface PackageView {
  id: string;
  code: string;
  status: string;
}

interface DeliveryView {
  id: string;
  status: string;
}

// Ces statuts ne sont JAMAIS posés via le bouton générique "prochain statut" —
// chacun est le résultat d'une action métier précise (webhook de paiement,
// réception colis, première inspection, rattachement expédition, création/
// complétion de livraison) qui a ses propres effets de bord à exécuter.
// Un simple PATCH status contournerait ces effets (ex: AT_CHINA_WAREHOUSE sans
// jamais créer le WarehousePackage correspondant).
const ACTION_DRIVEN_STATUSES = new Set(['PAID', 'AT_CHINA_WAREHOUSE', 'QUALITY_CHECK', 'CONSOLIDATED', 'OUT_FOR_DELIVERY', 'DELIVERED']);

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'orders', params.id],
    queryFn: () => authFetch((token) => api.get<OrderView>(`/admin/orders/${params.id}`, token)),
  });

  const canWarehouseWrite = user?.permissions.includes('warehouse:write');

  const { data: packages } = useQuery({
    queryKey: ['admin', 'warehouse', 'byOrder', params.id],
    queryFn: () => authFetch((token) => api.get<PackageView[]>(`/admin/warehouse/packages?orderId=${params.id}`, token)),
    enabled: !!order,
  });

  const { data: deliveries } = useQuery({
    queryKey: ['admin', 'deliveries', 'byOrder', params.id],
    queryFn: () => authFetch((token) => api.get<DeliveryView[]>(`/admin/deliveries?orderId=${params.id}`, token)),
    enabled: !!order,
  });

  const transition = useMutation({
    mutationFn: (status: OrderStatus) =>
      authFetch((token) => api.patch(`/admin/orders/${params.id}/status`, { status }, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', params.id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const receivePackage = useMutation({
    mutationFn: () =>
      authFetch((token) => api.post('/admin/warehouse/packages', { orderId: params.id, photos: [] }, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', params.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'byOrder', params.id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const createDelivery = useMutation({
    mutationFn: (addressId: string) =>
      authFetch((token) => api.post('/admin/deliveries', { orderId: params.id, addressId }, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', params.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries', 'byOrder', params.id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de la commande…" />
      </div>
    );
  }

  if (!order) return null;

  const nextStatuses = (ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? []).filter(
    (s) => !ACTION_DRIVEN_STATUSES.has(s),
  );
  const canTransition = user?.permissions.includes('orders:write:status');
  const pkg = packages?.[0];
  const delivery = deliveries?.[0];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Commandes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.code}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {order.customer.firstName} {order.customer.lastName} — commandée le {formatDate(order.createdAt)}
        </span>
        <span className="font-semibold text-gray-900">{formatAmount(order.totalAmount, order.currency)}</span>
      </div>

      {pkg && (
        <Link href={`/admin/warehouse/${pkg.id}`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-card p-3 text-sm transition-shadow hover:border-gray-300 hover:shadow-card-hover">
          <Boxes className="h-4 w-4 text-gray-400" strokeWidth={2} />
          Colis {pkg.code} <PackageStatusBadge status={pkg.status} />
        </Link>
      )}
      {delivery && (
        <Link href={`/admin/deliveries/${delivery.id}`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white shadow-card p-3 text-sm transition-shadow hover:border-gray-300 hover:shadow-card-hover">
          <Truck className="h-4 w-4 text-gray-400" strokeWidth={2} />
          Livraison <DeliveryStatusBadge status={delivery.status} />
        </Link>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      {canWarehouseWrite && order.status === 'READY_FOR_SHIPMENT' && !pkg && (
        <button
          onClick={() => {
            setError(null);
            receivePackage.mutate();
          }}
          disabled={receivePackage.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
        >
          {receivePackage.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Boxes className="h-4 w-4" strokeWidth={2.25} />}
          Recevoir un colis en entrepôt
        </button>
      )}

      {canWarehouseWrite && order.status === 'READY_FOR_DELIVERY' && !delivery && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-medium text-gray-700">Créer la livraison</h2>
          {order.customer.addresses.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Le client n&apos;a pas encore enregistré d&apos;adresse.</p>
          ) : (
            <div className="mt-3 flex gap-3">
              <Select
                value={selectedAddressId}
                onChange={setSelectedAddressId}
                wrapperClassName="flex-1"
                placeholder="Choisir une adresse…"
                options={order.customer.addresses.map((address) => ({
                  value: address.id,
                  label: `${address.label ? `${address.label} — ` : ''}${address.line1}, ${address.city}`,
                }))}
              />
              <button
                onClick={() => {
                  setError(null);
                  if (selectedAddressId) createDelivery.mutate(selectedAddressId);
                }}
                disabled={!selectedAddressId || createDelivery.isPending}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-2 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
              >
                {createDelivery.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Truck className="h-4 w-4" strokeWidth={2.25} />}
                Créer
              </button>
            </div>
          )}
        </div>
      )}

      {canTransition && nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setError(null);
                transition.mutate(status);
              }}
              disabled={transition.isPending}
              className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium disabled:opacity-50 ${
                status === 'CANCELLED' || status === 'DISPUTED'
                  ? 'border border-red-300 bg-white text-red-700 shadow-card transition-colors hover:bg-red-50 hover:shadow-card-hover'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {transition.isPending && transition.variables === status ? (
                <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              ) : (
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              )}
              {orderStatusLabel(status)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
