'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';

export function VisitasChart({ data }: { data: { dia: string; visitas: number }[] }) {
  return (
    <Card>
      <h3 className="mb-4 font-medium text-gray-900">Visitas (últimos 14 días)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="visitas" stroke="#4F46E5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TopBeneficiosChart({ data }: { data: { nombre: string; total: number }[] }) {
  return (
    <Card>
      <h3 className="mb-4 font-medium text-gray-900">Beneficios más canjeados</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no hay canjes.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#4F46E5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
