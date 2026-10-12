"use client";

import { Boton } from "@/components/ui";

/** Imprime solo la etiqueta (ver ESTILO_IMPRESION en etiqueta-qr.tsx). */
export function BotonImprimir() {
  function imprimir() {
    // TODO(supabase): las etiquetas de todo un local salen en lote, como PDF, desde "Alta y relevamiento".
    const html = document.documentElement;
    html.dataset.imprimir = "etiqueta";
    const limpiar = () => {
      delete html.dataset.imprimir;
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    window.print();
  }

  return (
    <Boton variante="secundario" onClick={imprimir}>
      Imprimir etiqueta
    </Boton>
  );
}
