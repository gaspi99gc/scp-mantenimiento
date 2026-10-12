// Hoja de muestras del sistema de diseño: sirve de referencia para armar pantallas.
import { Colgadero, Tarjeta } from "@/components/tarjeta";
import { Boton, Chip, Encabezado, FechaFila, Fila, MarcaEstado, Planilla, Vacio } from "@/components/ui";
import { controles, describirControl, estadoControl, tipoDe, visitaProgramadaDe } from "@/lib/datos";
import { fechaConDia, fechaCorta, textoRelativo } from "@/lib/fechas";

export const metadata = { title: "Muestras" };

export default function Muestras() {
  const delElemento = controles.filter((c) => c.elementoId === "el-1" || c.elementoId === "el-3" || c.id === "co-17" || c.id === "co-23");
  return (
    <>
      <Encabezado
        titulo="Muestras del sistema de diseño"
        bajada="Referencia para armar pantallas. Ver docs/diseno.md."
        volver={{ href: "/s", texto: "Hoy" }}
      />

      <Planilla titulo="Tarjetas de control">
        <li className="p-4">
          <Colgadero>
            {delElemento.map((c) => {
              const tipo = tipoDe(c);
              const v = visitaProgramadaDe(c.id);
              return (
                <Tarjeta
                  key={c.id}
                  control={c}
                  tipo={tipo}
                  estado={estadoControl(c)}
                  programada={v ? `Visita el ${fechaConDia(v.fecha)}` : undefined}
                >
                  <Boton variante={estadoControl(c) === "al_dia" ? "secundario" : "primario"} ancho>
                    {tipo.verbo}
                  </Boton>
                </Tarjeta>
              );
            })}
          </Colgadero>
        </li>
      </Planilla>

      <Planilla titulo="Filas" aparte="Peor estado primero">
        {controles.slice(14, 19).map((c) => {
          const { que, sobre, donde } = describirControl(c);
          const e = estadoControl(c);
          return (
            <Fila
              key={c.id}
              href="#"
              estado={e}
              titulo={que}
              detalle={donde ? `${sobre}, ${donde.charAt(0).toLowerCase()}${donde.slice(1)}` : sobre}
              derecha={
                c.vencimiento ? (
                  <FechaFila fecha={fechaCorta(c.vencimiento)} relativo={textoRelativo(c.vencimiento)} tono={e === "vencido" ? "rojo" : "normal"} />
                ) : (
                  <span className="text-sm text-cemento">Sin fecha</span>
                )
              }
            />
          );
        })}
      </Planilla>

      <section className="mb-7 space-y-4">
        <h2 className="text-lg font-[650]">Botones, chips y estados</h2>
        <div className="flex flex-wrap gap-2">
          <Boton>Armar visita</Boton>
          <Boton variante="secundario">Ver ficha</Boton>
          <Boton variante="peligro">Marcar visita fallida</Boton>
          <Boton variante="fantasma">Cancelar</Boton>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip activo>Todos</Chip>
          <Chip>Vencidos</Chip>
          <Chip>Vencen pronto</Chip>
          <Chip>Sin datos</Chip>
        </div>
        <div className="flex flex-wrap gap-4">
          <MarcaEstado estado="vencido" />
          <MarcaEstado estado="pronto" />
          <MarcaEstado estado="al_dia" />
          <MarcaEstado estado="sin_datos" />
        </div>
        <Vacio accion={<Boton variante="secundario">Armar visita</Boton>}>
          No hay nada vencido en este local. El próximo control es la limpieza de la campana, el 2 de diciembre.
        </Vacio>
      </section>
    </>
  );
}
