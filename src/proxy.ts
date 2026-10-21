// Proxy de Next 16 (antes "middleware"): renueva la sesión de Supabase en cada pedido y manda al login
// a quien no la tiene. Es solo comodidad: cada página y cada acción vuelve a verificar, y la base filtra igual.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTEGIDAS = ["/s", "/e", "/cuenta"];

export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(lista, encabezados) {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
          // Una respuesta que escribe la sesión no se puede guardar en caché.
          for (const [clave, valor] of Object.entries(encabezados)) respuesta.headers.set(clave, valor);
        },
      },
    },
  );

  // No poner nada entre createServerClient y getClaims: es lo que renueva el token.
  const { data } = await supabase.auth.getClaims();
  const conSesion = !!data?.claims?.sub;

  const ruta = request.nextUrl.pathname;
  const protegida = PROTEGIDAS.some((p) => ruta === p || ruta.startsWith(p + "/"));
  if (!conSesion && protegida) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("siguiente", ruta + request.nextUrl.search);
    const redireccion = NextResponse.redirect(login);
    for (const cookie of respuesta.cookies.getAll()) redireccion.cookies.set(cookie);
    return redireccion;
  }

  return respuesta;
}

export const config = {
  // Todo menos archivos estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
