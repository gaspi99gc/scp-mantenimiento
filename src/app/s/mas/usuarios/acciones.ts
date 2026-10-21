"use server";

// Gestión de usuarios: solo el admin. Cada acción vuelve a verificar el rol en el servidor
// antes de usar la clave secreta (que saltea las reglas de la base).

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoUsuarios = { error?: string; ok?: string };

const REGLA = "La contraseña necesita al menos 10 caracteres, con letras y números.";
const Clave = z.string().min(10, REGLA).max(72, REGLA).regex(/[a-zA-ZñÑ]/, REGLA).regex(/\d/, REGLA);
const Id = z.string().uuid();

const Nuevo = z.object({
  nombre: z.string().trim().min(2, "Escribí el nombre y el apellido.").max(120),
  email: z.string().trim().toLowerCase().email("A ese email le falta algo. Ej.: nombre@scp.com.ar"),
  rol: z.enum(["admin", "supervisor"]),
  clave: Clave,
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^([a-z0-9._-]{3,30})?$/, "El usuario va en minúsculas, sin espacios, de 3 a 30 caracteres.")
    .optional(),
});

// Bloqueo en Auth para que un usuario desactivado no pueda renovar su sesión (100 años).
const BLOQUEO = "876000h";
const ERROR_GENERICO = "No se pudo guardar el cambio. Probá de nuevo.";

export async function crearUsuario(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  await exigirAdmin();
  const leidos = Nuevo.safeParse(Object.fromEntries(datos));
  if (!leidos.success) return { error: leidos.error.issues[0].message };
  const { nombre, email, rol, clave } = leidos.data;
  const usuario = leidos.data.usuario || null;

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
    .insert({ id: data.user.id, nombre, email, usuario, rol });
  if (errorPerfil) {
    // Sin perfil el usuario no sirve: se deshace el alta en Auth.
    await admin.auth.admin.deleteUser(data.user.id);
    return {
      error:
        errorPerfil.code === "23505" && usuario
          ? "Ese usuario ya lo tiene otra persona."
          : "No se pudo crear el usuario. Probá de nuevo en un rato.",
    };
  }

  revalidatePath("/s/mas/usuarios");
  return {
    ok: `Listo. Pasale a ${nombre.split(" ")[0]} ${usuario ? `su usuario (${usuario})` : "su email"} y la contraseña para entrar.`,
  };
}

export async function cambiarActivo(id: string, activo: boolean): Promise<EstadoUsuarios> {
  const yo = await exigirAdmin();
  if (!Id.safeParse(id).success || !z.boolean().safeParse(activo).success) return { error: "Datos inválidos." };
  if (id === yo.id) return { error: "No podés desactivarte a vos mismo." };

  const admin = clienteAdmin();
  if (activo) {
    const { error } = await admin.from("perfil").update({ activo: true }).eq("id", id);
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
      ? "Usuario reactivado. Entra con su usuario y la contraseña que tenía (o ponele una nueva)."
      : "Usuario desactivado. Ya no puede entrar ni ver datos.",
  };
}

export async function ponerClave(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  const yo = await exigirAdmin();
  const id = Id.safeParse(datos.get("id"));
  const clave = Clave.safeParse(datos.get("clave"));
  if (!id.success) return { error: "Usuario inválido." };
  if (!clave.success) return { error: clave.error.issues[0].message };
  if (id.data === yo.id) return { error: "Tu propia contraseña no se cambia desde acá." };

  const admin = clienteAdmin();
  // Contraseña nueva y se cierran sus sesiones abiertas: entra de nuevo con la nueva.
  const { error } = await admin.auth.admin.updateUserById(id.data, { password: clave.data });
  if (error) return { error: "No se pudo poner la contraseña. Probá de nuevo." };
  const { error: errorSesiones } = await admin.rpc("cerrar_sesiones", { p_usuario: id.data });
  if (errorSesiones) return { error: "La contraseña quedó puesta, pero no se pudieron cerrar sus sesiones. Probá de nuevo." };

  revalidatePath("/s/mas/usuarios");
  return { ok: "Contraseña cambiada. Se cerraron sus sesiones: entra de nuevo con la nueva." };
}

const ReglaUsuario = "El usuario va en minúsculas, sin espacios, de 3 a 30 caracteres (letras, números, punto o guion).";
const NombreUsuario = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, ReglaUsuario);
const ReglaNueva = "La contraseña nueva necesita al menos 10 caracteres, con letras y números.";
const ClaveNueva = z.string().min(10, ReglaNueva).max(72, ReglaNueva).regex(/[a-zA-ZñÑ]/, ReglaNueva).regex(/\d/, ReglaNueva);

/**
 * El admin cambia su propio usuario y, si quiere, su contraseña. Para cualquier cambio pide la contraseña
 * actual. Si cambia la contraseña, se cierran todas sus sesiones y vuelve a entrar con la nueva.
 */
export async function cambiarMisDatos(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  const yo = await exigirAdmin();
  const usuario = NombreUsuario.safeParse(datos.get("usuario"));
  if (!usuario.success) return { error: usuario.error.issues[0].message };
  const actual = String(datos.get("actual") ?? "");
  if (!actual) return { error: "Escribí tu contraseña actual." };
  const nuevaTexto = String(datos.get("nueva") ?? "");
  const nueva = nuevaTexto ? ClaveNueva.safeParse(nuevaTexto) : undefined;
  if (nueva && !nueva.success) return { error: nueva.error.issues[0].message };
  if (nueva && nuevaTexto !== datos.get("repetida")) return { error: "Las dos contraseñas nuevas no son iguales." };

  // Verificar la contraseña actual con un cliente aparte (no toca la sesión del navegador) y cerrar esa prueba.
  const prueba = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: errorActual } = await prueba.auth.signInWithPassword({ email: yo.email, password: actual });
  if (errorActual) return { error: "Tu contraseña actual no coincide." };
  await prueba.auth.signOut();

  const admin = clienteAdmin();
  if (usuario.data !== yo.usuario) {
    const { error } = await admin.from("perfil").update({ usuario: usuario.data }).eq("id", yo.id);
    if (error) return { error: error.code === "23505" ? "Ese usuario ya lo tiene otra persona." : ERROR_GENERICO };
  }

  if (nueva?.success) {
    const { error } = await admin.auth.admin.updateUserById(yo.id, { password: nueva.data });
    if (error) return { error: "No se pudo cambiar la contraseña. Probá de nuevo." };
    await admin.rpc("cerrar_sesiones", { p_usuario: yo.id });
    const sesion = await clienteServidor();
    await sesion.auth.signOut({ scope: "local" });
    redirect("/login?cambio=1");
  }

  revalidatePath("/s/mas/usuarios");
  return { ok: `Listo. Tu usuario para entrar es "${usuario.data}".` };
}
