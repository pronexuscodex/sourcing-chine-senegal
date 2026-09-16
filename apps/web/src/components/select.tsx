import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Classes de mise en page pour le <div> englobant (ex: "flex-1" dans un flex parent). */
  wrapperClassName?: string;
}

/**
 * Wrapper autour de <select> natif — un <select> brut garde le rendu de l'OS
 * (flèche, police, couleurs) qui jure avec le reste des champs stylés. Ici on
 * masque le chrome natif (appearance-none) et on redessine nous-mêmes la
 * flèche, pour un rendu identique aux <input> partout dans l'app.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', wrapperClassName = '', children, ...props }, ref) => (
    <div className={`relative ${wrapperClassName}`}>
      <select
        ref={ref}
        className={`w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-gray-900 shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        strokeWidth={2}
      />
    </div>
  ),
);
Select.displayName = 'Select';
