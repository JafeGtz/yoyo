'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SECCIONES = [
  { grupo: 'Operación', items: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/clientes', label: 'Clientes (CRM)' },
    { href: '/qr', label: 'QR del negocio' },
  ]},
  { grupo: 'Programa', items: [
    { href: '/plantillas', label: 'Plantillas' },
    { href: '/beneficios', label: 'Beneficios' },
    { href: '/capacidad', label: 'Control de capacidad' },
    { href: '/membresias', label: 'Membresías' },
    { href: '/catalogo', label: 'Catálogo' },
  ]},
  { grupo: 'Engagement', items: [
    { href: '/resenas', label: 'Reseñas' },
    { href: '/gamificacion', label: 'Gamificación' },
    { href: '/campanas', label: 'Campañas' },
    { href: '/citas', label: 'Agenda de citas' },
  ]},
  { grupo: 'Cuenta', items: [
    { href: '/personal', label: 'Personal' },
    { href: '/reportes', label: 'Reportes' },
    { href: '/ayuda', label: 'Centro de ayuda' },
  ]},
];

export function Sidebar({ negocioNombre }: { negocioNombre: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-lg font-bold text-indigo-600">yoyo</div>
        <div className="truncate text-sm text-gray-500">{negocioNombre}</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECCIONES.map(s => (
          <div key={s.grupo} className="mb-4">
            <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {s.grupo}
            </div>
            {s.items.map(it => {
              const activo = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    activo
                      ? 'bg-indigo-50 font-medium text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={salir}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
