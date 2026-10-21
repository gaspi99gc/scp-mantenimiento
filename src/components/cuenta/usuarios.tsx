"use client";

// Piezas de Más → Usuarios: el alta de un usuario y cada fila de la lista con sus acciones.

import { useActionState, useState, useTransition } from "react";
import {
  cambiarActivo,
  crearUsuario,
  ponerClaveProvisoria,
  type EstadoUsuarios,
} from "@/app/s/mas/usuarios/acciones";
import { Boton, cx } from "@/components/ui";
import { AvisoError, Campo, CLASE_CAMPO } from "./campos";

// Sin letras ni números que se confundan al dictarla por teléfono (0/O, 1/l/I).
const LETRAS = "abcdefghijkmnpqrstuvwxyz";
const NUMEROS = "23456789";

function generarClave(): string {
  const azar = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const todos = LETRAS + NUMEROS;
  const c = Array.from({ length: 12 }, () => todos[azar(todos.length)]);
  // Siempre al menos una letra y un número.
  c[azar(6)] = LETRAS[azar(LETRAS.length)];
  c[6 + azar(6)] = NUMEROS[azar(NUMEROS.length)];
  return c.join("");
}

function Aviso({ estado }: { estado: EstadoUsuarios }) {
  if (estado.error)
    return (
      <AvisoError>
        <p className="font-semibold">{estado.error}</p>
      </AvisoError>
    );
  if (estado.ok)
    return (
      <p role="status" className="rounded-[var(--radius-planilla)] border-2 border-verde bg-papel p-3 text-sm font-medium">
        {estado.ok}
      </p>
    );
  return null;
}

function CampoClaveProvisoria({ id }: { id: string }) {
  const [clave, setClave] = useState("");
  return (
    <Campo
      id={id}
      rotulo="Contraseña provisoria"
      ayuda="Se la pasás a la persona. Al entrar, la app le pide que elija una propia."
      extra={
        <button
          type="button"
          onClick={() => setClave(generarClave())}
          className="min-h-10 rounded-[2px] px-2 text-sm font-semibold underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
        >
          Generar una
        </button>
      }
    >
      <input
        id={id}
        name="clave"
        type="text"
        autoComplete="off"
        spellCheck={false}
        required
        minLength={10}
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        aria-describedby={`${id}-ayuda`}
        className={cx(CLASE_CAMPO, "cifra border-borde text-xl")}
      />
    </Campo>
  );
}

export function NuevoUsuario() {
  const [estado, crear, creando] = useActionState<EstadoUsuarios, FormData>(crearUsuario, {});
  // Después de crear uno, el formulario se vacía (cambia la key) para cargar el siguiente.
  const [vuelta, setVuelta] = useState(0);
  const [ultimoOk, setUltimoOk] = useState<string | undefined>();
  if (estado.ok && estado.ok !== ultimoOk) {
    setUltimoOk(estado.ok);
    setVuelta(vuelta + 1);
  }

  return (
    <form key={vuelta} action={crear} className="grid gap-5 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2" aria-live="polite">
        <Aviso estado={estado} />
      </div>
      <Campo id="nombre" rotulo="Nombre y apellido">
        <input id="nombre" name="nombre" required autoComplete="off" className={cx(CLASE_CAMPO, "border-borde")} />
      </Campo>
      <Campo id="email-nuevo" rotulo="Email">
        <input
          id="email-nuevo"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoComplete="off"
          placeholder="nombre@scp.com.ar"
          className={cx(CLASE_CAMPO, "border-borde")}
        />
      </Campo>
      <fieldset>
        <legend className="rotulo mb-1.5 text-lg">Rol</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["supervisor", "Supervisor", "Ve y carga los locales"],
              ["admin", "Admin", "Además maneja usuarios"],
            ] as const
          ).map(([valor, texto, ayuda]) => (
            <label
              key={valor}
              className="flex min-h-12 cursor-pointer items-start gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta has-[:checked]:bg-yeso/60"
            >
              <input
                type="radio"
                name="rol"
                value={valor}
                defaultChecked={valor === "supervisor"}
                className="mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]"
              />
              <span>
                <span className="block font-semibold leading-tight">{texto}</span>
                <span className="block text-sm leading-snug text-cemento">{ayuda}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <CampoClaveProvisoria id="clave-nueva" />
      <div className="sm:col-span-2">
        <Boton type="submit" disabled={creando} className="max-sm:w-full">
          {creando ? "Creando…" : "Crear usuario"}
        </Boton>
      </div>
    </form>
  );
}

export interface DatosUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  debeCambiarClave: boolean;
  soyYo: boolean;
}

export function FilaUsuario({ usuario }: { usuario: DatosUsuario }) {
  const [abierta, setAbierta] = useState(false);
  const [estadoClave, ponerClave, poniendo] = useActionState<EstadoUsuarios, FormData>(ponerClaveProvisoria, {});
  const [estadoActivo, setEstadoActivo] = useState<EstadoUsuarios>({});
  const [cambiando, empezar] = useTransition();

  function alternarActivo() {
    const accion = usuario.activo ? "Desactivar" : "Reactivar";
    const consecuencia = usuario.activo ? " Va a dejar de poder entrar y de ver datos en el momento." : "";
    if (!window.confirm(`${accion} a ${usuario.nombre}?${consecuencia}`)) return;
    empezar(async () => setEstadoActivo(await cambiarActivo(usuario.id, !usuario.activo)));
  }

  const estado = !usuario.activo ? "Desactivado" : usuario.debeCambiarClave ? "Falta que elija su contraseña" : "Activo";

  return (
    <li className={cx("px-4 py-3.5", !usuario.activo && "rayado-suave")}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold leading-snug">{usuario.nombre}</span>
            {usuario.soyYo && <span className="text-sm text-cemento">(vos)</span>}
            <span className="text-sm font-medium">{usuario.rol}</span>
          </p>
          <p className="mt-0.5 text-sm text-cemento [overflow-wrap:anywhere]">{usuario.email}</p>
          <p className={cx("mt-0.5 text-sm font-medium", !usuario.activo ? "text-rojo" : "text-tinta")}>{estado}</p>
        </div>
        {!usuario.soyYo && (
          <div className="flex flex-wrap gap-2">
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setAbierta(!abierta)}
              aria-expanded={abierta}
              disabled={!usuario.activo}
            >
              Contraseña provisoria
            </Boton>
            <Boton type="button" variante={usuario.activo ? "peligro" : "secundario"} onClick={alternarActivo} disabled={cambiando}>
              {cambiando ? "Guardando…" : usuario.activo ? "Desactivar" : "Reactivar"}
            </Boton>
          </div>
        )}
      </div>
      <div aria-live="polite" className="empty:hidden mt-3">
        {(estadoActivo.error || estadoActivo.ok) && <Aviso estado={estadoActivo} />}
      </div>
      {abierta && (
        <form action={ponerClave} className="mt-3 grid gap-3 rounded-[var(--radius-planilla)] bg-yeso/60 p-3">
          <input type="hidden" name="id" value={usuario.id} />
          <Aviso estado={estadoClave} />
          <CampoClaveProvisoria id={`clave-${usuario.id}`} />
          <div>
            <Boton type="submit" disabled={poniendo} className="max-sm:w-full">
              {poniendo ? "Guardando…" : "Poner contraseña provisoria"}
            </Boton>
          </div>
        </form>
      )}
    </li>
  );
}
