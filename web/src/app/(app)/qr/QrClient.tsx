'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';

export function QrClient({
  negocioId,
  inicialToken = null,
  inicialCodigo = null,
  inicialExpira = null,
}: {
  negocioId: string;
  inicialToken?: string | null;
  inicialCodigo?: string | null;
  inicialExpira?: string | null;
}) {
  const [token, setToken] = useState<string | null>(inicialToken);
  const [codigoRespaldo, setCodigoRespaldo] = useState<string | null>(inicialCodigo);
  const [expira, setExpira] = useState<string | null>(inicialExpira);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    setError(null);
    const { data, error } = await createClient().functions.invoke('rotar-qr', {
      body: { negocio_id: negocioId },
    });
    if (error || data?.error) {
      setError(data?.error ?? error?.message ?? 'Error al generar el QR.');
    } else {
      setToken(data.token);
      setCodigoRespaldo(data.codigo_respaldo);
      setExpira(data.expira_en);
    }
    setCargando(false);
  }

  return (
    <div>
      <PageHeader
        title="QR del negocio"
        description="Imprime este código y pégalo en tu local. Tus clientes lo escanean para registrar su visita."
      />
      <Card className="max-w-md">
        <p className="mb-4 text-sm text-gray-600">
          Al generar se crea un QR firmado con vigencia de 24 horas (el anterior
          se invalida).
        </p>
        <Button onClick={generar} disabled={cargando}>
          {cargando ? 'Generando…' : token ? 'Rotar QR' : 'Generar QR'}
        </Button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {token && (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6">
            <QRCodeSVG value={token} size={220} level="M" includeMargin />
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500">Código de respaldo (manual)</div>
              <div className="text-2xl font-bold tracking-widest text-gray-900">{codigoRespaldo}</div>
              {expira && (
                <div className="mt-1 text-xs text-gray-400">
                  Vence: {new Date(expira).toLocaleString('es-MX')}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
