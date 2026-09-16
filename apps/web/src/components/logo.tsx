interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/**
 * Marque "route commerciale" : deux ports (Chine / Sénégal) reliés par une
 * ligne de navigation en pointillés, avec un repère au point médian. Dessinée
 * à la main (pas une icône stock) pour être distinctive sur le favicon comme
 * dans l'en-tête.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="#111827" />
      <path
        d="M10 29 Q 20 8 30 11"
        fill="none"
        stroke="#F9FAFB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3.2"
      />
      <circle cx="10" cy="29" r="2.6" fill="#F9FAFB" />
      <circle cx="30" cy="11" r="2.6" fill="#F9FAFB" />
      <path d="M20 10.6 L23 14.2 L20 17.8 L17 14.2 Z" fill="#F9FAFB" />
    </svg>
  );
}

export function Logo({ className = 'h-8 w-8', showWordmark = true }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={className} />
      {showWordmark && <span className="text-lg font-semibold tracking-tight text-gray-900">SinoSen</span>}
    </span>
  );
}
