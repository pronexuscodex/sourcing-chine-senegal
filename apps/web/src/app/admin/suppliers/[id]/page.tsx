'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSupplierEvaluationInput } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, Factory, LoaderCircle, Star } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { ScoreBadge } from '../../../../components/score-badge';
import { Spinner } from '../../../../components/spinner';
import { formatDate } from '../../../../lib/format';

interface EvaluationView {
  id: string;
  priceScore: number;
  qualityScore: number;
  delayScore: number;
  reactivityScore: number;
  issueRate: number;
  computedScore: number;
  createdAt: string;
}

interface SupplierView {
  id: string;
  name: string;
  contact: string | null;
  platform: string | null;
  moq: number | null;
  notes: string | null;
  computedScore: number | null;
  evaluations: EvaluationView[];
}

const DEFAULT_FORM = { priceScore: 7, qualityScore: 7, delayScore: 7, reactivityScore: 7, issueRate: 0 };

export default function AdminSupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['admin', 'suppliers', params.id],
    queryFn: () => authFetch((token) => api.get<SupplierView>(`/admin/suppliers/${params.id}`, token)),
  });

  const addEvaluation = useMutation({
    mutationFn: (input: CreateSupplierEvaluationInput) =>
      authFetch((token) => api.post(`/admin/suppliers/${params.id}/evaluations`, input, token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers', params.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
      setForm(DEFAULT_FORM);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const canWrite = user?.permissions.includes('suppliers:write');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement du fournisseur…" />
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/suppliers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Fournisseurs
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Factory className="h-6 w-6 text-gray-700" strokeWidth={2} />
          {supplier.name}
        </h1>
        <ScoreBadge score={supplier.computedScore} />
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
        <p>{supplier.platform ?? 'Plateforme non précisée'}{supplier.moq ? ` — MOQ ${supplier.moq}` : ''}</p>
        {supplier.contact && <p className="mt-1">Contact : {supplier.contact}</p>}
        {supplier.notes && <p className="mt-2">{supplier.notes}</p>}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {error}
        </p>
      )}

      <div>
        <h2 className="text-sm font-medium text-gray-700">Évaluations</h2>
        {supplier.evaluations.length === 0 && <p className="mt-2 text-sm text-gray-500">Aucune évaluation enregistrée.</p>}
        <ul className="mt-3 flex flex-col gap-3">
          {supplier.evaluations.map((evaluation) => (
            <li key={evaluation.id} className="rounded-lg border border-gray-200 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{formatDate(evaluation.createdAt)}</span>
                <ScoreBadge score={evaluation.computedScore} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-gray-600 sm:grid-cols-4">
                <span>Prix : {evaluation.priceScore}/10</span>
                <span>Qualité : {evaluation.qualityScore}/10</span>
                <span>Délai : {evaluation.delayScore}/10</span>
                <span>Réactivité : {evaluation.reactivityScore}/10</span>
              </div>
              <p className="mt-1 text-gray-500">Taux d&apos;incident : {Math.round(evaluation.issueRate * 100)}%</p>
            </li>
          ))}
        </ul>
      </div>

      {canWrite && (
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Star className="h-4 w-4" strokeWidth={2} />
            Ajouter une évaluation
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500">Prix (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.priceScore}
                onChange={(e) => setForm({ ...form, priceScore: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Qualité (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.qualityScore}
                onChange={(e) => setForm({ ...form, qualityScore: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Délai (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.delayScore}
                onChange={(e) => setForm({ ...form, delayScore: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Réactivité (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={form.reactivityScore}
                onChange={(e) => setForm({ ...form, reactivityScore: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500">Taux d&apos;incident (0-100%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={Math.round(form.issueRate * 100)}
                onChange={(e) => setForm({ ...form, issueRate: Number(e.target.value) / 100 })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              addEvaluation.mutate(form);
            }}
            disabled={addEvaluation.isPending}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {addEvaluation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Star className="h-4 w-4" strokeWidth={2.25} />}
            Enregistrer l&apos;évaluation
          </button>
        </div>
      )}
    </div>
  );
}
