import type { Metadata } from "next";
import { FilaMenu } from "@/components/cuenta/fila-menu";
import {
  IconoCatalogo, IconoClientes, IconoMuestras, IconoProveedores, IconoSalir, IconoUsuarios,
} from "@/components/cuenta/iconos";
import { Encabezado, Planilla } from "@/components/ui";
import { supervisorActual } from "@/lib/datos";

export const metadata: Metadata = { title: "Más" };

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("");

export default function Mas() {
  // TODO(supabase): el usuario y su rol salen de la sesión (getClaims) y de la tabla `perfil`.
  const usuario = { ...supervisorActual, rol: "Supervisor" };

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
          <p className="text-lg font-[650] leading-tight">{usuario.nombre}</p>
          <p className="mt-0.5">{usuario.rol}</p>
          <p className="text-sm text-cemento">Ve y carga todos los locales.</p>
        </div>
      </section>

      <Planilla>
        <FilaMenu icono={<IconoClientes />} titulo="Clientes" detalle="Razón social, CUIT, locales y abono" proximamente />
        <FilaMenu icono={<IconoUsuarios />} titulo="Usuarios" detalle="Invitar y desactivar supervisores" proximamente />
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
        {/* TODO(supabase): supabase.auth.signOut() en una Server Action y después redirigir a /login. */}
        <FilaMenu href="/login" icono={<IconoSalir />} titulo="Cerrar sesión" />
      </Planilla>
    </>
  );
}
