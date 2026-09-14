import { LoaderCircle } from 'lucide-react';

export function Spinner({ label, className = 'h-4 w-4' }: { label?: string; className?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
      <LoaderCircle className={`animate-spin ${className}`} strokeWidth={2.25} />
      {label}
    </span>
  );
}
