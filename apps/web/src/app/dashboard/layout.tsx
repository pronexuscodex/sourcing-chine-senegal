'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FileText, LayoutDashboard, ListChecks, LogOut, Package } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Spinner } from '../../components/spinner';
import { Logo } from '../../components/logo';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Aperçu', icon: LayoutDashboard },
  { href: '/dashboard/requests', label: 'Mes demandes', icon: ListChecks },
  { href: '/dashboard/quotes', label: 'Mes devis', icon: FileText },
  { href: '/dashboard/orders', label: 'Mes commandes', icon: Package },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  // Espace client authentifié — jamais indexé, y compris pendant le
  // chargement/redirection (React hoiste ce <meta> dans <head> partout où il
  // est rendu, donc il doit être présent sur CHAQUE chemin de retour).
  const noIndexMeta = <meta name="robots" content="noindex, nofollow" />;

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        {noIndexMeta}
        <Spinner label="Chargement…" />
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      {noIndexMeta}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo className="h-7 w-7" />
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Se déconnecter
          </button>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-4 px-4 pb-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm ${active ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}
