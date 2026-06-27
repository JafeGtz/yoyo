'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const PLANES = [
  ['basico', 'Básico — solo visitas'],
  ['plus', 'Plus — visitas + monto'],
  ['premium', 'Premium — todo incluido'],
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [f, setF] = useState({
    nombre: '',
    tipo: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    modelo: 'basico' as 'basico' | 'plus',
    plan: 'basico' as 'basico' | 'plus' | 'premium',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Logo opcional → Storage.
    let logoUrl: string | null = null;
    if (logo) {
      const path = `${user.id}/${Date.now()}-${logo.name}`;
      const { error: upErr } = await supabase.storage.from('logos').upload(path, logo);
      if (upErr) { setError('Error subiendo el logo: ' + upErr.message); setCargando(false); return; }
      logoUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
    }

    // 2 meses de prueba gratis.
    const prueba = new Date();
    prueba.setDate(prueba.getDate() + 60);

    const { data: negocio, error: negErr } = await supabase
      .from('negocio')
      .insert({
        nombre: f.nombre,
        tipo: f.tipo,
        descripcion: f.descripcion || null,
        direccion: f.direccion || null,
        telefono: f.telefono || null,
        logo_url: logoUrl,
        modelo_acumulacion: f.modelo,
        plan: f.plan,
        prueba_hasta: prueba.toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    if (negErr || !negocio) { setError(negErr?.message ?? 'No se pudo crear el negocio.'); setCargando(false); return; }

    const { error: unErr } = await supabase
      .from('usuario_negocio')
      .insert({ auth_user_id: user.id, negocio_id: negocio.id, rol: 'dueno' });
    if (unErr) { setError(unErr.message); setCargando(false); return; }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <Card className="w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900">Configura tu negocio</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">En menos de 15 minutos. Incluye 2 meses gratis.</p>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Nombre del negocio">
              <Input value={f.nombre} onChange={e => set('nombre', e.target.value)} required />
            </Field>
          </div>
          <Field label="Tipo de negocio">
            <Input value={f.tipo} onChange={e => set('tipo', e.target.value)} placeholder="Barbería, café…" required />
          </Field>
          <Field label="Teléfono">
            <Input value={f.telefono} onChange={e => set('telefono', e.target.value)} placeholder="55…" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Dirección">
              <Input value={f.direccion} onChange={e => set('direccion', e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Descripción">
              <Input value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Breve descripción de tu negocio" />
            </Field>
          </div>
          <Field label="Modelo de acumulación">
            <Select value={f.modelo} onChange={e => set('modelo', e.target.value)}>
              <option value="basico">Básico — por visitas</option>
              <option value="plus">Plus — visitas + monto</option>
            </Select>
          </Field>
          <Field label="Plan de suscripción">
            <Select value={f.plan} onChange={e => set('plan', e.target.value)}>
              {PLANES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Logo (opcional)">
              <input
                type="file"
                accept="image/*"
                onChange={e => setLogo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
              />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={cargando} className="w-full">
              {cargando ? 'Creando…' : 'Crear negocio'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
