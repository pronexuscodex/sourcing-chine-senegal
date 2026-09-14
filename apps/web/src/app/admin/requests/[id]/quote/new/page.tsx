'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateQuoteInput } from '@sourcing/shared';
import { AlertCircle, ArrowLeft, FilePlus, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../../../../../lib/auth-context';
import { api, ApiError } from '../../../../../../lib/api-client';
import { Spinner } from '../../../../../../components/spinner';

const numberInputClasses = 'mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-gray-900 focus:outline-none';

interface RequestItemView {
  id: string;
  description: string | null;
  quantity: number;
}

interface SourcingRequestView {
  id: string;
  code: string;
  destination: string;
  items: RequestItemView[];
}

const quoteItemFormSchema = z.object({
  requestItemId: z.string().uuid(),
  productCost: z.coerce.number().int().min(0),
  chinaInlandShipping: z.coerce.number().int().min(0),
  supplierFees: z.coerce.number().int().min(0),
  qualityControlFee: z.coerce.number().int().min(0),
  consolidationFee: z.coerce.number().int().min(0),
  internationalFreight: z.coerce.number().int().min(0),
  otherCosts: z.coerce.number().int().min(0),
  serviceFeePercent: z.coerce.number().min(0).max(100),
});

const quoteFormSchema = z.object({
  currency: z.enum(['XOF', 'CNY', 'USD', 'EUR']),
  exchangeRateUsed: z.coerce.number().positive(),
  validUntilDate: z.string().min(1, 'Date requise'),
  items: z.array(quoteItemFormSchema).min(1),
});
type QuoteFormValues = z.infer<typeof quoteFormSchema>;

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function NewQuotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: request, isLoading } = useQuery({
    queryKey: ['admin', 'sourcing-requests', params.id],
    queryFn: () => authFetch((token) => api.get<SourcingRequestView>(`/admin/sourcing-requests/${params.id}`, token)),
  });

  const defaultValues = useMemo<QuoteFormValues | undefined>(() => {
    if (!request) return undefined;
    return {
      currency: 'XOF',
      exchangeRateUsed: 1,
      validUntilDate: defaultValidUntil(),
      items: request.items.map((item) => ({
        requestItemId: item.id,
        productCost: 0,
        chinaInlandShipping: 0,
        supplierFees: 0,
        qualityControlFee: 0,
        consolidationFee: 0,
        internationalFreight: 0,
        otherCosts: 0,
        serviceFeePercent: 15,
      })),
    };
  }, [request]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    values: defaultValues,
  });

  const create = useMutation({
    mutationFn: (payload: CreateQuoteInput) => authFetch((token) => api.post<{ id: string }>('/admin/quotes', payload, token)),
    onSuccess: (quote) => router.push(`/admin/quotes/${quote.id}`),
    onError: (err) => setServerError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'),
  });

  const onSubmit = (values: QuoteFormValues) => {
    setServerError(null);
    const payload: CreateQuoteInput = {
      requestId: params.id,
      currency: values.currency,
      exchangeRateUsed: values.exchangeRateUsed,
      validUntil: new Date(`${values.validUntilDate}T23:59:59.000Z`).toISOString(),
      items: values.items.map((item) => ({
        requestItemId: item.requestItemId,
        productCost: item.productCost,
        chinaInlandShipping: item.chinaInlandShipping,
        supplierFees: item.supplierFees,
        qualityControlFee: item.qualityControlFee,
        consolidationFee: item.consolidationFee,
        internationalFreight: item.internationalFreight,
        otherCosts: item.otherCosts,
        serviceFeeRule: { type: 'percentage', value: item.serviceFeePercent },
      })),
    };
    create.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Chargement de la demande…" />
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Retour
      </button>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <FilePlus className="h-6 w-6 text-gray-700" strokeWidth={2} />
          Nouveau devis — {request.code}
        </h1>
        <p className="mt-1 text-sm text-gray-600">Destination : {request.destination}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Devise</label>
            <select {...register('currency')} className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-gray-900 focus:outline-none">
              <option value="XOF">XOF</option>
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Taux de change</label>
            <input type="number" step="0.01" {...register('exchangeRateUsed')} className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-gray-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium">Valable jusqu&apos;au</label>
            <input type="date" {...register('validUntilDate')} className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-gray-900 focus:outline-none" />
            {errors.validUntilDate && <p className="mt-1 text-xs text-red-600">{errors.validUntilDate.message}</p>}
          </div>
        </div>

        {request.items.map((item, index) => (
          <fieldset key={item.id} className="rounded-lg border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium">
              {item.description ?? 'Produit sans description'} — quantité {item.quantity}
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Coût produit</label>
                <input type="number" {...register(`items.${index}.productCost`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Transport Chine (interne)</label>
                <input type="number" {...register(`items.${index}.chinaInlandShipping`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Frais fournisseur</label>
                <input type="number" {...register(`items.${index}.supplierFees`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Contrôle qualité</label>
                <input type="number" {...register(`items.${index}.qualityControlFee`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Consolidation</label>
                <input type="number" {...register(`items.${index}.consolidationFee`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Fret international</label>
                <input type="number" {...register(`items.${index}.internationalFreight`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Autres frais</label>
                <input type="number" {...register(`items.${index}.otherCosts`)} className={numberInputClasses} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Frais de service (%)</label>
                <input type="number" step="0.1" {...register(`items.${index}.serviceFeePercent`)} className={numberInputClasses} />
              </div>
            </div>
          </fieldset>
        ))}

        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || create.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {create.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <FilePlus className="h-4 w-4" strokeWidth={2.25} />
          )}
          Créer le devis (brouillon)
        </button>
      </form>
    </div>
  );
}
