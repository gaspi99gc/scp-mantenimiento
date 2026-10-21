import type { Metadata } from "next";
import { FilaMenu } from "@/components/cuenta/fila-menu";
import {
  IconoCatalogo, IconoClientes, IconoMuestras, IconoProveedores, IconoSalir, IconoUsuarios,
} from "@/components/cuenta/iconos";
import { cerrarSesion } from "@/app/login/acciones";
import { Encabezado, Planilla } from "@/components/ui";
import { exigirStaff, ROL_TEXTO } from "@/lib/sesion";

export const metadata: Metadata = { title: "Más" };

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("");

export default async function Mas() {
  const usuario = await exigirStaff();
  const esAdmin = usuario.rol === "admin";

  return (
    <>
      <Encabezado titulo="Más" />

      <section
        aria-label="Tu cuenta"
        className="mb-7 flex items-center gap-4 rounded-[var(--radius-planilla)] border border-junta bg-papel p-4"
      >
        <span
          aria-hidden
          className="cifra flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-tinta text-2xl text-papel"
        >
          {iniciales(usuario.nombre)}
        </span>
        <div className="min-w-0">
          <p className="rotulo text-xl">{usuario.nombre}</p>
          <p className="mt-0.5">{ROL_TEXTO[usuario.rol]}</p>
          <p className="text-sm text-cemento">
            {esAdmin ? "Ve y carga todo, y maneja usuarios y catálogo." : "Ve y carga todos los locales."}
          </p>
        </div>
      </section>

      <Planilla>
        <FilaMenu icono={<IconoClientes />} titulo="Clientes" detalle="Razón social, CUIT, locales y abono" proximamente />
        {esAdmin && (
          <FilaMenu
            href="/s/mas/usuarios"
            icono={<IconoUsuarios />}
            titulo="Usuarios"
            detalle="Crear supervisores, desactivarlos y ponerles contraseña"
          />
        )}
        <FilaMenu
          href="/s/mas/catalogo"
          icono={<IconoCatalogo />}
          titulo="Catálogo de controles"
          detalle="Período, aviso y norma de cada control"
        />
        <FilaMenu
          icono={<IconoProveedores />}
          titulo="Proveedores"
          detalle="Recargadoras, fumigadoras y matriculados"
          proximamente
        />
        <FilaMenu
          href="/s/muestras"
          icono={<IconoMuestras />}
          titulo="Muestras del sistema de diseño"
          detalle="Tarjetas, planillas y botones de referencia"
        />
      </Planilla>

      <Planilla>
        <FilaMenu accion={cerrarSesion} icono={<IconoSalir />} titulo="Cerrar sesión" />
      </Planilla>
    </>
  );
}
