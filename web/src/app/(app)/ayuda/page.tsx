import { Card, PageHeader } from '@/components/ui/Card';

const FAQS = [
  {
    q: '¿Cómo registran sus visitas mis clientes?',
    a: 'El cliente escanea el QR de tu negocio desde la app. Genera o imprime el QR en la sección "QR del negocio".',
  },
  {
    q: '¿Cómo se canjea un beneficio?',
    a: 'El cliente genera un código temporal en su app y tu personal lo escanea para confirmarlo. Cada canje queda registrado con el empleado que lo validó.',
  },
  {
    q: '¿Qué pasa si me saturo de canjes?',
    a: 'En "Control de capacidad" puedes poner cupos por día/mes, stock total, o pausar todo el programa de emergencia.',
  },
  {
    q: '¿Cómo agrego a mi personal?',
    a: 'En "Personal" creas una cuenta para cada empleado. Ellos entran a la app con esas credenciales y solo ven la pantalla para confirmar canjes.',
  },
  {
    q: '¿Las reseñas son públicas?',
    a: 'No por defecto. Las reseñas son privadas para ti; tú decides cuáles mostrar públicamente desde la sección "Reseñas".',
  },
];

export default function AyudaPage() {
  return (
    <div>
      <PageHeader icon="💬" title="Centro de ayuda" description="Preguntas frecuentes y soporte." />

      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <Card key={i}>
            <div className="font-medium text-gray-900">{f.q}</div>
            <p className="mt-1 text-sm text-gray-600">{f.a}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="font-medium text-gray-900">¿Necesitas más ayuda?</div>
        <p className="mt-1 text-sm text-gray-600">
          Escríbenos por WhatsApp o correo y te apoyamos con la configuración de tu negocio.
        </p>
        <div className="mt-3 flex gap-3 text-sm">
          <a href="https://wa.me/" className="font-medium text-indigo-600 hover:underline">WhatsApp</a>
          <a href="mailto:soporte@yoyo.dev" className="font-medium text-indigo-600 hover:underline">soporte@yoyo.dev</a>
        </div>
      </Card>
    </div>
  );
}
