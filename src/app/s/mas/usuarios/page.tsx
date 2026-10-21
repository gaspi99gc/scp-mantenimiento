// Más → Usuarios: solo el admin. Alta de supervisores y admins con contraseña provisoria,
// desactivar y reactivar, y poner una contraseña provisoria nueva.

import type { Metadata } from "next";
import { FilaUsuario, NuevoUsuario, type DatosUsuario } from "@/components/cuenta/usuarios";
import { CLASE_PLANILLA, Encabezado, TituloPlanilla } from "@/components/ui";
import { exigirAdmin, ROL_TEXTO } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Usuarios" };

export default async function Usuarios() {
  const yo = await exigirAdmin();
  const supabase = await clienteServidor();
  const { data: perfiles, error } = await supabase
    .from("perfil")
    .select("id, nombre, email, rol, activo, debe_cambiar_clave")
    .order("activo", { ascending: false })
    .order("nombre");

  const usuarios: DatosUsuario[] = (perfiles ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    rol: ROL_TEXTO[p.rol],
    activo: p.activo,
    debeCambiarClave: p.debe_cambiar_clave,
    soyYo: p.id === yo.id,
  }));
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
          <NuevoUsuario />
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
