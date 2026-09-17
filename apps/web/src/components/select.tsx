'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  /** Classes de mise en page pour le conteneur englobant (ex: "flex-1" dans un flex parent). */
  wrapperClassName?: string;
}

/**
 * Menu déroulant entièrement custom — un <select> natif ne peut être stylé que
 * fermé : le panneau ouvert reste dessiné par l'OS/le navigateur, impossible à
 * faire correspondre au reste du design (bordures, ombres, police). Celui-ci
 * est un vrai listbox en divs/boutons, donc chaque état (fermé, ouvert, survol,
 * sélectionné) suit exactement le même système visuel que le reste de l'app.
 */
export function Select({ value, onChange, options, placeholder = 'Sélectionner…', className = '', wrapperClassName = '' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left shadow-card transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${className}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {open && (
        <ul className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-card-hover">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                  option.value === value ? 'font-medium text-gray-900' : 'text-gray-700'
                }`}
              >
                {option.label}
                {option.value === value && <Check className="h-3.5 w-3.5 text-gray-900" strokeWidth={2.25} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
