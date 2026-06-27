// Plantillas pre-validadas por industria (requerimientos 5.4).
// El dueño elige una y se insertan sus beneficios y niveles; luego ajusta.

export interface PlantillaBeneficio {
  nombre: string;
  tipo: string;
  condicion_visitas: number;
  vigencia_dias: number;
  valor_estimado?: number;
}
export interface PlantillaNivel {
  nombre: string;
  visitas_minimas: number;
}
export interface Plantilla {
  id: string;
  industria: string;
  descripcion: string;
  niveles: PlantillaNivel[];
  beneficios: PlantillaBeneficio[];
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'barberia',
    industria: 'Barbería',
    descripcion: 'Premia la frecuencia: cortes y servicios gratis.',
    niveles: [
      { nombre: 'Cliente', visitas_minimas: 0 },
      { nombre: 'Frecuente', visitas_minimas: 5 },
      { nombre: 'VIP', visitas_minimas: 15 },
    ],
    beneficios: [
      { nombre: '15% de descuento', tipo: 'descuento_porcentual', condicion_visitas: 3, vigencia_dias: 15, valor_estimado: 50 },
      { nombre: 'Corte gratis', tipo: 'servicio_gratis', condicion_visitas: 8, vigencia_dias: 15, valor_estimado: 150 },
      { nombre: 'Corte + barba gratis', tipo: 'servicio_gratis', condicion_visitas: 15, vigencia_dias: 30, valor_estimado: 250 },
    ],
  },
  {
    id: 'cafeteria',
    industria: 'Cafetería',
    descripcion: 'El clásico: tu décimo café va por la casa.',
    niveles: [
      { nombre: 'Visitante', visitas_minimas: 0 },
      { nombre: 'Cafetero', visitas_minimas: 10 },
    ],
    beneficios: [
      { nombre: 'Café gratis', tipo: 'producto_gratis', condicion_visitas: 10, vigencia_dias: 30, valor_estimado: 45 },
      { nombre: 'Postre del día gratis', tipo: 'producto_gratis', condicion_visitas: 20, vigencia_dias: 15, valor_estimado: 60 },
    ],
  },
  {
    id: 'gimnasio',
    industria: 'Gimnasio',
    descripcion: 'Reconoce la constancia de tus miembros.',
    niveles: [
      { nombre: 'Inicial', visitas_minimas: 0 },
      { nombre: 'Constante', visitas_minimas: 12 },
      { nombre: 'Élite', visitas_minimas: 30 },
    ],
    beneficios: [
      { nombre: 'Clase especial gratis', tipo: 'acceso_exclusivo', condicion_visitas: 8, vigencia_dias: 20 },
      { nombre: 'Mes con 20% de descuento', tipo: 'descuento_porcentual', condicion_visitas: 20, vigencia_dias: 30, valor_estimado: 200 },
    ],
  },
  {
    id: 'restaurante',
    industria: 'Restaurante',
    descripcion: 'Postres, bebidas y upgrades para tus comensales.',
    niveles: [
      { nombre: 'Comensal', visitas_minimas: 0 },
      { nombre: 'Habitual', visitas_minimas: 6 },
    ],
    beneficios: [
      { nombre: 'Bebida de cortesía', tipo: 'producto_gratis', condicion_visitas: 3, vigencia_dias: 15, valor_estimado: 40 },
      { nombre: 'Postre gratis', tipo: 'producto_gratis', condicion_visitas: 6, vigencia_dias: 20, valor_estimado: 70 },
      { nombre: '2x1 en plato fuerte', tipo: 'combo_2x1', condicion_visitas: 12, vigencia_dias: 30, valor_estimado: 180 },
    ],
  },
];
