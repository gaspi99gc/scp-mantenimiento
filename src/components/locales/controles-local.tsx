"use client";

// Planilla de controles del local, del peor estado al mejor.
// Los controles de un elemento llevan a su ficha (ahí se registran, D3).
// Los controles del local (plagas, puesta a tierra…) no tienen ficha propia: se registran desde acá.

import { useState } from "react";
import { IconoCheck } from "@/components/iconos";
import { RegistrarEjecucion, type Registro } from "@/components/registrar-ejecucion";
import { Tarjeta } from "@/components/tarjeta";
import { Boton, Cinta, FechaFila, Fila, Planilla } from "@/components/ui";
import { diasEntre, estadoDe, fechaCorta, hoy, textoRelativo } from "@/lib/fechas";
import type { Control, Elemento, TipoControl } from "@/lib/tipos";

export interface ItemControl {
  control: Control;
  tipo: TipoControl;
  elemento?: Elemento;
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function Fecha({ control, tipo }: { control: Control; tipo: TipoControl }) {
  if (!control.vencimiento) {
    return <span className="max-w-[7rem] text-right text-sm leading-tight text-cemento sm:max-w-none">Falta cargar la fecha</span>;
  }
  const estado = estadoDe(control, tipo);
  // A más de diez meses, "10/03" no alcanza: se dice el año.
  const lejos = diasEntre(hoy(), control.vencimiento) > 300;
  return (
    <FechaFila
      fecha={lejos ? control.vencimiento.slice(5, 7) + "/" + control.vencimiento.slice(0, 4) : fechaCorta(control.vencimiento)}
      relativo={textoRelativo(control.vencimiento)}
      tono={estado === "vencido" ? "rojo" : "normal"}
    />
  );
}

export function ControlesLocal({ items }: { items: ItemControl[] }) {
  // Estado local mientras no haya base: el control actualizado y lo que se registró.
  const [actualizados, setActualizados] = useState<Record<string, Control>>({});
  const [registros, setRegistros] = useState<Record<string, Registro>>({});
  const [elegido, setElegido] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);

  const actual = (c: Control) => actualizados[c.id] ?? c;
  const itemElegido = items.find((i) => i.control.id === elegido);

  function registrar(r: Registro) {
    const item = items.find((i) => i.control.id === r.controlId);
    if (!item) return;
    const antes = actual(item.control);
    // TODO(supabase): registrar_ejecucion() en una transacción (bloquea el control, cierra el vencimiento
    // abierto y crea el nuevo). Acá solo se refleja el resultado en pantalla.
    if (r.vencimientoNuevo) {
      setActualizados((a) => ({
        ...a,
        [r.controlId]: {
          ...antes,
          vencimiento: r.vencimientoNuevo,
          ultimaEjecucion: r.fecha,
          ultimoEjecutor: item.tipo.ejecutor === "SCP" ? "SCP" : antes.ultimoEjecutor,
        },
      }));
    }
    setRegistros((x) => ({ ...x, [r.controlId]: r }));
    setAbierta(false);
  }

  return (
    <>
      <Planilla>
        {items.map(({ control, tipo, elemento }) => {
          const c = actual(control);
          const estado = estadoDe(c, tipo);
          const detalle = elemento
            ? `${elemento.tipo}, ${minuscula(elemento.ubicacion)}`
            : `Control del local${c.ultimoEjecutor ? `, lo hace ${c.ultimoEjecutor}` : ""}`;

          if (elemento) {
            return (
              <Fila
                key={control.id}
                href={`/s/elementos/${elemento.id}`}
                estado={estado}
                titulo={tipo.nombre}
                detalle={detalle}
                derecha={<Fecha control={c} tipo={tipo} />}
              />
            );
          }

          const registro = registros[control.id];
          return (
            <li key={control.id}>
              <div className="flex min-h-14 items-stretch">
                <Cinta estado={estado} />
                <div className="min-w-0 flex-1 py-3 pl-3.5 pr-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold leading-snug">{tipo.nombre}</div>
                      <div className="mt-0.5 text-sm text-cemento">{detalle}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center text-right">
                      <Fecha control={c} tipo={tipo} />
                    </div>
                  </div>

                  {registro ? (
                    <div role="status" className="mt-3">
                      <p className="mb-3 flex items-center gap-1.5 font-semibold text-verde">
                        <IconoCheck tamano={20} />
                        {registro.vencimientoNuevo ? tipo.hecho : "Quedó anotado que no se pudo hacer"}
                      </p>
                      <Tarjeta
                        control={c}
                        tipo={tipo}
                        estado={estado}
                        sellada={!!registro.vencimientoNuevo}
                      />
                    </div>
                  ) : (
                    <Boton
                      variante="secundario"
                      className="mt-3 w-full sm:w-auto"
                      onClick={() => {
                        setElegido(control.id);
                        setAbierta(true);
                      }}
                    >
                      {tipo.verbo}
                    </Boton>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </Planilla>

      {itemElegido && (
        <RegistrarEjecucion
          key={itemElegido.control.id}
          abierta={abierta}
          alCerrar={() => setAbierta(false)}
          alRegistrar={registrar}
          control={actual(itemElegido.control)}
          tipo={itemElegido.tipo}
          elemento={itemElegido.elemento}
        />
      )}
    </>
  );
}
