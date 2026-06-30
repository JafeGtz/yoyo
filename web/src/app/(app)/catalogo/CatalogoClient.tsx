'use client';

import { useState } from 'react';
/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Card, PageHeader } from '@/components/ui/Card';
import { validarTamano } from '@/lib/imagen';

export interface Categoria { id: string; nombre: string; orden: number }
export interface Item {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  foto_url: string | null;
  categoria_id: string | null;
}

export function CatalogoClient({
  negocioId,
  categoriasIniciales,
  itemsIniciales,
}: {
  negocioId: string;
  categoriasIniciales: Categoria[];
  itemsIniciales: Item[];
}) {
  const supabase = createClient();
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales);
  const [items, setItems] = useState<Item[]>(itemsIniciales);

  // Form categoría
  const [catNombre, setCatNombre] = useState('');

  // Form item
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const nombreCat = (id: string | null) => categorias.find(c => c.id === id)?.nombre ?? 'Sin categoría';

  async function crearCategoria(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('catalogo_categoria')
      .insert({ negocio_id: negocioId, nombre: catNombre, orden: categorias.length })
      .select('id, nombre, orden')
      .single();
    if (!error && data) {
      setCategorias([...categorias, data as Categoria]);
      setCatNombre('');
    }
  }

  async function eliminarCategoria(id: string) {
    await supabase.from('catalogo_categoria').delete().eq('id', id);
    setCategorias(categorias.filter(c => c.id !== id));
  }

  async function crearItem(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    let fotoUrl: string | null = null;
    if (foto) {
      // Foto de producto cuadrada — mínimo 400×400.
      const errImg = await validarTamano(foto, 400, 400);
      if (errImg) { setError(`${errImg} Recomendado: 800×800 px (cuadrada).`); setGuardando(false); return; }
      const path = `${negocioId}/${Date.now()}-${foto.name}`;
      const { error: upErr } = await supabase.storage.from('catalogo').upload(path, foto);
      if (upErr) { setError('Error subiendo la foto: ' + upErr.message); setGuardando(false); return; }
      fotoUrl = supabase.storage.from('catalogo').getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await supabase
      .from('catalogo_item')
      .insert({
        negocio_id: negocioId,
        nombre,
        descripcion: descripcion || null,
        precio: precio.trim() === '' ? null : Number(precio),
        categoria_id: categoriaId || null,
        foto_url: fotoUrl,
      })
      .select('id, nombre, descripcion, precio, foto_url, categoria_id')
      .single();
    if (error) setError(error.message);
    else if (data) {
      setItems([data as Item, ...items]);
      setNombre(''); setDescripcion(''); setPrecio(''); setCategoriaId(''); setFoto(null);
    }
    setGuardando(false);
  }

  async function eliminarItem(id: string) {
    await supabase.from('catalogo_item').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  }

  return (
    <div>
      <PageHeader title="Catálogo / menú" description="Productos y servicios que verán tus clientes en la app." />

      {/* Categorías */}
      <Card className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">Categorías</h3>
        <form onSubmit={crearCategoria} className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Field label="Nueva categoría">
              <Input value={catNombre} onChange={e => setCatNombre(e.target.value)} placeholder="Bebidas, Cortes…" required />
            </Field>
          </div>
          <Button type="submit" variant="secondary">Agregar</Button>
        </form>
        {categorias.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categorias.map(c => (
              <span key={c.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {c.nombre}
                <button onClick={() => eliminarCategoria(c.id)} className="text-gray-400 hover:text-red-600">×</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Nuevo item */}
      <Card className="mb-6">
        <form onSubmit={crearItem} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <Field label="Nombre">
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Corte de cabello" required />
          </Field>
          <Field label="Descripción">
            <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </Field>
          <Field label="Precio ($)">
            <Input type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} />
          </Field>
          <Field label="Categoría">
            <Select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Foto (opcional) — recomendado cuadrada 800×800 px">
              <input type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700" />
            </Field>
          </div>
          <div className="md:col-span-2">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar al catálogo'}</Button>
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Tu catálogo está vacío.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map(it => (
            <Card key={it.id}>
              {it.foto_url && (
                <img src={it.foto_url} alt={it.nombre} className="mb-3 h-32 w-full rounded-lg object-cover" />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{it.nombre}</div>
                  <div className="text-xs text-gray-400">{nombreCat(it.categoria_id)}</div>
                  {it.descripcion && <div className="mt-1 text-sm text-gray-500">{it.descripcion}</div>}
                </div>
                <div className="font-semibold text-gray-900">{it.precio != null ? `$${it.precio}` : '—'}</div>
              </div>
              <button onClick={() => eliminarItem(it.id)} className="mt-3 text-sm text-red-600 hover:underline">Eliminar</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
