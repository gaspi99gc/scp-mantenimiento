"use client";

// Formulario de alta de local: cliente (existente o nuevo), datos del local, acceso, encargado y supervisor.
// Si algo falla, los campos conservan lo que se escribió.

import { useActionState, useState, type ReactNode } from "react";
import { crearLocal, type EstadoAlta } from "@/app/s/locales/nuevo/acciones";
import { AvisoError, Campo, CLASE_CAMPO } from "@/components/cuenta/campos";
import { Boton, cx, TituloPlanilla } from "@/components/ui";

const RUBROS = [
  ["gastronomico", "Gastronómico"],
  ["retail", "Comercio"],
  ["farmacia", "Farmacia"],
  ["oficina", "Oficina"],
  ["otro", "Otro"],
] as const;

const CAMPO = cx(CLASE_CAMPO, "border-borde");

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section className="mb-7" aria-labelledby={id}>
      <TituloPlanilla id={id} titulo={titulo} />
      <div className="grid gap-5 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function FormularioLocal({
  clientes,
  supervisores,
  supervisorPorDefecto,
}: {
  clientes: { id: string; nombre: string }[];
  supervisores: { id: string; nombre: string }[];
  supervisorPorDefecto: string;
}) {
  const [estado, crear, creando] = useActionState<EstadoAlta, FormData>(crearLocal, {});
  const v = estado.valores ?? {};
  const [modo, setModo] = useState<"existente" | "nuevo">(
    (v.clienteModo as "existente" | "nuevo") ?? (clientes.length ? "existente" : "nuevo"),
  );

  return (
    <form action={crear} key={JSON.stringify(v)}>
      {estado.error && (
        <div className="mb-6">
          <AvisoError>
            <p className="font-semibold">{estado.error}</p>
          </AvisoError>
        </div>
      )}

      <Bloque id="cliente" titulo="Cliente">
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 font-semibold">¿El cliente ya está cargado?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["existente", "Sí, elegirlo"],
                ["nuevo", "No, es nuevo"],
              ] as const
            ).map(([valor, texto]) => (
              <label
                key={valor}
                className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 font-semibold has-[:checked]:border-tinta has-[:checked]:bg-yeso/60"
              >
                <input
                  type="radio"
                  name="clienteModo"
                  value={valor}
                  checked={modo === valor}
                  onChange={() => setModo(valor)}
                  disabled={valor === "existente" && clientes.length === 0}
                  className="size-5 shrink-0 accent-[var(--color-tinta)]"
                />
                {texto}
              </label>
            ))}
          </div>
        </fieldset>

        {modo === "existente" ? (
          <Campo id="clienteId" rotulo="Cliente">
            <select id="clienteId" name="clienteId" required defaultValue={v.clienteId ?? ""} className={CAMPO}>
              <option value="" disabled>
                Elegí el cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
        ) : (
          <>
            <Campo id="clienteNombre" rotulo="Nombre del cliente" ayuda="Como lo conocen: Panadería La Espiga.">
              <input id="clienteNombre" name="clienteNombre" required defaultValue={v.clienteNombre} autoComplete="off" className={CAMPO} />
            </Campo>
            <Campo id="razonSocial" rotulo="Razón social">
              <input id="razonSocial" name="razonSocial" required defaultValue={v.razonSocial} autoComplete="off" className={CAMPO} />
            </Campo>
            <Campo id="cuit" rotulo="CUIT" ayuda="11 números, con o sin guiones.">
              <input
                id="cuit"
                name="cuit"
                required
                inputMode="numeric"
                defaultValue={v.cuit}
                autoComplete="off"
                placeholder="30-71234567-8"
                className={cx(CAMPO, "cifra text-xl")}
              />
            </Campo>
          </>
        )}
      </Bloque>

      <Bloque id="local" titulo="Local">
        <Campo id="nombre" rotulo="Nombre del local" ayuda="Para distinguirlo: La Espiga Caballito.">
          <input id="nombre" name="nombre" required defaultValue={v.nombre} autoComplete="off" className={CAMPO} />
        </Campo>
        <Campo id="rubro" rotulo="Rubro">
          <select id="rubro" name="rubro" required defaultValue={v.rubro ?? ""} className={CAMPO}>
            <option value="" disabled>
              Elegí el rubro
            </option>
            {RUBROS.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="direccion" rotulo="Dirección">
          <input id="direccion" name="direccion" required defaultValue={v.direccion} autoComplete="off" placeholder="Av. Rivadavia 5320" className={CAMPO} />
        </Campo>
        <Campo id="barrio" rotulo="Barrio o localidad">
          <input id="barrio" name="barrio" required defaultValue={v.barrio} autoComplete="off" placeholder="Caballito" className={CAMPO} />
        </Campo>
      </Bloque>

      <Bloque id="acceso" titulo="Acceso y encargado">
        <Campo id="horario" rotulo="Horario para trabajar">
          <input id="horario" name="horario" defaultValue={v.horario} autoComplete="off" placeholder="Lunes a sábado de 6 a 21 h" className={CAMPO} />
        </Campo>
        <Campo id="requisitos" rotulo="Requisitos para entrar (opcional)" ayuda="Permisos, ART, horario del shopping…">
          <input id="requisitos" name="requisitos" defaultValue={v.requisitos} autoComplete="off" className={CAMPO} />
        </Campo>
        <Campo id="encargadoNombre" rotulo="Encargado">
          <input id="encargadoNombre" name="encargadoNombre" defaultValue={v.encargadoNombre} autoComplete="off" className={CAMPO} />
        </Campo>
        <Campo id="encargadoTelefono" rotulo="Teléfono del encargado">
          <input
            id="encargadoTelefono"
            name="encargadoTelefono"
            type="tel"
            inputMode="tel"
            defaultValue={v.encargadoTelefono}
            autoComplete="off"
            placeholder="+54 9 11 4444-1201"
            className={cx(CAMPO, "cifra text-xl")}
          />
        </Campo>
        <Campo id="supervisorId" rotulo="Supervisor responsable">
          <select id="supervisorId" name="supervisorId" defaultValue={v.supervisorId ?? supervisorPorDefecto} className={CAMPO}>
            <option value="">Sin asignar</option>
            {supervisores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </Bloque>

      <Boton type="submit" disabled={creando} className="max-sm:w-full">
        {creando ? "Creando…" : "Crear local"}
      </Boton>
      <p className="mt-2 mb-8 text-sm text-cemento">
        Al crearlo se le agregan solos los controles de todo el local, como plagas y puesta a tierra. Los equipos se cargan
        después, desde la ficha del local.
      </p>
    </form>
  );
}
