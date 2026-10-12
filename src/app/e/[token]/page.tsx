// Destino del QR impreso en la etiqueta de cada equipo: scp.com.ar/e/<qrToken>.
// Busca el elemento y lleva a su ficha. Si el token no existe, muestra not-found.tsx.
// TODO(supabase): cuando haya usuarios, decidir por rol: el supervisor va a /s/elementos/<id>
// y el cliente a la vista de solo lectura del equipo. Sin sesión, pedir que inicie sesión y volver acá.

import { notFound, redirect } from "next/navigation";
import { elementoPorToken } from "@/components/elementos/consultas";

export default async function DestinoDelQR({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const elemento = elementoPorToken(decodeURIComponent(token));
  if (!elemento) notFound();
  redirect(`/s/elementos/${elemento.id}`);
}
