import { redirect } from "next/navigation";

// La pantalla de inicio del supervisor es la Agenda.
export default function Inicio() {
  redirect("/s/agenda");
}
