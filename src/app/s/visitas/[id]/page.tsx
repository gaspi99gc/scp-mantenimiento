// Modo visita: /s/visitas/vi-1
import { notFound } from "next/navigation";
import { checkInDe, controlesDeVisita, informeDeVisita } from "@/components/visitas/consultas";
import { ModoVisita } from "@/components/visitas/modo-visita";
import { localDe, visitaDe } from "@/lib/datos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visita = visitaDe(id);
  const local = visita ? localDe(visita.localId) : undefined;
  return { title: local ? `Visita a ${local.nombre}` : "Visita" };
}

export default async function PaginaVisita({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visita = visitaDe(id);
  if (!visita) notFound();
  const local = localDe(visita.localId);
  if (!local) notFound();

  const informe = informeDeVisita(visita.id);

  return (
    <ModoVisita
      visita={{
        id: visita.id,
        tipo: visita.tipo,
        fecha: visita.fecha,
        franja: visita.franja,
        estado: visita.estado,
        nota: visita.nota,
      }}
      local={{ id: local.id, nombre: local.nombre }}
      encargado={local.encargado.nombre}
      controles={controlesDeVisita(visita)}
      checkIn={checkInDe(visita)}
      // TODO(supabase): al cerrar la visita se crea el borrador; mientras tanto, si no hay, se vuelve a Hoy.
      informeHref={informe ? `/s/informes/${informe.id}` : "/s"}
      armarHref={`/s/visitas/nueva?local=${local.id}`}
    />
  );
}
