"use server";

// Elegir la contraseña propia: obligatorio en el primer ingreso y después de que el admin pone una provisoria.

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirSesion } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoClave = { error?: string };

const REGLA_CLAVE = "Al menos 10 caracteres, con letras y números.";

const Clave = z
  .string()
  .min(10, REGLA_CLAVE)
  .regex(/[a-zA-ZñÑ]/, REGLA_CLAVE)
  .regex(/\d/, REGLA_CLAVE);

export async function elegirClave(_previo: EstadoClave, datos: FormData): Promise<EstadoClave> {
  await exigirSesion();
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
          : "No se pudo guardar la contraseña. Probá de nuevo en un rato.",
    };
  }
  const { error: errorPerfil } = await supabase.rpc("marcar_clave_cambiada");
  if (errorPerfil) return { error: "La contraseña se guardó, pero falló un paso. Volvé a entrar." };
  redirect("/s");
}
