// Inicio del cliente. Con un solo local, es directamente el estado de ese local.
// Con varios (una cadena), la lista de sus locales, del peor al mejor.

import { misLocales } from "@/components/cliente/consultas";
import { seccionDe, VistaLocal } from "@/components/cliente/vista-local";
import { Regla } from "@/components/locales/regla";
import { estadosDeLocal, fraseResumen, textoRegla } from "@/components/locales/consultas";
import { Encabezado, Fila, Planilla, Vacio } from "@/components/ui";
import { cargarDatosCliente } from "@/lib/datos";

export const metadata = { title: "Mis locales" };

export default async function InicioCliente({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  await cargarDatosCliente();
  const { ver } = await searchParams;
  const locales = misLocales();

  if (locales.length === 1) {
    return <VistaLocal local={locales[0].local} base="/c" seccion={seccionDe(ver)} />;
  }

  if (locales.length === 0) {
    return (
      <>
        <Encabezado titulo="Tus locales" />
        <Vacio>Todavía no tenés locales asignados. Pedile a SCP que te los habilite.</Vacio>
      </>
    );
  }

  const conVencidos = locales.filter((l) => l.resumen.vencidos > 0).length;
  return (
    <>
      <Encabezado
        titulo="Tus locales"
        bajada={
          conVencidos === 0
            ? `${locales.length} locales. Ninguno tiene controles vencidos.`
            : `${locales.length} locales. ${conVencidos === 1 ? "1 tiene" : `${conVencidos} tienen`} controles vencidos.`
        }
      />
      <Planilla>
        {locales.map(({ local, resumen }) => {
          const regla = textoRegla(resumen);
          return (
            <Fila
              key={local.id}
              href={`/c/locales/${local.id}`}
              estado={resumen.peor}
              titulo={local.nombre}
              detalle={`${local.barrio}, ${local.direccion}`}
              derecha={
                <span className="text-right">
                  <span className={resumen.vencidos ? "block font-semibold text-rojo" : "block font-semibold"}>
                    {regla.principal}
                  </span>
                  <span className="block text-sm text-cemento">{regla.secundario}</span>
                </span>
              }
              debajo={<Regla estados={estadosDeLocal(local.id)} etiqueta={fraseResumen(resumen)} className="max-w-xs" />}
            />
          );
        })}
      </Planilla>
    </>
  );
}
