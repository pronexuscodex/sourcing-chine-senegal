'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Hash,
  Link2,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Palette,
  Ruler,
  Send,
  ShoppingBag,
  Text,
  Wallet,
} from 'lucide-react';
import type { CreateSourcingRequestInput } from '@sourcing/shared';
import { useAuth } from '../../../../lib/auth-context';
import { api } from '../../../../lib/api-client';
import { FieldError, FieldIcon, inputClasses } from '../../../../components/form-field';

// Schéma du formulaire à plat (un seul produit — §11 "commencer une commande en
// quelques secondes") ; transformé en payload imbriqué {destination, items:[...]}
// à la soumission. La validation stricte de la forme imbriquée reste faite par
// l'API (ZodValidationPipe côté serveur) — ce schéma-ci ne fait que guider l'UX.
const requestFormSchema = z.object({
  destination: z.string().min(2, 'Destination requise'),
  productLink: z.string().url('Lien invalide').optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  quantity: z.coerce.number().int().positive('Quantité requise'),
  color: z.string().max(100).optional(),
  size: z.string().max(100).optional(),
  budgetAmount: z.coerce.number().positive().optional(),
  comments: z.string().max(2000).optional(),
});
type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: { destination: 'Dakar' },
  });

  const onSubmit = async (values: RequestFormValues) => {
    setServerError(null);
    const payload: CreateSourcingRequestInput = {
      destination: values.destination,
      items: [
        {
          productLink: values.productLink || undefined,
          description: values.description || undefined,
          quantity: values.quantity,
          color: values.color || undefined,
          size: values.size || undefined,
          budgetAmount: values.budgetAmount,
          budgetCurrency: 'XOF',
          comments: values.comments || undefined,
        },
      ],
    };

    try {
      await authFetch((token) => api.post('/sourcing-requests', payload, token));
      router.push('/dashboard/requests');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Impossible de créer la demande.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShoppingBag className="h-6 w-6 text-gray-700" strokeWidth={2} />
          Je veux acheter un produit
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Collez un lien Alibaba/1688 ou décrivez ce que vous recherchez — notre équipe analyse votre demande.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">Lien du produit (Alibaba, 1688…)</label>
          <div className="relative">
            <FieldIcon icon={Link2} />
            <input {...register('productLink')} placeholder="https://..." className={inputClasses} />
          </div>
          <FieldError message={errors.productLink?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium">Description du produit</label>
          <div className="relative">
            <Text className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" strokeWidth={2} />
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Ex : 100 polos noirs de bonne qualité"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Quantité</label>
            <div className="relative">
              <FieldIcon icon={Hash} />
              <input type="number" {...register('quantity')} className={inputClasses} />
            </div>
            <FieldError message={errors.quantity?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium">Budget estimé (FCFA)</label>
            <div className="relative">
              <FieldIcon icon={Wallet} />
              <input type="number" {...register('budgetAmount')} className={inputClasses} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Couleur</label>
            <div className="relative">
              <FieldIcon icon={Palette} />
              <input {...register('color')} className={inputClasses} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Taille</label>
            <div className="relative">
              <FieldIcon icon={Ruler} />
              <input {...register('size')} className={inputClasses} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Destination</label>
          <div className="relative">
            <FieldIcon icon={MapPin} />
            <input {...register('destination')} className={inputClasses} />
          </div>
          <FieldError message={errors.destination?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium">Commentaires</label>
          <div className="relative">
            <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" strokeWidth={2} />
            <textarea
              {...register('comments')}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>

        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white shadow-card transition-colors hover:bg-gray-800 hover:shadow-card-hover disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.25} />
          )}
          {isSubmitting ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>
    </div>
  );
}
