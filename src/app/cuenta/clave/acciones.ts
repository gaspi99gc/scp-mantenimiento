"use server";

// Elegir la contraseña propia: obligatorio en el primer ingreso y después de que el admin pone una provisoria.
// Solo sirve en ese caso (con la provisoria); cambiar una contraseña ya elegida pedirá la actual.

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirSesion } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoClave = { error?: string };

const REGLA_CLAVE = "Al menos 10 caracteres, con letras y números.";

const Clave = z
  .string()
  .min(10, REGLA_CLAVE)
  .max(72, "Como mucho 72 caracteres.")
  .regex(/[a-zA-ZñÑ]/, REGLA_CLAVE)
  .regex(/\d/, REGLA_CLAVE);

export async function elegirClave(_previo: EstadoClave, datos: FormData): Promise<EstadoClave> {
  const usuario = await exigirSesion();
  if (!usuario.debeCambiarClave) redirect("/s");

  const clave = Clave.safeParse(datos.get("clave"));
  if (!clave.success) return { error: clave.error.issues[0].message };
  if (clave.data !== datos.get("repetida")) return { error: "Las dos contraseñas no son iguales." };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.updateUser({ password: clave.data });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Tiene que ser distinta de la provisoria."
          : "No se pudo guardar la contraseña. Volvé a entrar y probá de nuevo.",
    };
  }

  // Recién con el cambio confirmado por Supabase Auth se baja la marca. Lo hace el servidor:
  // el usuario no tiene forma de bajarla por su cuenta.
  const { error: errorPerfil } = await clienteAdmin()
    .from("perfil")
    .update({ debe_cambiar_clave: false })
    .eq("id", usuario.id);
  if (errorPerfil) return { error: "La contraseña se guardó, pero falló un paso. Volvé a entrar." };
  redirect("/s");
}
