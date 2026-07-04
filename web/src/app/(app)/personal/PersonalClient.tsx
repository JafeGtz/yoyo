'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';

export interface Empleado {
  id: string;
  nombre: string | null;
  activo: boolean;
}

export function PersonalClient({
  negocioId,
  esDueno,
  inicial,
}: {
  negocioId: string;
  esDueno: boolean;
  inicial: Empleado[];
}) {
  const supabase = createClient();
  const [lista, setLista] = useState<Empleado[]>(inicial);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setOk(null);
    const { data, error } = await supabase.functions.invoke('crear-empleado', {
      body: { negocio_id: negocioId, email, password, nombre },
    });
    if (error || data?.error) {
      setError(data?.error ?? error?.message ?? 'No se pudo crear el empleado.');
    } else {
      setOk(`Empleado ${email} creado. Ya puede entrar a la app con esas credenciales.`);
      setLista([{ id: crypto.randomUUID(), nombre, activo: true }, ...lista]);
      setNombre('');
      setEmail('');
      setPassword('');
    }
    setGuardando(false);
  }

  async function alternarActivo(emp: Empleado) {
    await supabase.from('usuario_negocio').update({ activo: !emp.activo }).eq('id', emp.id);
    setLista(lista.map(x => (x.id === emp.id ? { ...x, activo: !x.activo } : x)));
  }

  return (
    <div>
      <PageHeader icon="🧑‍💼" title="Personal" description="Empleados que confirman canjes desde la app." />

      {esDueno && (
        <Card className="mb-6">
          <form onSubmit={crear} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
            <Field label="Nombre">
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" required />
            </Field>
            <Field label="Correo">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña temporal">
              <Input type="text" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
            </Field>
            <div>
              <Button type="submit" disabled={guardando}>{guardando ? 'Creando…' : 'Agregar empleado'}</Button>
            </div>
            <div className="md:col-span-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {ok && <p className="text-sm text-green-600">{ok}</p>}
            </div>
          </form>
        </Card>
      )}

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no hay empleados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {esDueno && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map(emp => (
                <tr key={emp.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.nombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${emp.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {emp.activo ? 'activo' : 'inactivo'}
                    </span>
                  </td>
                  {esDueno && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => alternarActivo(emp)} className="text-indigo-600 hover:underline">
                        {emp.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
