import type { LucideIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

export const inputClasses =
  'mt-1 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:border-gray-900 focus:outline-none';

export function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      strokeWidth={2}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
      {message}
    </p>
  );
}
