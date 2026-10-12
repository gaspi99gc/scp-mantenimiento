// Se muestra cuando el QR escaneado (o la dirección escrita) no corresponde a ningún elemento.
// Queda fuera del layout del supervisor: es lo primero que ve quien escanea una etiqueta suelta.

import { BotonLink, Cifra } from "@/components/ui";

export default function CodigoDesconocido() {
  return (
    <main className="mx-auto max-w-[640px] px-4 pb-16 pt-8 lg:pt-16">
      <span className="titulo block text-2xl [font-stretch:62%]">SCP</span>
      <h1 className="titulo mt-8 text-2xl text-balance lg:text-3xl">Este código no corresponde a ningún equipo cargado</h1>
      <p className="mt-3 max-w-prose">
        Puede ser una etiqueta vieja, de un equipo que se dio de baja, o un QR que no es de SCP.
      </p>
      <p className="mt-2 max-w-prose text-cemento">
        Si el equipo sigue en el local, buscalo por el código que figura debajo del QR, por ejemplo{" "}
        <Cifra className="text-tinta">ESP1-MAT-01</Cifra>.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <BotonLink href="/s/escanear">Escanear otro código</BotonLink>
        <BotonLink href="/s" variante="secundario">
          Ir a Hoy
        </BotonLink>
      </div>
    </main>
  );
}
