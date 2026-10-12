// Armar visita: /s/visitas/nueva?local=loc-1 (sin local, primero se elige el local).
import { notFound } from "next/navigation";
import { IconoSiguiente } from "@/components/iconos";
import { Encabezado, Fila, Planilla } from "@/components/ui";
import { ArmarVisita } from "@/components/visitas/armar-visita";
import { controlesParaArmar, localesParaArmar, requisitoDeAcceso } from "@/components/visitas/consultas";
import { localDe, supervisorActual } from "@/lib/datos";
import { fechaCorta, hoy } from "@/lib/fechas";

export const metadata = { title: "Armar visita" };

function cuentas(r: { vencidos: number; pronto: number; sinDatos: number; total: number }): string {
  const partes: string[] = [];
  if (r.vencidos) partes.push(r.vencidos === 1 ? "1 vencido" : `${r.vencidos} vencidos`);
  if (r.pronto) partes.push(r.pronto === 1 ? "1 vence pronto" : `${r.pronto} vencen pronto`);
  if (r.sinDatos) partes.push(`${r.sinDatos} sin datos`);
  if (!partes.length) return "Todo al día";
  return partes.join(", ");
}

export default async function PaginaArmarVisita({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { local: param } = await searchParams;
  const localId = Array.isArray(param) ? param[0] : param;

  if (!localId) {
    const lista = localesParaArmar();
    return (
      <>
        <Encabezado titulo="Armar visita" bajada="Elegí el local. Los que tienen algo vencido van primero." volver={{ href: "/s", texto: "Hoy" }} />
        <Planilla titulo="Locales">
          {lista.map(({ local, resumen, proximaVisita }) => (
            <Fila
              key={local.id}
              href={`/s/visitas/nueva?local=${local.id}`}
              estado={resumen.peor}
              titulo={local.nombre}
              detalle={`${local.direccion}, ${local.barrio}`}
              debajo={
                <p className="text-sm">
                  {cuentas(resumen)}
                  {proximaVisita && <span className="text-cemento">. Visita el {fechaCorta(proximaVisita)}</span>}
                </p>
              }
              derecha={<IconoSiguiente className="text-cemento" tamano={20} />}
            />
          ))}
        </Planilla>
      </>
    );
  }

  const local = localDe(localId);
  if (!local) notFound();

  return (
    <ArmarVisita
      local={{ id: local.id, nombre: local.nombre, encargado: local.encargado }}
      supervisor={supervisorActual.nombre}
      controles={controlesParaArmar(local.id)}
      requisito={requisitoDeAcceso(local)}
      hoy={hoy()}
      ahora={Date.now()}
    />
  );
}
