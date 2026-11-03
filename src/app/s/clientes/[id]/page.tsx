// Ficha del cliente: sus locales y, para el admin, sus usuarios (quién entra a la app del cliente y qué ve).

import { notFound } from "next/navigation";
import { estadosDeLocal, fraseResumen, textoRegla } from "@/components/locales/consultas";
import { Regla } from "@/components/locales/regla";
import { FilaUsuario, type DatosUsuario } from "@/components/cuenta/usuarios";
import { NuevoUsuarioCliente } from "@/components/cuenta/usuarios-cliente";
import { CLASE_PLANILLA, Cifra, Encabezado, Fila, Planilla, TituloPlanilla, Vacio } from "@/components/ui";
import { cargarDatos, clienteDe, resumenLocal } from "@/lib/datos";
import { esEmailInterno } from "@/lib/email-interno";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatos();
  return { title: clienteDe(id)?.nombre ?? "Cliente" };
}

export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const yo = await exigirStaff();
  const { locales: todos } = await cargarDatos();
  const cliente = clienteDe(id);
  if (!cliente) notFound();
  const locales = todos.filter((l) => l.clienteId === cliente.id).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const esAdmin = yo.rol === "admin";

  return (
    <>
      <Encabezado
        volver={{ href: "/s/locales", texto: "Locales" }}
        titulo={cliente.nombre}
        bajada={
          <>
            {cliente.razonSocial}, CUIT <Cifra className="text-[19px] text-tinta">{cliente.cuit}</Cifra>
          </>
        }
      />

      <Planilla titulo="Locales" aparte={locales.length === 1 ? "1 local" : `${locales.length} locales`}>
        {locales.map((l) => {
          const resumen = resumenLocal(l.id);
          const regla = textoRegla(resumen);
          return (
            <Fila
              key={l.id}
              href={`/s/locales/${l.id}`}
              estado={resumen.peor}
              titulo={l.nombre}
              detalle={`${l.barrio}, ${l.direccion}`}
              derecha={
                <span className="text-right">
                  <span className={resumen.vencidos ? "block font-semibold text-rojo" : "block font-semibold"}>{regla.principal}</span>
                  <span className="block text-sm text-cemento">{regla.secundario}</span>
                </span>
              }
              debajo={<Regla estados={estadosDeLocal(l.id)} etiqueta={fraseResumen(resumen)} className="max-w-xs" />}
            />
          );
        })}
      </Planilla>

      {esAdmin ? (
        <UsuariosDelCliente clienteId={cliente.id} clienteNombre={cliente.nombre} locales={locales} yoId={yo.id} />
      ) : (
        <p className="text-cemento">Los usuarios de este cliente los crea el admin.</p>
      )}
    </>
  );
}

async function UsuariosDelCliente({
  clienteId,
  clienteNombre,
  locales,
  yoId,
}: {
  clienteId: string;
  clienteNombre: string;
  locales: { id: string; nombre: string }[];
  yoId: string;
}) {
  const db = await clienteServidor();
  const { data: membresias } = await db.from("membresia").select("perfil_id, local_id").eq("cliente_id", clienteId);
  const ids = [...new Set((membresias ?? []).map((m) => m.perfil_id))];
  const { data: perfiles } = ids.length
    ? await db.from("perfil").select("id, nombre, email, usuario, activo").in("id", ids).order("activo", { ascending: false }).order("nombre")
    : { data: [] };

  const nombreLocal = new Map(locales.map((l) => [l.id, l.nombre]));
  const usuarios: DatosUsuario[] = (perfiles ?? []).map((p) => {
    const propias = (membresias ?? []).filter((m) => m.perfil_id === p.id);
    const ve = propias.some((m) => !m.local_id)
      ? "todos los locales"
      : propias.map((m) => nombreLocal.get(m.local_id!) ?? "un local").join(", ");
    return {
      id: p.id,
      nombre: p.nombre,
      email: esEmailInterno(p.email) ? "sin email" : p.email,
      usuario: p.usuario ?? undefined,
      rol: "Cliente",
      ve,
      activo: p.activo,
      soyYo: p.id === yoId,
    };
  });

  return (
    <>
      <section className="mb-8" aria-labelledby="usuarios-cliente">
        <TituloPlanilla id="usuarios-cliente" titulo="Usuarios del cliente" aparte="Entran a la app del cliente, solo para mirar" />
        {usuarios.length === 0 ? (
          <Vacio>Todavía nadie de {clienteNombre} tiene usuario. Creale uno abajo.</Vacio>
        ) : (
          <ul className={CLASE_PLANILLA}>
            {usuarios.map((u) => (
              <FilaUsuario key={u.id} usuario={u} />
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8" aria-labelledby="nuevo-usuario-cliente">
        <TituloPlanilla id="nuevo-usuario-cliente" titulo="Crear usuario" />
        <div className={CLASE_PLANILLA}>
          {locales.length === 0 ? (
            <p className="p-4 text-cemento">Primero agregá un local de este cliente.</p>
          ) : (
            <NuevoUsuarioCliente clienteId={clienteId} clienteNombre={clienteNombre} locales={locales} />
          )}
        </div>
      </section>
    </>
  );
}
