// Crea (o deja al día) el usuario admin del dueño en el proyecto de Supabase del .env.local.
// Uso: npm run crear-admin
// Lee DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD y, opcional, DEV_ADMIN_NOMBRE. Se puede correr varias veces:
// si el usuario ya existe, le vuelve a poner esa contraseña y lo deja como admin activo.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
const clave = process.env.DEV_ADMIN_PASSWORD;

const faltan = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !secreta && "SUPABASE_SECRET_KEY",
  !email && "DEV_ADMIN_EMAIL",
  !clave && "DEV_ADMIN_PASSWORD",
].filter(Boolean);
if (faltan.length) {
  console.error(`Faltan en .env.local: ${faltan.join(", ")}.`);
  process.exit(1);
}
if (clave.length < 6) {
  console.error("DEV_ADMIN_PASSWORD necesita al menos 6 caracteres (el mínimo de Supabase).");
  process.exit(1);
}
if (clave.length < 10 || !/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) {
  console.warn("Ojo: la contraseña es débil. Cambiala desde Más → Usuarios antes de cargar datos reales.");
}

const nombre =
  process.env.DEV_ADMIN_NOMBRE?.trim() ||
  email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, (l) => l.toUpperCase());

const admin = createClient(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });

async function buscarPorEmail(buscado) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const encontrado = data.users.find((u) => u.email?.toLowerCase() === buscado);
    if (encontrado || data.users.length < 200) return encontrado;
  }
}

let usuario = await buscarPorEmail(email);
if (usuario) {
  const { error } = await admin.auth.admin.updateUserById(usuario.id, {
    password: clave,
    email_confirm: true,
    ban_duration: "none",
  });
  if (error) throw error;
  console.log(`El usuario ${email} ya existía: se le puso la contraseña del .env.local.`);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true });
  if (error) throw error;
  usuario = data.user;
  console.log(`Usuario ${email} creado.`);
}

const { error: errorPerfil } = await admin
  .from("perfil")
  .upsert({ id: usuario.id, nombre, email, rol: "admin", activo: true });
// Usuario corto para entrar ("admin"), si nadie más lo tiene.
await admin.from("perfil").update({ usuario: "admin" }).eq("id", usuario.id).is("usuario", null);
if (errorPerfil) throw errorPerfil;

console.log(`Listo: ${nombre} es admin. Entrá con "Entrar como admin" en http://localhost:3000/login.`);
