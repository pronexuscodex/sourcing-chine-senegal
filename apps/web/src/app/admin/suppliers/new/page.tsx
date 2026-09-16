'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createSupplierSchema, type CreateSupplierInput } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, Factory, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import { api, ApiError } from '../../../../lib/api-client';
import { Select } from '../../../../components/select';

export default function NewSupplierPage() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierInput>({ resolver: zodResolver(createSupplierSchema) });

  const create = useMutation({
    mutationFn: (input: CreateSupplierInput) =>
      authFetch((token) => api.post<{ id: string }>('/admin/suppliers', input, token)),
    onSuccess: (supplier) => router.push(`/admin/suppliers/${supplier.id}`),
    onError: (err) => setServerError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const onSubmit = (input: CreateSupplierInput) => {
    setServerError(null);
    create.mutate(input);
  };

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Retour
      </button>

      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Factory className="h-6 w-6 text-gray-700" strokeWidth={2} />
        Nouveau fournisseur
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input {...register('name')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Contact</label>
          <input {...register('contact')} placeholder="Nom, WeChat, email…" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Plateforme</label>
            <Select {...register('platform')} className="mt-1">
              <option value="">—</option>
              <option value="ALIBABA">Alibaba</option>
              <option value="1688">1688</option>
              <option value="OTHER">Autre</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">MOQ</label>
            <input type="number" {...register('moq', { valueAsNumber: true })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea {...register('notes')} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>

        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || create.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
        >
          {create.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} /> : <Factory className="h-4 w-4" strokeWidth={2.25} />}
          Créer le fournisseur
        </button>
      </form>
    </div>
  );
}
