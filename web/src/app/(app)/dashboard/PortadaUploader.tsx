'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { validarTamano } from '@/lib/imagen';

export function PortadaUploader({ negocioId, inicial }: { negocioId: string; inicial: string | null }) {
  const supabase = createClient();
  const [url, setUrl] = useState<string | null>(inicial);
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState('');

  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg('');

    // Portada horizontal 16:9 — mínimo 800×450.
    const errImg = await validarTamano(file, 800, 450);
    if (errImg) {
      setMsg(`${errImg} Recomendado: 1200×675 px (16:9).`);
      return;
    }

    setSubiendo(true);
    const path = `portadas/${negocioId}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file);
    if (upErr) { setMsg(upErr.message); setSubiendo(false); return; }
    const nueva = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from('negocio').update({ portada_url: nueva }).eq('id', negocioId);
    if (error) setMsg(error.message);
    else { setUrl(nueva); setMsg('Imagen actualizada ✓'); }
    setSubiendo(false);
  }

  return (
    <Card>
      <h3 className="font-medium text-gray-900">Imagen de portada</h3>
      <p className="mt-1 mb-3 text-sm text-gray-500">
        Aparece en el carrusel de descubrimiento de la app del cliente.
        <br />
        <span className="text-gray-400">Recomendado: 1200×675 px (horizontal 16:9). Se recorta para llenar.</span>
      </p>
      {url && <img src={url} alt="Portada" className="mb-3 h-40 w-full rounded-lg object-cover" />}
      <input
        type="file"
        accept="image/*"
        onChange={subir}
        disabled={subiendo}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
      />
      {msg && <p className={`mt-2 text-sm ${msg.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
    </Card>
  );
}
