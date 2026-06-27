'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/Card';

export interface FilaCliente {
  id: string;
  visitas_totales: number;
  monto_acumulado: number;
  ultima_visita: string | null;
  bloqueado: boolean;
  cliente: { nombre: string; celular: string | null } | null;
  nivel: { nombre: string } | null;
}

export function ClientesClient({ filas, esPlus }: { filas: FilaCliente[]; esPlus: boolean }) {
  const [q, setQ] = useState('');
  const filtradas = filas.filter(f => {
    const t = `${f.cliente?.nombre ?? ''} ${f.cliente?.celular ?? ''}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader title="Clientes" description="Busca, revisa y administra a tus clientes." />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Buscar por nombre o celular…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtradas.length === 0 ? (
        <p className="text-sm text-gray-500">
          {filas.length === 0 ? 'Aún no tienes clientes registrados.' : 'Sin resultados para tu búsqueda.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Celular</th>
                <th className="px-4 py-3 font-medium">Visitas</th>
                {esPlus && <th className="px-4 py-3 font-medium">Monto</th>}
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Última visita</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map(f => (
                <tr key={f.id} className={f.bloqueado ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {f.cliente?.nombre ?? '—'}
                    {f.bloqueado && <span className="ml-2 text-xs text-red-600">(bloqueado)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.cliente?.celular ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{f.visitas_totales}</td>
                  {esPlus && <td className="px-4 py-3 text-gray-600">${f.monto_acumulado}</td>}
                  <td className="px-4 py-3 text-gray-600">{f.nivel?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {f.ultima_visita ? new Date(f.ultima_visita).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clientes/${f.id}`} className="text-indigo-600 hover:underline">
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
