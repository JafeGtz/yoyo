import { getSesion } from '@/lib/session';
import { PlantillasClient } from './PlantillasClient';

export default async function PlantillasPage() {
  const { negocio } = await getSesion();
  return <PlantillasClient negocioId={negocio!.id} />;
}
