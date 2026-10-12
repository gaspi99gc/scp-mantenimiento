import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { datosInforme } from "@/components/informes/consultas";
import { PantallaInforme } from "@/components/informes/pantalla-informe";
import { supervisorActual } from "@/lib/datos";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = datosInforme(id);
  if (!d) return { title: "Informe" };
  return { title: d.estado === "borrador" ? "Revisar informe" : `Informe ${d.numero}` };
}

export default async function PaginaInforme({ params, searchParams }: Props) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const datos = datosInforme(id);
  if (!datos) notFound();

  // TODO(supabase): el autor de una subsanación sale de la sesión, nunca del formulario.
  const avisoInicial =
    aviso === "visita-cerrada" ? { texto: "Visita cerrada. Revisá el informe antes de publicarlo." } : null;
  return <PantallaInforme key={datos.id} datos={datos} autor={supervisorActual.nombre} avisoInicial={avisoInicial} />;
}
