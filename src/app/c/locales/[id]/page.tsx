// Un local de la cadena, visto por el cliente. Si el local no es suyo, la base no lo trae y da 404.

import { notFound } from "next/navigation";
import { seccionDe, VistaLocal } from "@/components/cliente/vista-local";
import { cargarDatosCliente, datos, localDe } from "@/lib/datos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatosCliente();
  return { title: localDe(id)?.nombre ?? "Local" };
}

export default async function LocalDelCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { ver } = await searchParams;
  await cargarDatosCliente();
  const local = localDe(id);
  if (!local) notFound();
  const varios = datos().locales.length > 1;
  return (
    <VistaLocal
      local={local}
      base={`/c/locales/${local.id}`}
      seccion={seccionDe(ver)}
      volver={varios ? { href: "/c", texto: "Tus locales" } : undefined}
    />
  );
}
