'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANTILLAS } from '@/lib/plantillas';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';

export function PlantillasClient({ negocioId }: { negocioId: string }) {
  const supabase = createClient();
  const [aplicando, setAplicando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function aplicar(plantillaId: string) {
    const p = PLANTILLAS.find(x => x.id === plantillaId);
    if (!p) return;
    setAplicando(plantillaId);
    setMsg(null);

    const { error: nErr } = await supabase
      .from('nivel_membresia')
      .insert(p.niveles.map((n, i) => ({
        negocio_id: negocioId,
        nombre: n.nombre,
        visitas_minimas: n.visitas_minimas,
        orden: i,
      })));

    const { error: bErr } = await supabase
      .from('beneficio')
      .insert(p.beneficios.map(b => ({
        negocio_id: negocioId,
        nombre: b.nombre,
        tipo: b.tipo,
        condicion_tipo: 'visitas',
        condicion_visitas: b.condicion_visitas,
        vigencia_dias: b.vigencia_dias,
        valor_estimado: b.valor_estimado ?? null,
      })));

    if (nErr || bErr) {
      setMsg({ ok: false, texto: (nErr ?? bErr)!.message });
    } else {
      setMsg({ ok: true, texto: `Plantilla "${p.industria}" aplicada: ${p.beneficios.length} beneficios y ${p.niveles.length} niveles creados. Ajústalos en sus secciones.` });
    }
    setAplicando(null);
  }

  return (
    <div>
      <PageHeader title="Plantillas por industria" description="Empieza rápido con un set pre-armado y luego ajústalo." />

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.texto}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PLANTILLAS.map(p => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{p.industria}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.descripcion}</p>
              </div>
              <Button onClick={() => aplicar(p.id)} disabled={aplicando === p.id}>
                {aplicando === p.id ? 'Aplicando…' : 'Aplicar'}
              </Button>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <div className="font-medium text-gray-600">Beneficios</div>
              <ul className="mt-1 list-inside list-disc">
                {p.beneficios.map((b, i) => (
                  <li key={i}>{b.nombre} — a las {b.condicion_visitas} visitas</li>
                ))}
              </ul>
              <div className="mt-2 font-medium text-gray-600">Niveles</div>
              <div className="mt-1">{p.niveles.map(n => n.nombre).join(' · ')}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
