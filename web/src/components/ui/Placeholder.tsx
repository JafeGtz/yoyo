import { PageHeader } from './Card';

/** Pantalla aún por implementar; mantiene la navegación completa. */
export function Placeholder({
  title,
  description,
  fase = 'F1',
}: {
  title: string;
  description: string;
  fase?: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
          {fase} · en construcción
        </span>
        <p className="mt-3 max-w-md text-sm text-gray-500">
          Pantalla planificada en <code>docs/pantallas.md</code>. La base de
          datos y los permisos ya están listos para conectarla.
        </p>
      </div>
    </div>
  );
}
