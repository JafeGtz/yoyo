'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SECCIONES = [
  { grupo: 'Operación', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/clientes', label: 'Clientes (CRM)', icon: '👥' },
    { href: '/qr', label: 'QR del negocio', icon: '🔳' },
  ]},
  { grupo: 'Programa', items: [
    { href: '/plantillas', label: 'Plantillas', icon: '🧩' },
    { href: '/beneficios', label: 'Beneficios', icon: '🎁' },
    { href: '/capacidad', label: 'Control de capacidad', icon: '📦' },
    { href: '/membresias', label: 'Membresías', icon: '🏅' },
    { href: '/catalogo', label: 'Catálogo', icon: '📖' },
  ]},
  { grupo: 'Engagement', items: [
    { href: '/resenas', label: 'Reseñas', icon: '⭐' },
    { href: '/gamificacion', label: 'Gamificación', icon: '🎮' },
    { href: '/campanas', label: 'Campañas', icon: '📣' },
    { href: '/citas', label: 'Agenda de citas', icon: '📅' },
  ]},
  { grupo: 'Cuenta', items: [
    { href: '/personal', label: 'Personal', icon: '🧑‍💼' },
    { href: '/reportes', label: 'Reportes', icon: '📈' },
    { href: '/ayuda', label: 'Centro de ayuda', icon: '💬' },
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
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200/80 bg-white">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black text-white shadow-sm shadow-indigo-500/30">
          y
        </div>
        <div className="min-w-0">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-black leading-none text-transparent">yoyo</div>
          <div className="truncate text-xs text-gray-500">{negocioNombre}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {SECCIONES.map(s => (
          <div key={s.grupo} className="mb-5">
            <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {s.grupo}
            </div>
            <div className="space-y-0.5">
              {s.items.map(it => {
                const activo = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      activo
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 font-semibold text-indigo-700 ring-1 ring-indigo-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`text-base ${activo ? '' : 'opacity-80 grayscale group-hover:grayscale-0'}`}>{it.icon}</span>
                    <span className="truncate">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200/80 p-3">
        <button
          onClick={salir}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <span>↩︎</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
