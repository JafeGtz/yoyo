type Tono = 'indigo' | 'green' | 'amber' | 'red' | 'gray' | 'sky' | 'violet';

const tonos: Record<Tono, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/15',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
};

/** Etiqueta de color por significado (estados, categorías…). */
export function Badge({ tono = 'gray', children, className = '' }: { tono?: Tono; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tonos[tono]} ${className}`}>
      {children}
    </span>
  );
}
