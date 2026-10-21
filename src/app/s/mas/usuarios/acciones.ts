"use server";

// Gestión de usuarios: solo el admin. Cada acción vuelve a verificar el rol en el servidor
// antes de usar la clave secreta (que saltea las reglas de la base).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";

export type EstadoUsuarios = { error?: string; ok?: string };

const REGLA = "La contraseña provisoria necesita al menos 10 caracteres, con letras y números.";
const ClaveProvisoria = z.string().min(10, REGLA).max(72, REGLA).regex(/[a-zA-ZñÑ]/, REGLA).regex(/\d/, REGLA);
const Id = z.string().uuid();

const Nuevo = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre y el apellido.").max(120),
  email: z.string().trim().toLowerCase().email("A ese email le falta algo. Ej.: nombre@scp.com.ar"),
  rol: z.enum(["admin", "supervisor"]),
  clave: ClaveProvisoria,
});

// Bloqueo en Auth para que un usuario desactivado no pueda renovar su sesión (100 años).
const BLOQUEO = "876000h";
const ERROR_GENERICO = "No se pudo guardar el cambio. Probá de nuevo.";

export async function crearUsuario(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  await exigirAdmin();
  const leidos = Nuevo.safeParse(Object.fromEntries(datos));
  if (!leidos.success) return { error: leidos.error.issues[0].message };
  const { nombre, email, rol, clave } = leidos.data;

  const admin = clienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true });
  if (error || !data.user) {
    return {
      error:
        error?.code === "email_exists"
          ? "Ya hay un usuario con ese email."
          : "No se pudo crear el usuario. Probá de nuevo en un rato.",
    };
  }

  const { error: errorPerfil } = await admin
    .from("perfil")
    .insert({ id: data.user.id, nombre, email, rol, debe_cambiar_clave: true });
  if (errorPerfil) {
    // Sin perfil el usuario no sirve: se deshace el alta en Auth.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo crear el usuario. Probá de nuevo en un rato." };
  }

  revalidatePath("/s/mas/usuarios");
  return {
    ok: `Listo. Pasale a ${nombre.split(" ")[0]} su email y la contraseña provisoria: al entrar, la app le pide que elija una nueva.`,
  };
}

export async function cambiarActivo(id: string, activo: boolean): Promise<EstadoUsuarios> {
  const yo = await exigirAdmin();
  if (!Id.safeParse(id).success || !z.boolean().safeParse(activo).success) return { error: "Datos inválidos." };
  if (id === yo.id) return { error: "No podés desactivarte a vos mismo." };

  const admin = clienteAdmin();
  if (activo) {
    // Al volver, tiene que elegir contraseña de nuevo; recién después se le levanta el bloqueo.
    const { error } = await admin.from("perfil").update({ activo: true, debe_cambiar_clave: true }).eq("id", id);
    if (error) return { error: ERROR_GENERICO };
    const { error: errorAuth } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
    if (errorAuth) return { error: ERROR_GENERICO };
  } else {
    // Primero la base lo deja afuera; después se bloquea en Auth y se cierran sus sesiones abiertas.
    const { error } = await admin.from("perfil").update({ activo: false }).eq("id", id);
    if (error) return { error: ERROR_GENERICO };
    const { error: errorAuth } = await admin.auth.admin.updateUserById(id, { ban_duration: BLOQUEO });
    const { error: errorSesiones } = await admin.rpc("cerrar_sesiones", { p_usuario: id });
    if (errorAuth || errorSesiones) {
      return { error: "Quedó sin acceso a los datos, pero no se pudo cerrar su sesión. Probá de nuevo." };
    }
  }

  revalidatePath("/s/mas/usuarios");
  return {
    ok: activo
      ? "Usuario reactivado. Al entrar va a tener que elegir una contraseña nueva."
      : "Usuario desactivado. Ya no puede entrar ni ver datos.",
  };
}

export async function ponerClaveProvisoria(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  const yo = await exigirAdmin();
  const id = Id.safeParse(datos.get("id"));
  const clave = ClaveProvisoria.safeParse(datos.get("clave"));
  if (!id.success) return { error: "Usuario inválido." };
  if (!clave.success) return { error: clave.error.issues[0].message };
  if (id.data === yo.id) return { error: "Tu propia contraseña no se cambia desde acá." };

  const admin = clienteAdmin();
  // Primero la marca (así no ve datos hasta elegir una propia), después la contraseña y por último
  // se cierran las sesiones abiertas: quien tuviera su sesión no puede quedarse con la cuenta.
  const { error: errorMarca } = await admin.from("perfil").update({ debe_cambiar_clave: true }).eq("id", id.data);
  if (errorMarca) return { error: ERROR_GENERICO };
  const { error } = await admin.auth.admin.updateUserById(id.data, { password: clave.data });
  if (error) return { error: "No se pudo poner la contraseña. Probá de nuevo." };
  const { error: errorSesiones } = await admin.rpc("cerrar_sesiones", { p_usuario: id.data });
  if (errorSesiones) return { error: "La contraseña quedó puesta, pero no se pudieron cerrar sus sesiones. Probá de nuevo." };

  revalidatePath("/s/mas/usuarios");
  return { ok: "Contraseña provisoria puesta. Al entrar con ella, le va a pedir que elija una nueva." };
}
