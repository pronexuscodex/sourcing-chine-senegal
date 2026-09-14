'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@sourcing/shared';
import Link from 'next/link';
import { AlertCircle, AtSign, Lock, LoaderCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { FieldError, FieldIcon, inputClasses } from '../../components/form-field';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (input: LoginInput) => {
    setServerError(null);
    try {
      await login(input);
      router.push('/dashboard');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Connexion impossible.');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <LogIn className="h-6 w-6 text-gray-700" strokeWidth={2} />
          Se connecter
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link href="/register" className="underline">
            Créer un compte
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">Email ou téléphone</label>
          <div className="relative">
            <FieldIcon icon={AtSign} />
            <input {...register('identifier')} className={inputClasses} />
          </div>
          <FieldError message={errors.identifier?.message} />
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
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <LogIn className="h-4 w-4" strokeWidth={2.25} />
          )}
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
