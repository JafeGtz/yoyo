// Utilidades de validación de imágenes en el navegador.

export function dimensiones(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Devuelve un mensaje de error si no cumple el tamaño mínimo, o null si está bien. */
export async function validarTamano(file: File, minW: number, minH: number): Promise<string | null> {
  try {
    const { w, h } = await dimensiones(file);
    if (w < minW || h < minH) {
      return `Imagen muy pequeña (${w}×${h} px). Usa al menos ${minW}×${minH} px.`;
    }
    return null;
  } catch {
    return 'No se pudo leer la imagen.';
  }
}
