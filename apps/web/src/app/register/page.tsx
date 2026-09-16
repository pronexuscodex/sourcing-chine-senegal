'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@sourcing/shared';
import Link from 'next/link';
import { AlertCircle, AtSign, LoaderCircle, Lock, Phone, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { FieldError, FieldIcon, inputClasses } from '../../components/form-field';
import { Logo } from '../../components/logo';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (input: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser(input);
      router.push('/dashboard');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Inscription impossible.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Logo className="h-9 w-9" />
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <UserPlus className="h-6 w-6 text-gray-700" strokeWidth={2} />
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-medium text-gray-900 underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Prénom</label>
            <div className="relative">
              <FieldIcon icon={User} />
              <input {...register('firstName')} className={inputClasses} />
            </div>
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium">Nom</label>
            <div className="relative">
              <FieldIcon icon={User} />
              <input {...register('lastName')} className={inputClasses} />
            </div>
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <div className="relative">
            <FieldIcon icon={AtSign} />
            <input type="email" {...register('email')} className={inputClasses} />
          </div>
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium">Téléphone (optionnel si email fourni)</label>
          <div className="relative">
            <FieldIcon icon={Phone} />
            <input {...register('phone')} className={inputClasses} />
          </div>
          <FieldError message={errors.phone?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium">Mot de passe</label>
          <div className="relative">
            <FieldIcon icon={Lock} />
            <input type="password" {...register('password')} className={inputClasses} />
          </div>
          <FieldError message={errors.password?.message} />
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
            <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          )}
          {isSubmitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      </div>
    </main>
  );
}
