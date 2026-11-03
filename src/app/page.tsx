import { redirect } from "next/navigation";
import { inicioDe, usuarioActual } from "@/lib/sesion";

// La raíz lleva al inicio de cada rol: la Agenda para SCP, el estado de sus locales para un cliente.
export default async function Inicio() {
  const usuario = await usuarioActual();
  redirect(usuario?.activo ? inicioDe(usuario.rol) : "/login");
}
