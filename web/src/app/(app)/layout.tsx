import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, negocio } = await getSesion();

  // Sin sesión -> login. Con sesión pero sin negocio -> onboarding.
  if (!userId) redirect('/login');
  if (!negocio) redirect('/onboarding');

  return (
    <div className="flex">
      <Sidebar negocioNombre={negocio.nombre} />
      <main className="h-screen flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-indigo-50/40">
        <div className="mx-auto max-w-6xl p-6 md:p-8 animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
