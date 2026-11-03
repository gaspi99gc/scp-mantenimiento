"use server";

// Crear un usuario para un cliente ya cargado: solo el admin. Entra con usuario y contraseña (el email es opcional)
// y ve, solo para leer, los locales que se eligen: todos (también los que se agreguen después) o algunos.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EstadoUsuarios } from "@/app/s/mas/usuarios/acciones";
import { emailInterno } from "@/lib/email-interno";
import { exigirAdmin } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";

const REGLA_CLAVE = "La contraseña necesita al menos 10 caracteres, con letras y números.";

const Nuevo = z.object({
  clienteId: z.string().uuid(),
  nombre: z.string().trim().min(2, "Escribí un nombre. Para probar puede ser el del local.").max(120),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "El usuario va en minúsculas, sin espacios, de 3 a 30 caracteres (letras, números, punto o guion)."),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("A ese email le falta algo. Si no tiene, dejalo vacío.")]),
  clave: z.string().min(10, REGLA_CLAVE).max(72, REGLA_CLAVE).regex(/[a-zA-ZñÑ]/, REGLA_CLAVE).regex(/\d/, REGLA_CLAVE),
  todos: z.boolean(),
  locales: z.array(z.string().uuid()),
});

export async function crearUsuarioCliente(_previo: EstadoUsuarios, datos: FormData): Promise<EstadoUsuarios> {
  await exigirAdmin();
  const leidos = Nuevo.safeParse({
    clienteId: datos.get("clienteId"),
    nombre: datos.get("nombre") ?? "",
    usuario: datos.get("usuario") ?? "",
    email: datos.get("email") ?? "",
    clave: datos.get("clave") ?? "",
    todos: datos.get("todos") === "si",
    locales: datos.getAll("local"),
  });
  if (!leidos.success) return { error: leidos.error.issues[0].message };
  const { clienteId, nombre, usuario, email, clave, todos, locales } = leidos.data;

  const admin = clienteAdmin();

  // Los locales elegidos tienen que ser de este cliente.
  const { data: delCliente } = await admin.from("local").select("id").eq("cliente_id", clienteId);
  if (!delCliente) return { error: "Ese cliente ya no existe. Recargá la página." };
  const propios = new Set(delCliente.map((l) => l.id));
  if (!todos && locales.length === 0) return { error: "Elegí al menos un local." };
  if (!todos && locales.some((id) => !propios.has(id))) return { error: "Algún local ya no es de este cliente. Recargá la página." };

  const { data: ocupado } = await admin.from("perfil").select("id").eq("usuario", usuario).maybeSingle();
  if (ocupado) return { error: "Ese usuario ya lo tiene otra persona." };

  const { data, error } = await admin.auth.admin.createUser({
    email: email || emailInterno(usuario),
    password: clave,
    email_confirm: true,
  });
  if (error || !data.user) {
    return {
      error: error?.code === "email_exists" ? "Ya hay un usuario con ese email." : "No se pudo crear el usuario. Probá de nuevo en un rato.",
    };
  }

  const deshacer = async () => {
    await admin.from("membresia").delete().eq("perfil_id", data.user.id);
    await admin.from("perfil").delete().eq("id", data.user.id);
    await admin.auth.admin.deleteUser(data.user.id);
  };

  const { error: errorPerfil } = await admin
    .from("perfil")
    .insert({ id: data.user.id, nombre, email: data.user.email!, usuario, rol: "cliente" });
  if (errorPerfil) {
    await deshacer();
    return { error: "No se pudo crear el usuario. Probá de nuevo en un rato." };
  }

  // Todos: una sola membresía sin local, así ve también los locales que se agreguen después.
  const filas: { perfil_id: string; cliente_id: string; local_id: string | null }[] = todos
    ? [{ perfil_id: data.user.id, cliente_id: clienteId, local_id: null }]
    : locales.map((local_id) => ({ perfil_id: data.user.id, cliente_id: clienteId, local_id }));
  const { error: errorMembresia } = await admin.from("membresia").insert(filas);
  if (errorMembresia) {
    await deshacer();
    return { error: "No se pudo crear el usuario. Probá de nuevo en un rato." };
  }

  revalidatePath(`/s/clientes/${clienteId}`);
  return { ok: `Listo. Para entrar: usuario ${usuario} y la contraseña que pusiste.` };
}
