export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm shadow-gray-200/50 ${
        hover ? 'transition duration-200 hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xl text-white shadow-sm shadow-indigo-500/30">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const ACCENTS: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-500 shadow-indigo-500/30',
  amber: 'from-amber-400 to-orange-500 shadow-orange-500/30',
  emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/30',
  rose: 'from-rose-400 to-pink-500 shadow-rose-500/30',
  sky: 'from-sky-400 to-blue-500 shadow-sky-500/30',
  violet: 'from-fuchsia-500 to-purple-600 shadow-purple-500/30',
};

/** Encabezado de sección dentro de una tarjeta: chip con icono + título + subtítulo. */
export function SectionTitle({
  icon,
  title,
  subtitle,
  accent = 'indigo',
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENTS | string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white shadow-sm ${ACCENTS[accent] ?? ACCENTS.indigo}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
