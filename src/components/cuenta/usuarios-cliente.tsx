"use client";

// Ficha del cliente → Usuarios: crear un usuario para el cliente y elegir qué locales ve.

import { useActionState, useState } from "react";
import { crearUsuarioCliente } from "@/app/s/clientes/[id]/acciones";
import type { EstadoUsuarios } from "@/app/s/mas/usuarios/acciones";
import { Boton, cx } from "@/components/ui";
import { Campo, CLASE_CAMPO } from "./campos";
import { Aviso, CampoClave } from "./usuarios";

export function NuevoUsuarioCliente({
  clienteId,
  clienteNombre,
  locales,
}: {
  clienteId: string;
  clienteNombre: string;
  locales: { id: string; nombre: string }[];
}) {
  const [estado, crear, creando] = useActionState<EstadoUsuarios, FormData>(crearUsuarioCliente, {});
  const [todos, setTodos] = useState(true);
  // Después de crear uno, el formulario se vacía (cambia la key) para cargar el siguiente.
  const [vuelta, setVuelta] = useState(0);
  const [ultimoOk, setUltimoOk] = useState<string | undefined>();
  if (estado.ok && estado.ok !== ultimoOk) {
    setUltimoOk(estado.ok);
    setVuelta(vuelta + 1);
    setTodos(true);
  }

  return (
    <form key={vuelta} action={crear} className="grid gap-5 p-4 sm:grid-cols-2">
      <input type="hidden" name="clienteId" value={clienteId} />
      <div className="sm:col-span-2" aria-live="polite">
        <Aviso estado={estado} />
      </div>
      <Campo id="nombre-cliente" rotulo="Nombre" ayuda="De la persona. Para probar puede ser el del local.">
        <input
          id="nombre-cliente"
          name="nombre"
          required
          autoComplete="off"
          aria-describedby="nombre-cliente-ayuda"
          className={cx(CLASE_CAMPO, "border-borde")}
        />
      </Campo>
      <Campo id="usuario-cliente" rotulo="Usuario para entrar" ayuda="Corto y en minúsculas, por ejemplo local1 o sandra.gomez.">
        <input
          id="usuario-cliente"
          name="usuario"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          pattern="[a-z0-9._-]{3,30}"
          aria-describedby="usuario-cliente-ayuda"
          className={cx(CLASE_CAMPO, "border-borde")}
        />
      </Campo>
      <Campo id="email-cliente" rotulo="Email (opcional)" ayuda="Si no tiene, dejalo vacío: entra igual con el usuario.">
        <input
          id="email-cliente"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="off"
          aria-describedby="email-cliente-ayuda"
          className={cx(CLASE_CAMPO, "border-borde")}
        />
      </Campo>
      <CampoClave id="clave-cliente" />

      <fieldset className="sm:col-span-2">
        <legend className="rotulo mb-1.5 text-lg">Qué locales ve</legend>
        <label className="flex min-h-12 cursor-pointer items-start gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta has-[:checked]:bg-yeso/60">
          <input
            type="checkbox"
            name="todos"
            value="si"
            checked={todos}
            onChange={(e) => setTodos(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]"
          />
          <span>
            <span className="block font-semibold leading-tight">Todos los locales de {clienteNombre}</span>
            <span className="block text-sm leading-snug text-cemento">También los que se agreguen después.</span>
          </span>
        </label>
        {!todos && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {locales.map((l) => (
              <label
                key={l.id}
                className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta"
              >
                <input type="checkbox" name="local" value={l.id} className="size-5 shrink-0 accent-[var(--color-tinta)]" />
                <span className="font-medium">{l.nombre}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="sm:col-span-2">
        <Boton type="submit" disabled={creando} className="max-sm:w-full">
          {creando ? "Creando…" : "Crear usuario"}
        </Boton>
      </div>
    </form>
  );
}
