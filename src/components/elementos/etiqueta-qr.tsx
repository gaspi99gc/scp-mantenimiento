// La etiqueta que se imprime y se pega en el equipo: el QR, el código y la ubicación.
// Es un Server Component: el SVG del QR llega ya generado (ver svgDelQR en consultas.ts).

import { Cifra, MarcaSCP } from "@/components/ui";
import { BotonImprimir } from "./boton-imprimir";

// Al imprimir desde el botón se marca <html data-imprimir="etiqueta"> y solo sale la etiqueta.
const ESTILO_IMPRESION = `
@media print {
  html[data-imprimir="etiqueta"] body * { visibility: hidden !important; }
  html[data-imprimir="etiqueta"] #etiqueta-qr,
  html[data-imprimir="etiqueta"] #etiqueta-qr * { visibility: visible !important; }
  html[data-imprimir="etiqueta"] #etiqueta-qr { position: fixed; left: 0; top: 0; margin: 0; }
  @page { margin: 12mm; }
}`;

export function EtiquetaQR({
  svg,
  codigo,
  ubicacion,
  direccion,
}: {
  svg: string;
  codigo: string;
  ubicacion: string;
  /** La dirección que abre el QR, sin "https://" */
  direccion: string;
}) {
  return (
    <section className="mb-7" aria-labelledby="titulo-etiqueta">
      <h2 id="titulo-etiqueta" className="rotulo mb-2 text-xl">
        Etiqueta QR
      </h2>
      <style>{ESTILO_IMPRESION}</style>

      <div id="etiqueta-qr" className="w-[264px] overflow-hidden rounded-[4px] border-2 border-tinta bg-papel text-tinta">
        <div className="flex items-center justify-between gap-2 bg-tinta px-4 py-2 text-papel">
          <MarcaSCP clara className="text-[22px]" />
          <span className="text-[13px]">Mantenimiento integral</span>
        </div>
        <div className="px-4 pb-4 pt-2">
          <div
            role="img"
            aria-label={`Código QR que abre ${direccion}`}
            className="-mx-1 aspect-square"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <Cifra className="mt-1 block text-[36px] font-bold leading-none tracking-[0.02em]">{codigo}</Cifra>
          <p className="mt-1 leading-snug">{ubicacion}</p>
          <p className="mt-3 border-t border-tinta pt-2 text-[13px] leading-snug text-cemento">
            Escaneá el código con el celular para ver los controles de este equipo.
            <Cifra className="mt-0.5 block text-[15px] text-tinta">{direccion}</Cifra>
          </p>
        </div>
      </div>

      <p className="mt-3 max-w-[300px] text-sm text-cemento">Si la etiqueta se despegó o ya no se lee, imprimí otra.</p>
      <div className="mt-3">
        <BotonImprimir />
      </div>
    </section>
  );
}
