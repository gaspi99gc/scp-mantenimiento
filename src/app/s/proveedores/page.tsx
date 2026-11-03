// Proveedores: recargadoras, fumigadoras, matriculados y demás terceros que hacen controles.
// Por ahora es el lugar reservado en la navegación; qué datos guarda se define cuando se arme.

import type { Metadata } from "next";
import { Encabezado, Vacio } from "@/components/ui";

export const metadata: Metadata = { title: "Proveedores" };

export default function Proveedores() {
  return (
    <>
      <Encabezado titulo="Proveedores" bajada="Recargadoras, fumigadoras, matriculados y los demás que hacen controles." />
      <Vacio>
        Próximamente: la lista de proveedores con sus datos de contacto y sus habilitaciones, para elegirlos al registrar
        un control.
      </Vacio>
    </>
  );
}
