'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

export function Geocerca({
  negocioId,
  inicialLat,
  inicialLng,
  inicialRadio,
}: {
  negocioId: string;
  inicialLat: number | null;
  inicialLng: number | null;
  inicialRadio: number | null;
}) {
  const supabase = createClient();
  const [activo, setActivo] = useState(inicialRadio != null);
  const [lat, setLat] = useState(inicialLat?.toString() ?? '');
  const [lng, setLng] = useState(inicialLng?.toString() ?? '');
  const [radio, setRadio] = useState(inicialRadio?.toString() ?? '200');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setMsg('Tu navegador no soporta ubicación.');
      return;
    }
    setMsg('Obteniendo ubicación… (permite el acceso)');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setMsg('Ubicación tomada ✓ (estando en tu negocio)');
      },
      () => setMsg('No se pudo obtener la ubicación (permiso denegado).'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function guardar() {
    setGuardando(true);
    setMsg('');
    if (!activo) {
      await supabase.from('negocio').update({ radio_geocerca_m: null }).eq('id', negocioId);
      setMsg('Geocerca desactivada.');
      setGuardando(false);
      return;
    }
    const nlat = parseFloat(lat);
    const nlng = parseFloat(lng);
    const nradio = parseInt(radio, 10);
    if (isNaN(nlat) || isNaN(nlng)) {
      setMsg('Pon una ubicación válida (usa "Usar mi ubicación actual").');
      setGuardando(false);
      return;
    }
    if (isNaN(nradio) || nradio < 20) {
      setMsg('El radio debe ser de al menos 20 metros.');
      setGuardando(false);
      return;
    }
    const { error } = await supabase
      .from('negocio')
      .update({ lat: nlat, lng: nlng, radio_geocerca_m: nradio })
      .eq('id', negocioId);
    setMsg(error ? error.message : 'Geocerca guardada ✓');
    setGuardando(false);
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Geocerca (validar cercanía)</h3>
        {guardando && <span className="text-xs text-gray-400">Guardando…</span>}
      </div>
      <p className="mb-3 text-sm text-gray-500">
        Exige que el cliente esté físicamente en tu negocio para registrar la visita. Evita que registren visitas a distancia.
      </p>

      <label className="mb-3 flex items-center gap-2">
        <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} className="h-4 w-4" />
        <span className="text-sm text-gray-800">Exigir cercanía al escanear</span>
      </label>

      {activo && (
        <div className="space-y-3">
          <Button type="button" variant="secondary" onClick={usarMiUbicacion}>
            📍 Usar mi ubicación actual
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitud"><Input value={lat} onChange={e => setLat(e.target.value)} placeholder="25.6866" /></Field>
            <Field label="Longitud"><Input value={lng} onChange={e => setLng(e.target.value)} placeholder="-100.3161" /></Field>
          </div>
          <Field label="Radio (metros)">
            <Input type="number" min={20} value={radio} onChange={e => setRadio(e.target.value)} />
          </Field>
          <p className="text-xs text-gray-400">Tip: párate en la puerta de tu negocio y usa &quot;Usar mi ubicación actual&quot;. Un radio de 100–200 m suele funcionar bien.</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={guardar}>Guardar</Button>
        {msg && <span className="text-sm text-gray-500">{msg}</span>}
      </div>
    </Card>
  );
}
