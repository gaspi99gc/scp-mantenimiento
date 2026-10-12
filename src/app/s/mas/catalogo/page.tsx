import type { Metadata } from "next";
import { fichaCatalogo } from "@/components/cuenta/catalogo";
import { Cifra, Encabezado } from "@/components/ui";
import { tiposControl } from "@/lib/datos";

export const metadata: Metadata = { title: "Catálogo de controles" };

function SinDato({ children }: { children: React.ReactNode }) {
  return <span className="text-cemento">{children}</span>;
}

export default function Catalogo() {
  // TODO(supabase): leer `tipo_control` (todo usuario logueado lo lee; solo el admin lo edita).
  const fichas = tiposControl.map(fichaCatalogo);
  const deScp = fichas.filter((f) => f.quien === "SCP").length;

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas", texto: "Más" }}
        titulo="Catálogo de controles"
        bajada="Cada cuánto se hace cada control, desde cuándo se cuenta y con cuánto aviso. Los períodos son los de la norma."
      />

      <p className="mb-3 px-0.5 text-sm text-cemento">
        {fichas.length} controles: {deScp} los hace SCP y {fichas.length - deScp}, un tercero habilitado. Un cambio de
        período rige desde la próxima renovación.
      </p>

      {/* Celular: una ficha por control */}
      <ul className="mb-7 divide-y divide-junta overflow-hidden rounded-[var(--radius-planilla)] border border-junta bg-papel lg:hidden">
        {fichas.map((f) => (
          <li key={f.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold leading-snug">{f.nombre}</h2>
                <p className="text-sm text-cemento">{f.aplicaA}</p>
              </div>
              <div className="shrink-0 text-right">
                <Cifra className="block text-xl leading-none">{f.periodo}</Cifra>
                <span className="mt-1 block text-xs font-medium text-cemento">{f.base}</span>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-junta pt-3 text-sm">
              <dt className="text-cemento">Aviso</dt>
              <dd>
                <Cifra className="text-base">{f.aviso}</Cifra> días antes
              </dd>
              <dt className="text-cemento">Lo hace</dt>
              <dd>{f.quien}</dd>
              <dt className="text-cemento">Norma</dt>
              <dd>{f.norma ?? <SinDato>Sin norma cargada</SinDato>}</dd>
              <dt className="text-cemento">Evidencia</dt>
              <dd>{f.evidencia ?? <SinDato>No pide</SinDato>}</dd>
            </dl>
          </li>
        ))}
      </ul>

      {/* Computadora: planilla de referencia */}
      <div className="mb-7 hidden overflow-hidden rounded-[var(--radius-planilla)] border border-junta bg-papel lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="whitespace-nowrap border-b border-junta text-cemento">
              <th scope="col" className="w-[25%] px-4 py-3 font-normal">Control</th>
              <th scope="col" className="w-[21%] px-3 py-3 font-normal">Período</th>
              <th scope="col" className="px-3 py-3 font-normal">Aviso</th>
              <th scope="col" className="px-3 py-3 font-normal">Lo hace</th>
              <th scope="col" className="px-3 py-3 font-normal">Norma</th>
              <th scope="col" className="w-[22%] px-3 py-3 pr-4 font-normal">Evidencia obligatoria</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-junta">
            {fichas.map((f) => (
              <tr key={f.id} className="align-top">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="block text-base font-semibold leading-snug">{f.nombre}</span>
                  <span className="text-cemento">{f.aplicaA}</span>
                </th>
                <td className="px-3 py-3">
                  <Cifra className="block text-lg leading-tight">{f.periodo}</Cifra>
                  <span className="text-cemento">{f.base}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <Cifra className="text-lg leading-tight">{f.aviso}</Cifra> días antes
                </td>
                <td className="whitespace-nowrap px-3 py-3">{f.quien}</td>
                <td className="whitespace-nowrap px-3 py-3">{f.norma ?? <SinDato>Sin norma</SinDato>}</td>
                <td className="px-3 py-3 pr-4">{f.evidencia ?? <SinDato>No pide</SinDato>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
