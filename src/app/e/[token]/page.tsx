// Destino del QR impreso en la etiqueta de cada equipo: scp.com.ar/e/<qrToken>.
// Pide sesión (sin ella, el proxy manda al login y después vuelve acá), busca el elemento y lleva a su ficha.
// Si el token no existe, muestra not-found.tsx.

import { notFound, redirect } from "next/navigation";
import { elementoPorToken } from "@/components/elementos/consultas";
import { cargarDatos } from "@/lib/datos";
import { exigirStaff } from "@/lib/sesion";

export default async function DestinoDelQR({ params }: { params: Promise<{ token: string }> }) {
  await exigirStaff();
  await cargarDatos();
  const { token } = await params;
  let texto = token;
  try {
    texto = decodeURIComponent(token);
  } catch {
    notFound();
  }
  const elemento = elementoPorToken(texto);
  if (!elemento) notFound();
  redirect(`/s/elementos/${elemento.id}`);
}
