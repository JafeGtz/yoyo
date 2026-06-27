import { getSesion } from '@/lib/session';
import { ReportesClient } from './ReportesClient';

export default async function ReportesPage() {
  const { negocio } = await getSesion();
  return <ReportesClient negocioId={negocio!.id} esPlus={false} />;
}
