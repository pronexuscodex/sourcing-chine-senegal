'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Factory, Plus } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { ScoreBadge } from '../../../components/score-badge';
import { Spinner } from '../../../components/spinner';

interface SupplierView {
  id: string;
  name: string;
  contact: string | null;
  platform: string | null;
  moq: number | null;
  computedScore: number | null;
}

export default function AdminSuppliersListPage() {
  const { authFetch, user } = useAuth();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin', 'suppliers'],
    queryFn: () => authFetch((token) => api.get<SupplierView[]>('/admin/suppliers', token)),
  });

  const canCreate = user?.permissions.includes('suppliers:write');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fournisseurs</h1>
        {canCreate && (
          <Link
            href="/admin/suppliers/new"
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Nouveau fournisseur
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des fournisseurs…" />
        </div>
      )}

      {!isLoading && suppliers?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Factory className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucun fournisseur enregistré.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {suppliers?.map((supplier) => (
          <li key={supplier.id}>
            <Link
              href={`/admin/suppliers/${supplier.id}`}
              className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{supplier.name}</span>
                  <ScoreBadge score={supplier.computedScore} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {supplier.platform ?? 'Plateforme non précisée'}
                  {supplier.moq ? ` — MOQ ${supplier.moq}` : ''}
                  {supplier.contact ? ` — ${supplier.contact}` : ''}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
