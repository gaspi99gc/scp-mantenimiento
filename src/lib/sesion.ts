// Quién está usando la app. Cada layout y cada acción protegida llama a una de las funciones exigir*;
// el proxy solo redirige por comodidad. El perfil (rol, activo) se lee de la base en cada pedido,
// así desactivar a alguien rige en el momento.

import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { clienteServidor } from "./supabase/servidor";
import type { Database } from "./supabase/tipos-db";

export type Rol = Database["public"]["Enums"]["rol_usuario"];

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  debeCambiarClave: boolean;
}

export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: p } = await supabase
    .from("perfil")
    .select("id, nombre, email, rol, activo, debe_cambiar_clave")
    .eq("id", id)
    .maybeSingle();
  if (!p) return null;
  return { id: p.id, nombre: p.nombre, email: p.email, rol: p.rol, activo: p.activo, debeCambiarClave: p.debe_cambiar_clave };
});

/** Hay sesión y el usuario está activo (puede que todavía tenga que elegir su contraseña). */
export async function exigirSesion(): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u || !u.activo) redirect("/login");
  return u;
}

/** Admin o supervisor activo que ya eligió su contraseña. */
export async function exigirStaff(): Promise<Usuario> {
  const u = await exigirSesion();
  if (u.debeCambiarClave) redirect("/cuenta/clave");
  return u;
}

/** Solo el admin. A los demás la página directamente no existe. */
export async function exigirAdmin(): Promise<Usuario> {
  const u = await exigirStaff();
  if (u.rol !== "admin") notFound();
  return u;
}

/** Adónde volver después de entrar: solo rutas propias de la app, nunca otra web. */
export function destinoSeguro(siguiente: unknown): string {
  if (typeof siguiente !== "string") return "/s";
  if (!/^\/(s|e)(\/|$|\?)/.test(siguiente) || siguiente.startsWith("//")) return "/s";
  return siguiente;
}

export const ROL_TEXTO: Record<Rol, string> = { admin: "Admin", supervisor: "Supervisor" };
