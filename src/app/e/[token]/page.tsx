// Destino del QR impreso en la etiqueta de cada equipo: scp.com.ar/e/<qrToken>.
// Pide sesión (sin ella, el proxy manda al login y después vuelve acá), busca el elemento y lleva a su ficha.
// Si el token no existe, muestra not-found.tsx.

import { notFound, redirect } from "next/navigation";
import { elementoPorToken } from "@/components/elementos/consultas";
import { exigirStaff } from "@/lib/sesion";

export default async function DestinoDelQR({ params }: { params: Promise<{ token: string }> }) {
  await exigirStaff();
  const { token } = await params;
  const elemento = elementoPorToken(decodeURIComponent(token));
  if (!elemento) notFound();
  redirect(`/s/elementos/${elemento.id}`);
}
