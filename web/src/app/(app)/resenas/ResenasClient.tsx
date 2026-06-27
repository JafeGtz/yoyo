'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';

export interface Resena {
  id: string;
  estrellas: number | null;
  comentario: string | null;
  nps: number | null;
  visibilidad: 'privada' | 'publica';
  aprobada_por_dueno: boolean;
  creada_en: string;
}

const estrellasTexto = (n: number | null) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—');

export function ResenasClient({ inicial }: { inicial: Resena[] }) {
  const supabase = createClient();
  const [lista, setLista] = useState<Resena[]>(inicial);

  // Aprobar = hacerla pública (ADR-03: solo las que el dueño elige).
  async function alternarPublica(r: Resena) {
    const aprobar = !r.aprobada_por_dueno;
    await supabase
      .from('resena')
      .update({ aprobada_por_dueno: aprobar, visibilidad: aprobar ? 'publica' : 'privada' })
      .eq('id', r.id);
    setLista(lista.map(x =>
      x.id === r.id
        ? { ...x, aprobada_por_dueno: aprobar, visibilidad: aprobar ? 'publica' : 'privada' }
        : x,
    ));
  }

  const promedio =
    lista.filter(r => r.estrellas).reduce((s, r) => s + (r.estrellas ?? 0), 0) /
    (lista.filter(r => r.estrellas).length || 1);

  return (
    <div>
      <PageHeader
        title="Reseñas"
        description="Privadas para ti. Aprueba solo las que quieras mostrar públicamente."
      />

      {lista.length > 0 && (
        <Card className="mb-6">
          <span className="text-sm text-gray-500">Calificación promedio</span>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {promedio.toFixed(1)} <span className="text-yellow-500">★</span>
            <span className="ml-2 text-sm font-normal text-gray-400">({lista.length} reseñas)</span>
          </div>
        </Card>
      )}

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no hay reseñas. Aparecerán cuando tus clientes canjeen y opinen.</p>
      ) : (
        <div className="space-y-3">
          {lista.map(r => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-yellow-500">{estrellasTexto(r.estrellas)}</div>
                  {r.comentario && <p className="mt-1 text-sm text-gray-700">{r.comentario}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    {r.nps != null && <span>NPS {r.nps}</span>}
                    <span>{new Date(r.creada_en).toLocaleDateString('es-MX')}</span>
                    {r.aprobada_por_dueno && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">Pública</span>
                    )}
                  </div>
                </div>
                <Button
                  variant={r.aprobada_por_dueno ? 'secondary' : 'primary'}
                  onClick={() => alternarPublica(r)}
                >
                  {r.aprobada_por_dueno ? 'Ocultar' : 'Mostrar pública'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
