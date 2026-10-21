// Locales: todos los locales de todos los clientes, agrupados por cliente, del peor estado al mejor.

import { BuscadorLocales, type GrupoCliente } from "@/components/locales/buscador-locales";
import {
  compararResumen,
  estadosDeLocal,
  fraseResumen,
  peorDe,
  textoRegla,
  type Resumen,
} from "@/components/locales/consultas";
import type { DatosFilaLocal } from "@/components/locales/fila-local";
import { IconoSumar } from "@/components/iconos";
import { BotonLink, Encabezado } from "@/components/ui";
import { cargarDatos, resumenLocal } from "@/lib/datos";

export const metadata = { title: "Locales" };

const porNombre = (a: { nombre: string }, b: { nombre: string }) => a.nombre.localeCompare(b.nombre, "es");

export default async function Locales() {
  const { clientes, locales } = await cargarDatos();
  const filas = locales.map((l) => {
    const cliente = clientes.find((c) => c.id === l.clienteId)!;
    const resumen = resumenLocal(l.id);
    const estados = estadosDeLocal(l.id);
    const fila: DatosFilaLocal = {
      id: l.id,
      nombre: l.nombre,
      barrio: l.barrio,
      direccion: l.direccion,
      cliente: cliente.nombre,
      razonSocial: cliente.razonSocial,
      estados,
      peor: peorDe(estados),
      texto: textoRegla(resumen),
      frase: fraseResumen(resumen),
    };
    return { ...fila, clienteId: l.clienteId, resumen };
  });

  // Dentro de cada cliente, el peor local primero; los clientes, según su peor local.
  const grupos = clientes
    .map((c) => {
      const propias = filas
        .filter((f) => f.clienteId === c.id)
        .sort((a, b) => compararResumen(a.resumen, b.resumen) || porNombre(a, b));
      return { cliente: c, propias, peor: propias[0]?.resumen as Resumen | undefined };
    })
    .filter((g) => g.peor)
    .sort((a, b) => compararResumen(a.peor!, b.peor!) || porNombre(a.cliente, b.cliente))
    .map<GrupoCliente>(({ cliente, propias }) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      razonSocial: cliente.razonSocial,
      locales: propias.map(({ clienteId: _c, resumen: _r, ...fila }) => fila),
    }));

  const conVencidos = filas.filter((f) => f.resumen.vencidos > 0).length;

  return (
    <>
      <Encabezado
        titulo="Locales"
        bajada={
          <>
            {locales.length} locales de {grupos.length} clientes.
            {conVencidos > 0 && ` ${conVencidos === 1 ? "Uno tiene" : `${conVencidos} tienen`} controles vencidos.`}
          </>
        }
        acciones={
          <BotonLink href="/s/locales/nuevo" variante="secundario" className="px-3">
            <IconoSumar tamano={20} />
            Agregar<span className="sr-only sm:not-sr-only"> local</span>
          </BotonLink>
        }
      />

      <BuscadorLocales grupos={grupos} />
    </>
  );
}
