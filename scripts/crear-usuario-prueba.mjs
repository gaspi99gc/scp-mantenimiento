// Crea (o deja al día) el usuario de cliente de prueba "local1", para ver la app del cliente.
// Uso: npm run crear-usuario-prueba                → lo vincula al único local, o al de ejemplo (La Espiga Caballito)
//      npm run crear-usuario-prueba -- "Almagro"   → lo vincula al local cuyo nombre contiene "Almagro"
// La contraseña sale de PRUEBA_LOCAL1_PASSWORD en .env.local; si no está, se genera una y se muestra.
// Se puede correr varias veces: si el usuario ya existe, le pone la contraseña y lo vuelve a vincular.
// Solo corre contra el proyecto de desarrollo, igual que cargar-ejemplo.

import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

const PROYECTO_DESARROLLO = "qotlyqischkjpohsmwbn";
const LOCAL_DE_EJEMPLO = "20000000-0000-4000-8000-000000000001";
const USUARIO = "local1";
const EMAIL = "local1@sin-email.example.com"; // el mismo email interno que usa la app para clientes sin email (src/lib/email-interno.ts)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secreta = process.env.SUPABASE_SECRET_KEY;
if (!url || !secreta) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.");
  process.exit(1);
}
if (!url.includes(PROYECTO_DESARROLLO)) {
  console.error(`El usuario de prueba solo se crea en el proyecto de desarrollo (${PROYECTO_DESARROLLO}).`);
  process.exit(1);
}

function generarClave() {
  const letras = "abcdefghijkmnpqrstuvwxyz";
  const numeros = "23456789";
  const todos = letras + numeros;
  const c = Array.from({ length: 12 }, () => todos[randomInt(todos.length)]);
  c[randomInt(6)] = letras[randomInt(letras.length)];
  c[6 + randomInt(6)] = numeros[randomInt(numeros.length)];
  return c.join("");
}
const clave = process.env.PRUEBA_LOCAL1_PASSWORD || generarClave();

const admin = createClient(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });

// ——— El local ———
const buscado = process.argv[2]?.trim().toLowerCase();
const { data: locales, error: errorLocales } = await admin.from("local").select("id, nombre, cliente_id").order("nombre");
if (errorLocales) throw errorLocales;
if (!locales.length) {
  console.error("No hay locales cargados. Cargá uno desde la app (Locales → Agregar) o corré npm run cargar-ejemplo.");
  process.exit(1);
}
let local;
if (buscado) {
  const candidatos = locales.filter((l) => l.nombre.toLowerCase().includes(buscado));
  if (candidatos.length !== 1) {
    console.error(
      candidatos.length
        ? `Hay ${candidatos.length} locales con "${buscado}": ${candidatos.map((l) => l.nombre).join(", ")}. Escribí uno más preciso.`
        : `No hay ningún local con "${buscado}". Los locales son: ${locales.map((l) => l.nombre).join(", ")}.`,
    );
    process.exit(1);
  }
  local = candidatos[0];
} else {
  local = locales.length === 1 ? locales[0] : locales.find((l) => l.id === LOCAL_DE_EJEMPLO);
  if (!local) {
    console.error(`Hay ${locales.length} locales: ${locales.map((l) => l.nombre).join(", ")}.`);
    console.error('Decí cuál con: npm run crear-usuario-prueba -- "parte del nombre"');
    process.exit(1);
  }
}

// ——— El usuario en Auth ———
const { data: ocupado } = await admin.from("perfil").select("id, email").eq("usuario", USUARIO).maybeSingle();
if (ocupado && ocupado.email !== EMAIL) {
  console.error(`El usuario "${USUARIO}" ya lo tiene otra persona (${ocupado.email}). No se toca.`);
  process.exit(1);
}

async function buscarPorEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const encontrado = data.users.find((u) => u.email?.toLowerCase() === email);
    if (encontrado || data.users.length < 200) return encontrado;
  }
}

let usuario = await buscarPorEmail(EMAIL);
if (usuario) {
  const { error } = await admin.auth.admin.updateUserById(usuario.id, { password: clave, email_confirm: true, ban_duration: "none" });
  if (error) throw error;
} else {
  const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: clave, email_confirm: true });
  if (error) throw error;
  usuario = data.user;
}

// ——— Perfil de cliente y membresía de ese local ———
const { error: errorPerfil } = await admin
  .from("perfil")
  .upsert({ id: usuario.id, nombre: "Local 1 (prueba)", email: EMAIL, usuario: USUARIO, rol: "cliente", activo: true });
if (errorPerfil) throw errorPerfil;

const { error: errorBorrar } = await admin.from("membresia").delete().eq("perfil_id", usuario.id);
if (errorBorrar) throw errorBorrar;
const { error: errorMembresia } = await admin
  .from("membresia")
  .insert({ perfil_id: usuario.id, cliente_id: local.cliente_id, local_id: local.id });
if (errorMembresia) throw errorMembresia;

console.log(`Listo: el usuario "${USUARIO}" ve el local ${local.nombre}.`);
console.log(`Entrá en http://localhost:3000/login con usuario ${USUARIO} y contraseña ${clave}`);
