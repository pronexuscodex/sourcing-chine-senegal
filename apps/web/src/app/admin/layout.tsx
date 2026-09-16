'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Boxes, FileText, LayoutDashboard, ListChecks, LogOut, Package, Ship, Truck, Factory } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Spinner } from '../../components/spinner';
import { LogoMark } from '../../components/logo';

const NAV_ITEMS = [
  { href: '/admin', label: 'Aperçu', icon: LayoutDashboard, permission: null as string | null },
  { href: '/admin/requests', label: 'Demandes', icon: ListChecks, permission: 'sourcing-requests:read:all' },
  { href: '/admin/quotes', label: 'Devis', icon: FileText, permission: 'quotes:read' },
  { href: '/admin/orders', label: 'Commandes', icon: Package, permission: 'orders:read:all' },
  { href: '/admin/suppliers', label: 'Fournisseurs', icon: Factory, permission: 'suppliers:read' },
  { href: '/admin/warehouse', label: 'Colis', icon: Boxes, permission: 'warehouse:read' },
  { href: '/admin/shipments', label: 'Expéditions', icon: Ship, permission: 'warehouse:read' },
  { href: '/admin/deliveries', label: 'Livraisons', icon: Truck, permission: 'warehouse:read' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // /admin/login vit sous /admin pour l'URL, mais ne doit jamais être gaté par ce
  // layout — sinon un visiteur non-staff ne pourrait jamais voir le formulaire de
  // connexion qui est censé le faire passer staff.
  const isLoginPage = pathname === '/admin/login';

  // roleName === 'CUSTOMER' ne doit jamais atteindre l'espace équipe, même si un
  // navigateur partagé a une session client active — c'est une redirection, pas
  // une garantie de sécurité (le backend reste la seule autorité via RequirePermission).
  const isStaff = !!user && user.roleName !== 'CUSTOMER';

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isStaff) router.replace('/admin/login');
  }, [isLoginPage, isLoading, isStaff, router]);

  // Back-office interne — jamais indexé, sur CHAQUE chemin de retour (React
  // hoiste ce <meta> dans <head> partout où il est rendu).
  const noIndexMeta = <meta name="robots" content="noindex, nofollow" />;

  if (isLoginPage)
    return (
      <>
        {noIndexMeta}
        {children}
      </>
    );

  if (isLoading || !isStaff) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        {noIndexMeta}
        <Spinner label="Chargement…" />
      </main>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.permission || user.permissions.includes(item.permission));

  return (
    <div className="min-h-screen">
      {noIndexMeta}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <LogoMark className="h-6 w-6" />
            Espace équipe
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-500">
              {user.roleName}
            </span>
          </span>
          <button
            onClick={() => logout().then(() => router.replace('/admin/login'))}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Se déconnecter
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-4 px-4 pb-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
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
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
