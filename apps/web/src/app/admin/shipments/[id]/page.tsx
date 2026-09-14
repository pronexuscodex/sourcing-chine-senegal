'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateShipmentEventInput } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, LoaderCircle, Plus } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { Spinner } from '../../../../components/spinner';
import { formatDate } from '../../../../lib/format';

const EVENT_TYPES = [
  { value: 'DEPARTED', label: 'Départ de Chine' },
  { value: 'IN_TRANSIT_UPDATE', label: 'Point de transit' },
  { value: 'CUSTOMS', label: 'Passage en douane' },
  { value: 'ARRIVED', label: 'Arrivée au Sénégal' },
] as const;
const DEFAULT_EVENT_TYPE: string = EVENT_TYPES[0].value;

interface ShipmentEventView {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
}

interface ShipmentPackageView {
  id: string;
  code: string;
  status: string;
  order: { code: string };
}

interface ShipmentView {
  id: string;
  code: string;
  departedAt: string | null;
  arrivedAt: string | null;
  packages: ShipmentPackageView[];
  events: ShipmentEventView[];
}

export default function AdminShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(DEFAULT_EVENT_TYPE);
  const [description, setDescription] = useState('');

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['admin', 'shipments', params.id],
    queryFn: () => authFetch((token) => api.get<ShipmentView>(`/admin/shipments/${params.id}`, token)),
  });

  const addEvent = useMutation({
    mutationFn: (input: CreateShipmentEventInput) =>
      authFetch((token) => api.post(`/admin/shipments/${params.id}/events`, input, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipments', params.id] });
      setDescription('');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const canWrite = user?.permissions.includes('warehouse:write');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de l'expédition…" />
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/shipments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Expéditions
      </Link>

      <h1 className="text-2xl font-semibold">{shipment.code}</h1>

      <div>
        <h2 className="text-sm font-medium text-gray-700">Colis ({shipment.packages.length})</h2>
        {shipment.packages.length === 0 && <p className="mt-2 text-sm text-gray-500">Aucun colis rattaché.</p>}
        <ul className="mt-3 flex flex-col gap-2">
          {shipment.packages.map((pkg) => (
            <li key={pkg.id}>
              <Link href={`/admin/warehouse/${pkg.id}`} className="text-sm text-blue-600 underline">
                {pkg.code}
              </Link>
              <span className="text-sm text-gray-500"> — commande {pkg.order.code}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium text-gray-700">Journal de suivi</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {shipment.events.map((event) => (
            <li key={event.id} className="text-sm">
              <span className="text-gray-400">{formatDate(event.occurredAt)}</span>{' '}
              <span className="font-medium">{event.type}</span> — {event.description}
            </li>
          ))}
          {shipment.events.length === 0 && <li className="text-sm text-gray-500">Aucun événement enregistré.</li>}
        </ul>

        {canWrite && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setError(null);
                if (description.trim()) addEvent.mutate({ type, description });
              }}
              disabled={!description.trim() || addEvent.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {addEvent.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Plus className="h-4 w-4" strokeWidth={2.25} />}
              Ajouter l&apos;événement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
