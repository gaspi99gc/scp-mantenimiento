"use server";

// Entrar y salir. Los mensajes de error nunca dicen si un email tiene cuenta.

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { destinoSeguro } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoLogin = { error?: string; email?: string };

const ERROR_CREDENCIALES = "El email o la contraseña no coinciden.";

const Credenciales = z.object({
  email: z.string().trim().toLowerCase().email(),
  clave: z.string().min(1),
});

async function entrarCon(email: string, clave: string): Promise<string | undefined> {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: clave });
  if (error || !data.user) return ERROR_CREDENCIALES;

  // Con la sesión recién abierta, la base ya deja leer el propio perfil.
  const { data: perfil } = await supabase.from("perfil").select("activo").eq("id", data.user.id).maybeSingle();
  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return perfil ? "Tu usuario está desactivado. Hablá con el admin." : ERROR_CREDENCIALES;
  }
}

export async function iniciarSesion(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const email = String(datos.get("email") ?? "");
  const leidos = Credenciales.safeParse({ email, clave: datos.get("clave") });
  if (!leidos.success) return { error: ERROR_CREDENCIALES, email };

  const error = await entrarCon(leidos.data.email, leidos.data.clave);
  if (error) return { error, email };
  redirect(destinoSeguro(datos.get("siguiente")));
}

/** Botón de ingreso rápido: solo corriendo la app en la compu (npm run dev) y abierta desde esa misma compu. */
export async function entrarComoAdminDev(): Promise<EstadoLogin> {
  const email = process.env.DEV_ADMIN_EMAIL;
  const clave = process.env.DEV_ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "development" || !email || !clave || !(await desdeEstaCompu())) notFound();

  const error = await entrarCon(email, clave);
  if (error) return { error: `${error} Revisá DEV_ADMIN_EMAIL y DEV_ADMIN_PASSWORD en .env.local y corré npm run crear-admin.` };
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
