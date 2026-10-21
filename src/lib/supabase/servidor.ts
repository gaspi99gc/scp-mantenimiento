// Cliente de Supabase para el servidor (Server Components, Server Actions y Route Handlers).
// Usa la sesión de quien navega, guardada en cookies: todo lo que lee pasa por las reglas de la base (RLS).
// Se crea uno nuevo por pedido; no se comparte entre pedidos.

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OPCIONES_COOKIE } from "./cookies";
import type { Database } from "./tipos-db";

export async function clienteServidor() {
  const almacen = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: OPCIONES_COOKIE,
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(lista) {
          try {
            for (const { name, value, options } of lista) almacen.set(name, value, options);
          } catch {
            // Desde un Server Component no se pueden escribir cookies: la sesión la renueva proxy.ts.
          }
        },
      },
    },
  );
}
