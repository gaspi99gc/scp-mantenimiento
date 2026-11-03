// Destino del QR impreso en la etiqueta de cada equipo: scp.com.ar/e/<qrToken>.
// Un solo QR para todos: pide sesión (sin ella, el proxy manda al login y después vuelve acá) y lleva a la
// ficha del equipo que corresponde a quien escanea: la del supervisor para SCP, la de solo lectura para el cliente.
// Si el token no existe, o el equipo no es de un local del cliente, muestra not-found.tsx.

import { notFound, redirect } from "next/navigation";
import { elementoPorToken } from "@/components/elementos/consultas";
import { cargarDatos, cargarDatosCliente } from "@/lib/datos";
import { exigirSesion } from "@/lib/sesion";

export default async function DestinoDelQR({ params }: { params: Promise<{ token: string }> }) {
  const usuario = await exigirSesion();
  const esCliente = usuario.rol === "cliente";
  await (esCliente ? cargarDatosCliente() : cargarDatos());
  const { token } = await params;
  let texto = token;
  try {
    texto = decodeURIComponent(token);
  } catch {
    notFound();
  }
  // Para un cliente, la base solo trae sus equipos: el de otro local no aparece y da "no existe".
  const elemento = elementoPorToken(texto);
  if (!elemento) notFound();
  redirect(esCliente ? `/c/equipos/${elemento.id}` : `/s/elementos/${elemento.id}`);
}
