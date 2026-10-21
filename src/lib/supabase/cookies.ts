// Opciones de las cookies de sesión: el JavaScript de la página no puede leerlas (httpOnly), así un
// error que permita inyectar código no se lleva la sesión. "secure" solo en producción, porque en la
// compu se prueba también desde el celular por http en la red local.

export const OPCIONES_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
