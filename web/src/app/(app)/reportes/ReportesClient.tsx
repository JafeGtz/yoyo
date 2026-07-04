'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';

function descargarCSV(nombre: string, filas: (string | number | null)[][]) {
  const csv = filas
    .map(f => f.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportesClient({ negocioId }: { negocioId: string; esPlus: boolean }) {
  const supabase = createClient();
  const [cargando, setCargando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function exportClientes() {
    setCargando('clientes');
    setMsg(null);
    const { data } = await supabase
      .from('cliente_negocio')
      .select('visitas_totales, monto_acumulado, ultima_visita, cliente:cliente_id(nombre, celular)')
      .eq('negocio_id', negocioId);
    const rows: (string | number | null)[][] = [['Nombre', 'Celular', 'Visitas', 'Monto acumulado', 'Última visita']];
    for (const r of (data as unknown as { visitas_totales: number; monto_acumulado: number; ultima_visita: string | null; cliente: { nombre: string; celular: string | null } | null }[]) ?? []) {
      rows.push([r.cliente?.nombre ?? '', r.cliente?.celular ?? '', r.visitas_totales, r.monto_acumulado, r.ultima_visita ?? '']);
    }
    descargarCSV('clientes.csv', rows);
    setMsg(`Exportados ${rows.length - 1} clientes.`);
    setCargando(null);
  }

  async function exportCanjes() {
    setCargando('canjes');
    setMsg(null);
    const { data } = await supabase
      .from('canje')
      .select('creado_en, beneficio_desbloqueado:beneficio_desbloqueado_id(beneficio:beneficio_id(nombre))')
      .eq('negocio_id', negocioId)
      .order('creado_en', { ascending: false });
    const rows: (string | number | null)[][] = [['Fecha', 'Beneficio']];
    for (const c of (data as unknown as { creado_en: string; beneficio_desbloqueado: { beneficio: { nombre: string } | null } | null }[]) ?? []) {
      rows.push([new Date(c.creado_en).toLocaleString('es-MX'), c.beneficio_desbloqueado?.beneficio?.nombre ?? '—']);
    }
    descargarCSV('canjes.csv', rows);
    setMsg(`Exportados ${rows.length - 1} canjes.`);
    setCargando(null);
  }

  return (
    <div>
      <PageHeader icon="📈" title="Reportes y exportación" description="Descarga tus datos para análisis o contabilidad." />

      {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-medium text-gray-900">Base de clientes</h3>
          <p className="mt-1 mb-3 text-sm text-gray-500">Nombre, celular, visitas, monto y última visita (CSV/Excel).</p>
          <Button onClick={exportClientes} disabled={cargando === 'clientes'}>
            {cargando === 'clientes' ? 'Generando…' : 'Exportar clientes'}
          </Button>
        </Card>
        <Card>
          <h3 className="font-medium text-gray-900">Canjes por beneficio</h3>
          <p className="mt-1 mb-3 text-sm text-gray-500">Historial de canjes con fecha y beneficio (CSV/Excel).</p>
          <Button onClick={exportCanjes} disabled={cargando === 'canjes'}>
            {cargando === 'canjes' ? 'Generando…' : 'Exportar canjes'}
          </Button>
        </Card>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        Reportes mensuales en PDF y reporte fiscal: se agregan más adelante (usa la impresión del navegador como alternativa).
      </p>
    </div>
  );
}
