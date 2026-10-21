"use client";

// Formulario de entrada: email y contraseña contra Supabase Auth (Server Action iniciarSesion).
// En la compu (npm run dev) aparece además el botón de ingreso rápido como admin.
// No hay recupero por email todavía: la contraseña nueva la pone el admin.

import { useActionState, useState } from "react";
import { entrarComoAdminDev, iniciarSesion, type EstadoLogin } from "@/app/login/acciones";
import { Boton, cx } from "@/components/ui";
import { AvisoError, Campo, CLASE_CAMPO } from "./campos";
import { ClaveVisible } from "./clave-visible";

export function FormularioLogin({ siguiente, ingresoRapido }: { siguiente?: string; ingresoRapido?: boolean }) {
  const [estado, entrar, entrando] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});
  const [estadoRapido, entrarRapido, entrandoRapido] = useActionState<EstadoLogin>(entrarComoAdminDev, {});
  const [olvido, setOlvido] = useState(false);
  const error = estado.error ?? estadoRapido.error;
  const ocupado = entrando || entrandoRapido;

  return (
    <div>
      <form action={entrar}>
        <h1 className="titulo text-[28px]">Entrá con tu cuenta</h1>

        {error && (
          <div className="mt-5">
            <AvisoError>
              <p className="font-semibold">{error}</p>
              {!estadoRapido.error && <p className="mt-0.5 text-cemento">Revisá que estén bien escritos.</p>}
            </AvisoError>
          </div>
        )}

        <input type="hidden" name="siguiente" value={siguiente ?? ""} />

        <div className="mt-6 grid gap-5">
          <Campo id="email" rotulo="Email">
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              defaultValue={estado.email}
              placeholder="nombre@scp.com.ar"
              className={cx(CLASE_CAMPO, "border-borde")}
            />
          </Campo>

          <Campo id="clave" rotulo="Contraseña">
            <ClaveVisible id="clave" name="clave" autoComplete="current-password" />
          </Campo>
        </div>

        <Boton type="submit" ancho className="mt-6" disabled={ocupado}>
          {entrando ? "Entrando…" : "Entrar"}
        </Boton>
      </form>

      <button
        type="button"
        onClick={() => setOlvido(!olvido)}
        aria-expanded={olvido}
        className="mt-2 inline-flex min-h-12 items-center rounded-[var(--radius-boton)] font-medium underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
      >
        Olvidé mi contraseña
      </button>
      {olvido && (
        <p className="text-sm" role="status">
          Pedile al admin de SCP que te ponga una contraseña provisoria. Al entrar con ella, la app te pide que elijas una
          nueva.
        </p>
      )}

      {ingresoRapido && (
        <form action={entrarRapido} className="mt-8 border-t-2 border-dashed border-junta pt-5">
          <Boton type="submit" variante="secundario" ancho disabled={ocupado}>
            {entrandoRapido ? "Entrando…" : "Entrar como admin (solo en esta compu)"}
          </Boton>
          <p className="mt-2 text-sm text-cemento">
            Aparece solo con <span className="font-medium text-tinta">npm run dev</span>. En la versión publicada no existe.
          </p>
        </form>
      )}
    </div>
  );
}
