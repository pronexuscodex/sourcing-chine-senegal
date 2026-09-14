import {
  Archive,
  CheckCircle2,
  CircleDot,
  Clock,
  FileEdit,
  PackageCheck,
  Send,
  ShieldCheck,
  Ship,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const DEFAULT_STATUS: StatusConfig = {
  label: '',
  icon: CircleDot,
  className: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

function Badge({ status, config }: { status: string; config: Record<string, StatusConfig> }) {
  const resolved = config[status] ?? { ...DEFAULT_STATUS, label: status };
  const Icon = resolved.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${resolved.className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {resolved.label}
    </span>
  );
}

// ARCHITECTURE.md §11 — un badge par état de la demande de sourcing, jamais un
// emoji : icône réelle + couleur sémantique, cohérent avec le reste de l'UI.
const SOURCING_REQUEST_STATUS: Record<string, StatusConfig> = {
  RECEIVED: { label: 'En analyse', icon: CircleDot, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  IN_ANALYSIS: { label: 'En analyse', icon: CircleDot, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  QUOTED: {
    label: 'Devis disponible',
    icon: PackageCheck,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  CLOSED: { label: 'Clôturée', icon: Archive, className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

export function SourcingRequestStatusBadge({ status }: { status: string }) {
  return <Badge status={status} config={SOURCING_REQUEST_STATUS} />;
}

export function sourcingRequestStatusLabel(status: string): string {
  return SOURCING_REQUEST_STATUS[status]?.label ?? status;
}

const QUOTE_STATUS: Record<string, StatusConfig> = {
  DRAFT: { label: 'Brouillon', icon: FileEdit, className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
  SENT: { label: 'Devis reçu', icon: Send, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  ACCEPTED: { label: 'Accepté', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  REJECTED: { label: 'Refusé', icon: XCircle, className: 'bg-red-50 text-red-700 ring-red-600/20' },
  EXPIRED: { label: 'Expiré', icon: Clock, className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

export function QuoteStatusBadge({ status }: { status: string }) {
  return <Badge status={status} config={QUOTE_STATUS} />;
}

const ORDER_STATUS: Record<string, StatusConfig> = {
  QUOTE_PENDING: { label: 'Devis en attente', icon: Clock, className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
  QUOTE_SENT: { label: 'Devis reçu', icon: Send, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  QUOTE_ACCEPTED: {
    label: 'Devis accepté',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  PAYMENT_PENDING: { label: 'Paiement en attente', icon: Wallet, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  PAID: { label: 'Payée', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  ORDERED: { label: 'Commandée', icon: PackageCheck, className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  SUPPLIER_PROCESSING: {
    label: 'Chez le fournisseur',
    icon: PackageCheck,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  READY_FOR_SHIPMENT: {
    label: 'Prête à expédier',
    icon: PackageCheck,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  AT_CHINA_WAREHOUSE: {
    label: 'En entrepôt (Chine)',
    icon: Archive,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  QUALITY_CHECK: {
    label: 'Contrôle qualité',
    icon: ShieldCheck,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  CONSOLIDATED: { label: 'Consolidée', icon: Archive, className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  SHIPPED: { label: 'Expédiée', icon: Ship, className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  IN_TRANSIT: { label: 'En transit', icon: Ship, className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  ARRIVED_SENEGAL: {
    label: 'Arrivée au Sénégal',
    icon: Ship,
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  },
  CUSTOMS_PROCESSING: {
    label: 'En douane',
    icon: ShieldCheck,
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  },
  READY_FOR_DELIVERY: {
    label: 'Prête pour livraison',
    icon: Truck,
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  },
  OUT_FOR_DELIVERY: { label: 'En livraison', icon: Truck, className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  DELIVERED: { label: 'Livrée', icon: PackageCheck, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  COMPLETED: { label: 'Terminée', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  CANCELLED: { label: 'Annulée', icon: XCircle, className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
  DISPUTED: { label: 'En litige', icon: XCircle, className: 'bg-red-50 text-red-700 ring-red-600/20' },
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge status={status} config={ORDER_STATUS} />;
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS[status]?.label ?? status;
}

const PACKAGE_STATUS: Record<string, StatusConfig> = {
  RECEIVED: { label: 'Reçu', icon: Archive, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  INSPECTED: { label: 'Contrôlé', icon: ShieldCheck, className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  CONSOLIDATED: { label: 'Consolidé', icon: PackageCheck, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
};

export function PackageStatusBadge({ status }: { status: string }) {
  return <Badge status={status} config={PACKAGE_STATUS} />;
}

const DELIVERY_STATUS: Record<string, StatusConfig> = {
  PENDING: { label: 'En cours', icon: Truck, className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  DELIVERED: { label: 'Livrée', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  return <Badge status={status} config={DELIVERY_STATUS} />;
}
