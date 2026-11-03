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
  usuario?: string;
  rol: Rol;
  activo: boolean;
}

export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: p } = await supabase
    .from("perfil")
    .select("id, nombre, email, usuario, rol, activo")
    .eq("id", id)
    .maybeSingle();
  if (!p) return null;
  return { id: p.id, nombre: p.nombre, email: p.email, usuario: p.usuario ?? undefined, rol: p.rol, activo: p.activo };
});

/** Hay sesión y el usuario está activo. */
export async function exigirSesion(): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u || !u.activo) redirect("/login");
  return u;
}

/** Admin o supervisor activo. Un usuario de cliente que cae acá va a su propia app. */
export async function exigirStaff(): Promise<Usuario> {
  const u = await exigirSesion();
  if (u.rol === "cliente") redirect("/c");
  if (u.rol !== "admin" && u.rol !== "supervisor") notFound();
  return u;
}

/** Usuario de cliente activo. El staff que cae acá va a la app del supervisor. */
export async function exigirCliente(): Promise<Usuario> {
  const u = await exigirSesion();
  if (u.rol !== "cliente") redirect("/s");
  return u;
}

/** La pantalla de inicio de cada rol. */
export const inicioDe = (rol: Rol) => (rol === "cliente" ? "/c" : "/s");

/** Solo el admin. A los demás la página directamente no existe. */
export async function exigirAdmin(): Promise<Usuario> {
  const u = await exigirStaff();
  if (u.rol !== "admin") notFound();
  return u;
}

/**
 * Adónde volver después de entrar: solo rutas propias de la app, nunca otra web, y solo las del rol
 * (al cliente que venía de una pantalla del supervisor se lo lleva a su inicio, y al revés).
 * El QR (/e/…) sirve para los dos: decide él adónde llevar.
 */
export function destinoSeguro(siguiente: unknown, rol?: Rol): string {
  const inicio = rol ? inicioDe(rol) : "/s";
  if (typeof siguiente !== "string") return inicio;
  if (!/^\/(s|c|e)(\/|$|\?)/.test(siguiente) || siguiente.startsWith("//")) return inicio;
  if (rol && /^\/(s|c)(\/|$|\?)/.test(siguiente) && !siguiente.startsWith(inicio)) return inicio;
  return siguiente;
}

export const ROL_TEXTO: Record<Rol, string> = { admin: "Admin", supervisor: "Supervisor", cliente: "Cliente" };
