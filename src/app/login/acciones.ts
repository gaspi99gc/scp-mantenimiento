"use server";

// Entrar y salir, con el usuario ("admin") o con el email. Los mensajes de error nunca dicen si una cuenta existe.

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { destinoSeguro, type Rol } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoLogin = { error?: string; usuario?: string };

const ERROR_CREDENCIALES = "El usuario o la contraseña no coinciden.";

const Credenciales = z.object({
  usuario: z.string().trim().toLowerCase().min(1).max(254),
  clave: z.string().min(1).max(200),
});

/** El email con el que Supabase Auth conoce a esa persona: el que escribió, o el de su nombre de usuario. */
async function emailDe(usuario: string): Promise<string | undefined> {
  if (usuario.includes("@")) return usuario;
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return undefined;
  // Nadie sin sesión puede leer perfiles: la búsqueda la hace el servidor y solo devuelve el email.
  const { data } = await clienteAdmin().from("perfil").select("email").eq("usuario", usuario).maybeSingle();
  return data?.email;
}

/** Abre la sesión. Devuelve el rol si entró, o el texto del error. */
async function entrarCon(email: string, clave: string): Promise<{ rol: Rol } | { error: string }> {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: clave });
  if (error || !data.user) return { error: ERROR_CREDENCIALES };

  // Con la sesión recién abierta, la base ya deja leer el propio perfil.
  const { data: perfil } = await supabase.from("perfil").select("activo, rol").eq("id", data.user.id).maybeSingle();
  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return { error: perfil ? "Tu usuario está desactivado. Hablá con SCP." : ERROR_CREDENCIALES };
  }
  return { rol: perfil.rol };
}

export async function iniciarSesion(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const usuario = String(datos.get("usuario") ?? "");
  const leidos = Credenciales.safeParse({ usuario, clave: datos.get("clave") });
  if (!leidos.success) return { error: ERROR_CREDENCIALES, usuario };

  const email = await emailDe(leidos.data.usuario);
  const resultado = email ? await entrarCon(email, leidos.data.clave) : { error: ERROR_CREDENCIALES };
  if ("error" in resultado) return { error: resultado.error, usuario };
  redirect(destinoSeguro(datos.get("siguiente"), resultado.rol));
}

/** Botón de ingreso rápido: solo corriendo la app en la compu (npm run dev) y abierta desde esa misma compu. */
export async function entrarComoAdminDev(): Promise<EstadoLogin> {
  const email = process.env.DEV_ADMIN_EMAIL;
  const clave = process.env.DEV_ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "development" || !email || !clave || !(await desdeEstaCompu())) notFound();

  const resultado = await entrarCon(email, clave);
  if ("error" in resultado) {
    return { error: `${resultado.error} Revisá DEV_ADMIN_EMAIL y DEV_ADMIN_PASSWORD en .env.local y corré npm run crear-admin.` };
  }
  redirect("/s");
}

/** Que el pedido venga de localhost: alguien en la misma Wi-Fi que abre la IP de la compu no puede usarlo. */
async function desdeEstaCompu(): Promise<boolean> {
  const host = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export async function cerrarSesion() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
