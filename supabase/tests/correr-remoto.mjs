// Corre los tests pgTAP de supabase/tests contra el proyecto vinculado sin Docker.
// `supabase test db` necesita Docker; este script manda cada archivo con `supabase db query --linked`.
// Cada aserción guarda su resultado en una tabla temporal y al final se lanza un error a propósito con
// todos los resultados: el error deshace la transacción, así que no queda ningún dato de prueba.
//
// Uso: node supabase/tests/correr-remoto.mjs

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const carpeta = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const archivos = readdirSync(carpeta).filter((f) => f.endsWith("_test.sql"));
const temporal = mkdtempSync(join(tmpdir(), "pgtap-"));
let fallos = 0;

for (const archivo of archivos) {
  let sql = readFileSync(join(carpeta, archivo), "utf8").replace(/\r\n/g, "\n");
  sql = sql.replace(
    "select no_plan();",
    "select no_plan();\ncreate temp table _resultado (n serial, t text);\ngrant all on _resultado, _resultado_n_seq to authenticated, anon;",
  );
  sql = sql.replace(/^select (is|isnt|ok|throws_ok|lives_ok|results_eq)\(/gm, "insert into _resultado (t) select $1(");
  // Con una función de reemplazo, porque en un texto de reemplazo "$$" se convierte en "$".
  sql = sql.replace(
    /select \* from finish\(\);\nrollback;\s*$/,
    () => `insert into _resultado (t) select * from finish();
do $$ begin
  raise exception E'RESULTADOS\\n%', (select string_agg(t, E'\\n' order by n) from _resultado);
end $$;
`,
  );
  const ruta = join(temporal, archivo);
  writeFileSync(ruta, sql);

  let salida = "";
  try {
    salida = execFileSync("npx", ["supabase", "db", "query", "--linked", "-f", ruta], {
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    salida = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  const inicio = salida.indexOf("RESULTADOS");
  if (inicio < 0) {
    console.log(`\n✗ ${archivo}: no se pudo correr\n${salida}`);
    fallos++;
    continue;
  }
  const texto = salida
    .slice(inicio + "RESULTADOS".length)
    .replace(/\\n/g, "\n")
    .split(/"\s*[,}]|\(SQLSTATE/)[0]
    .trim();
  const lineas = texto.split("\n");
  const malas = lineas.filter((l) => l.startsWith("not ok"));
  fallos += malas.length;
  console.log(`\n${archivo}\n${texto}`);
}

console.log(fallos ? `\n${fallos} fallo(s).` : "\nTodo en verde.");
process.exit(fallos ? 1 : 0);
