import { getSesion } from '@/lib/session';
import { QrClient } from './QrClient';

export default async function QrPage() {
  const { negocio } = await getSesion();
  return <QrClient negocioId={negocio!.id} />;
}
