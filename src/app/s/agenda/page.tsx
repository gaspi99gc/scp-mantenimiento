// Agenda: todos los controles con su vencimiento, del más urgente al más lejano. Es la pantalla de inicio.

import { Agenda, type FiltroAgenda } from "@/components/agenda/agenda";
import { datosAgenda } from "@/components/agenda/consultas";
import { cantidad } from "@/components/agenda/texto";
import { Boton, Encabezado } from "@/components/ui";
import { hoy } from "@/lib/fechas";

export const metadata = { title: "Agenda" };

const FILTROS: FiltroAgenda[] = ["todos", "vencido", "pronto", "sin_datos", "al_dia"];

function BotonExcel({ ancho }: { ancho?: boolean }) {
  // TODO(supabase): exportar a Excel la agenda con los filtros aplicados.
  return (
    <Boton type="button" variante="secundario" ancho={ancho}>
      Descargar Excel
    </Boton>
  );
}

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { estado, q } = await searchParams;
  const filtro = FILTROS.find((f) => f === estado) ?? "todos";
  const { filas, locales } = datosAgenda(hoy());

  return (
    <>
      <Encabezado
        titulo="Agenda"
        bajada={`${cantidad(filas.length, "control", "controles")} en ${cantidad(locales, "local", "locales")}, del más urgente al más lejano.`}
        acciones={
          // En el celular el botón va al pie: descargar un Excel no es lo primero que se hace en la vereda.
          <div className="hidden lg:block">
            <BotonExcel />
          </div>
        }
      />
      <Agenda filas={filas} filtroInicial={filtro} busquedaInicial={typeof q === "string" ? q : ""} />
      <div className="mt-2 lg:hidden">
        <BotonExcel ancho />
      </div>
    </>
  );
}
