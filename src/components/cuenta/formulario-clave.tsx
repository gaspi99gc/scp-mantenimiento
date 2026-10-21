"use client";

// Elegir la contraseña propia (primer ingreso o después de una provisoria).

import { useActionState } from "react";
import { elegirClave, type EstadoClave } from "@/app/cuenta/clave/acciones";
import { Boton } from "@/components/ui";
import { AvisoError, Campo } from "./campos";
import { ClaveVisible } from "./clave-visible";

export function FormularioClave() {
  const [estado, guardar, guardando] = useActionState<EstadoClave, FormData>(elegirClave, {});

  return (
    <form action={guardar}>
      {estado.error && (
        <div className="mb-5">
          <AvisoError>
            <p className="font-semibold">{estado.error}</p>
          </AvisoError>
        </div>
      )}
      <div className="grid gap-5">
        <Campo id="clave" rotulo="Contraseña nueva" ayuda="Al menos 10 caracteres, con letras y números.">
          <ClaveVisible id="clave" name="clave" autoComplete="new-password" describedBy="clave-ayuda" />
        </Campo>
        <Campo id="repetida" rotulo="Repetila">
          <ClaveVisible id="repetida" name="repetida" autoComplete="new-password" />
        </Campo>
      </div>
      <Boton type="submit" ancho className="mt-6" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
