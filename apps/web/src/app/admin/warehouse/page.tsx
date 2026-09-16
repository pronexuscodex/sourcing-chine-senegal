'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { PackageStatusBadge } from '../../../components/status-badge';
import { Spinner } from '../../../components/spinner';
import { formatDate } from '../../../lib/format';

interface PackageView {
  id: string;
  code: string;
  status: string;
  receivedAt: string;
  order: { code: string };
  inspections: { id: string }[];
}

export default function AdminWarehouseListPage() {
  const { authFetch } = useAuth();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['admin', 'warehouse'],
    queryFn: () => authFetch((token) => api.get<PackageView[]>('/admin/warehouse/packages', token)),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Colis en entrepôt</h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des colis…" />
        </div>
      )}

      {!isLoading && packages?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <Boxes className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">Aucun colis reçu pour le moment.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {packages?.map((pkg) => (
          <li key={pkg.id}>
            <Link
              href={`/admin/warehouse/${pkg.id}`}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-card p-4 transition-shadow hover:border-gray-300 hover:shadow-card-hover"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pkg.code}</span>
                  <PackageStatusBadge status={pkg.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Commande {pkg.order.code} — reçu le {formatDate(pkg.receivedAt)}
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
