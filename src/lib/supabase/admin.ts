// Cliente con la clave secreta: saltea las reglas de la base. Solo para lo que el admin hace sobre
// usuarios (crear, desactivar, poner contraseña) y siempre después de verificar que quien pide es admin.
// "server-only" hace fallar el build si alguien lo importa desde un componente del navegador.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./tipos-db";

export function clienteAdmin() {
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!clave) throw new Error("Falta SUPABASE_SECRET_KEY en las variables de entorno.");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
