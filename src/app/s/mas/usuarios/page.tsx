// Más → Usuarios: solo el admin. Alta de supervisores, admins y usuarios de cliente con su contraseña,
// desactivar y reactivar, y cambiarles la contraseña. El admin maneja todas las contraseñas.

import type { Metadata } from "next";
import { FilaUsuario, NuevoUsuario, type DatosUsuario, type OpcionCliente } from "@/components/cuenta/usuarios";
import { CLASE_PLANILLA, Encabezado, TituloPlanilla } from "@/components/ui";
import { exigirAdmin, ROL_TEXTO } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Usuarios" };

export default async function Usuarios() {
  const yo = await exigirAdmin();
  const supabase = await clienteServidor();
  const [{ data: perfiles, error }, { data: membresias }, { data: clientes }, { data: locales }] = await Promise.all([
    supabase.from("perfil").select("id, nombre, email, usuario, rol, activo").order("activo", { ascending: false }).order("nombre"),
    supabase.from("membresia").select("perfil_id, cliente_id, local_id"),
    supabase.from("cliente").select("id, nombre").order("nombre"),
    supabase.from("local").select("id, nombre, cliente_id").order("nombre"),
  ]);

  const nombreCliente = new Map((clientes ?? []).map((c) => [c.id, c.nombre]));
  const nombreLocal = new Map((locales ?? []).map((l) => [l.id, l.nombre]));
  /** Qué ve un usuario de cliente, en palabras: "La Espiga Caballito" o "todos los locales de La Espiga". */
  function queVe(perfilId: string): string | undefined {
    const propias = (membresias ?? []).filter((m) => m.perfil_id === perfilId);
    if (propias.length === 0) return "ningún local todavía";
    return propias
      .map((m) => (m.local_id ? nombreLocal.get(m.local_id) : `todos los locales de ${nombreCliente.get(m.cliente_id)}`))
      .join(", ");
  }

  const usuarios: DatosUsuario[] = (perfiles ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    usuario: p.usuario ?? undefined,
    rol: ROL_TEXTO[p.rol],
    ve: p.rol === "cliente" ? queVe(p.id) : undefined,
    activo: p.activo,
    soyYo: p.id === yo.id,
  }));
  const opcionesCliente: OpcionCliente[] = (clientes ?? [])
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      locales: (locales ?? []).filter((l) => l.cliente_id === c.id).map((l) => ({ id: l.id, nombre: l.nombre })),
    }))
    .filter((c) => c.locales.length > 0);
  const activos = usuarios.filter((u) => u.activo).length;

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas", texto: "Más" }}
        titulo="Usuarios"
        bajada={`${activos === 1 ? "1 usuario activo" : `${activos} usuarios activos`}. Solo el admin ve esta pantalla.`}
      />

      <section className="mb-8" aria-labelledby="agregar">
        <TituloPlanilla id="agregar" titulo="Agregar usuario" />
        <div className={CLASE_PLANILLA}>
          <NuevoUsuario clientes={opcionesCliente} />
        </div>
      </section>

      <section className="mb-8" aria-labelledby="lista">
        <TituloPlanilla id="lista" titulo="Todos los usuarios" />
        {error ? (
          <p role="alert" className="font-medium text-rojo">
            No se pudo cargar la lista. Recargá la página.
          </p>
        ) : (
          <ul className={CLASE_PLANILLA}>
            {usuarios.map((u) => (
              <FilaUsuario key={u.id} usuario={u} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
