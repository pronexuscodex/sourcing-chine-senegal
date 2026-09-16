'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQualityInspectionInput } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, Ship, XCircle } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { PackageStatusBadge } from '../../../../components/status-badge';
import { Spinner } from '../../../../components/spinner';
import { Select } from '../../../../components/select';
import { formatDate } from '../../../../lib/format';

interface InspectionView {
  id: string;
  quantityVerified: boolean;
  variantVerified: boolean;
  issueReported: boolean;
  notes: string | null;
  createdAt: string;
}

interface PackageView {
  id: string;
  code: string;
  status: string;
  receivedAt: string;
  order: { code: string };
  shipment: { code: string } | null;
  inspections: InspectionView[];
}

interface ShipmentOption {
  id: string;
  code: string;
}

export default function AdminPackageDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [quantityVerified, setQuantityVerified] = useState(true);
  const [variantVerified, setVariantVerified] = useState(true);
  const [issueReported, setIssueReported] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['admin', 'warehouse', params.id],
    queryFn: () => authFetch((token) => api.get<PackageView>(`/admin/warehouse/packages/${params.id}`, token)),
  });

  const canInspect = user?.permissions.includes('quality-control:write');
  const canAttach = user?.permissions.includes('warehouse:write');

  const { data: shipments } = useQuery({
    queryKey: ['admin', 'shipments'],
    queryFn: () => authFetch((token) => api.get<ShipmentOption[]>('/admin/shipments', token)),
    enabled: canAttach && !!pkg && pkg.status === 'INSPECTED' && !pkg.shipment,
  });

  const inspect = useMutation({
    mutationFn: (input: CreateQualityInspectionInput) =>
      authFetch((token) => api.post(`/admin/warehouse/packages/${params.id}/inspection`, input, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', params.id] });
      setNotes('');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const attach = useMutation({
    mutationFn: (shipmentId: string) =>
      authFetch((token) => api.post(`/admin/shipments/${shipmentId}/packages/${params.id}`, undefined, token)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', params.id] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement du colis…" />
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/warehouse" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Colis
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{pkg.code}</h1>
        <PackageStatusBadge status={pkg.status} />
      </div>
      <p className="text-sm text-gray-500">
        Commande {pkg.order.code} — reçu le {formatDate(pkg.receivedAt)}
        {pkg.shipment && (
          <>
            {' '}
            — expédition <Link href={`/admin/shipments`} className="underline">{pkg.shipment.code}</Link>
          </>
        )}
      </p>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium text-gray-700">Inspections</h2>
        {pkg.inspections.length === 0 && <p className="mt-2 text-sm text-gray-500">Aucune inspection enregistrée.</p>}
        <ul className="mt-3 flex flex-col gap-3">
          {pkg.inspections.map((inspection) => (
            <li key={inspection.id} className="rounded-xl border border-gray-200 bg-white shadow-card p-4 text-sm">
              <p className="text-gray-400">{formatDate(inspection.createdAt)}</p>
              <div className="mt-1 flex flex-wrap gap-3">
                <span className={`flex items-center gap-1 ${inspection.quantityVerified ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {inspection.quantityVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  Quantité vérifiée
                </span>
                <span className={`flex items-center gap-1 ${inspection.variantVerified ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {inspection.variantVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  Variante vérifiée
                </span>
                {inspection.issueReported && (
                  <span className="flex items-center gap-1 text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Problème signalé
                  </span>
                )}
              </div>
              {inspection.notes && <p className="mt-2 text-gray-600">« {inspection.notes} »</p>}
            </li>
          ))}
        </ul>
      </div>

      {canInspect && pkg.status === 'RECEIVED' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-card p-4">
          <h2 className="text-sm font-medium text-gray-700">Ajouter une inspection</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={quantityVerified} onChange={(e) => setQuantityVerified(e.target.checked)} />
              Quantité conforme
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={variantVerified} onChange={(e) => setVariantVerified(e.target.checked)} />
              Variante (couleur/taille) conforme
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={issueReported} onChange={(e) => setIssueReported(e.target.checked)} />
              Signaler un problème
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optionnel)"
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <button
            onClick={() => {
              setError(null);
              inspect.mutate({ quantityVerified, variantVerified, issueReported, notes: notes || undefined, mediaDocumentIds: [] });
            }}
            disabled={inspect.isPending}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
          >
            {inspect.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />}
            Enregistrer l&apos;inspection
          </button>
        </div>
      )}

      {canAttach && pkg.status === 'INSPECTED' && !pkg.shipment && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-medium text-gray-700">Rattacher à une expédition</h2>
          <div className="mt-3 flex gap-3">
            <Select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              wrapperClassName="flex-1"
            >
              <option value="">Choisir une expédition…</option>
              {shipments?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </Select>
            <button
              onClick={() => {
                setError(null);
                if (selectedShipmentId) attach.mutate(selectedShipmentId);
              }}
              disabled={!selectedShipmentId || attach.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-2 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
            >
              {attach.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Ship className="h-4 w-4" strokeWidth={2.25} />}
              Rattacher
            </button>
          </div>
          {shipments?.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Aucune expédition disponible — <Link href="/admin/shipments" className="underline">créez-en une</Link> d&apos;abord.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
