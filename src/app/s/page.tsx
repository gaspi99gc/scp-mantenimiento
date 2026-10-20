// Hoy: la pantalla de inicio del supervisor.
// Contesta en un vistazo qué hay que hacer hoy y qué se está por pasar.
// En la computadora: lo que vence a la izquierda, ancho; visitas y pedidos en una columna a la derecha.

import {
  BloqueVisitaEnCurso, FilaPedido, FilaVisita, GrupoDeLocal, PlanillaSimple, Seccion,
} from "@/components/hoy/bloques";
import { datosHoy, describirSiguiente } from "@/components/hoy/consultas";
import { cantidad, mayusculaInicial } from "@/components/hoy/texto";
import { BotonLink, Encabezado, Vacio } from "@/components/ui";
import { fechaLarga, hoy } from "@/lib/fechas";

export const metadata = { title: "Hoy" };

function resumen(d: ReturnType<typeof datosHoy>): string {
  const v = d.vencidas.length;
  const s = d.enSieteDias.length;
  let controles: string;
  if (v && s) controles = `${cantidad(v, "control vencido", "controles vencidos")} y ${s} que ${s === 1 ? "vence" : "vencen"} en los próximos 7 días.`;
  else if (v) controles = `${cantidad(v, "control vencido", "controles vencidos")}.`;
  else if (s) controles = `${cantidad(s, "control vence", "controles vencen")} en los próximos 7 días.`;
  else controles = "Nada vencido ni por vencer en los próximos 7 días.";

  let visitas = "";
  if (d.enCurso.length === 1) visitas = " Tenés una visita en curso.";
  else if (d.enCurso.length > 1) visitas = ` Tenés ${d.enCurso.length} visitas en curso.`;
  else if (d.proximasVisitas[0]?.fecha === hoy()) visitas = ` Hoy tenés visita en ${d.proximasVisitas[0].local}.`;

  return controles + visitas;
}

export default function Hoy() {
  const referencia = hoy();
  const d = datosHoy(referencia);
  const sinUrgencias = d.vencidas.length === 0 && d.enSieteDias.length === 0;
  const hayCostado = d.proximasVisitas.length > 0 || d.pedidosAbiertos.length > 0;

  return (
    <>
      <Encabezado titulo={mayusculaInicial(fechaLarga(referencia))} bajada={resumen(d)} />

      {d.enCurso.map((v) => (
        <BloqueVisitaEnCurso key={v.id} visita={v} />
      ))}

      <div className={hayCostado ? "lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-x-10" : undefined}>
        <div className="min-w-0">
          {d.gruposVencidos.length > 0 && (
            <Seccion id="vencidos" titulo="Vencidos" aparte={cantidad(d.vencidas.length, "control", "controles")}>
              <div className="space-y-4">
                {d.gruposVencidos.map((g) => (
                  <GrupoDeLocal key={g.local.id} grupo={g} />
                ))}
              </div>
            </Seccion>
          )}

          {d.gruposSemana.length > 0 && (
            <Seccion
              id="semana"
              titulo="Vencen en los próximos 7 días"
              aparte={cantidad(d.enSieteDias.length, "control", "controles")}
            >
              <div className="space-y-4">
                {d.gruposSemana.map((g) => (
                  <GrupoDeLocal key={g.local.id} grupo={g} />
                ))}
              </div>
            </Seccion>
          )}

          {sinUrgencias && (
            <div className="mb-10">
              <Vacio accion={<BotonLink href="/s/agenda" variante="secundario">Ver la agenda</BotonLink>}>
                No hay nada vencido ni por vencer en los próximos 7 días.{" "}
                {d.siguiente ? describirSiguiente(d.siguiente) : "Todavía no hay vencimientos cargados."}
              </Vacio>
            </div>
          )}
        </div>

        {hayCostado && (
          <div className="min-w-0">
            {d.proximasVisitas.length > 0 && (
              <Seccion id="visitas" titulo="Próximas visitas">
                <PlanillaSimple>
                  {d.proximasVisitas.map((v) => (
                    <FilaVisita key={v.id} visita={v} referencia={referencia} />
                  ))}
                </PlanillaSimple>
              </Seccion>
            )}

            {d.pedidosAbiertos.length > 0 && (
              <Seccion id="pedidos" titulo="Pedidos abiertos">
                <PlanillaSimple>
                  {d.pedidosAbiertos.map((p) => (
                    // TODO: llevar a la bandeja de pedidos cuando exista; por ahora, a la ficha del local.
                    <FilaPedido key={p.id} pedido={p} href={`/s/locales/${p.localId}`} />
                  ))}
                </PlanillaSimple>
              </Seccion>
            )}
          </div>
        )}
      </div>
    </>
  );
}
