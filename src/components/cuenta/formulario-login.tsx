"use client";

// Formulario de entrada. Pasos: email y contraseña → (solo admin) código TOTP de 6 números.
// También "Olvidé mi contraseña", con una respuesta que nunca dice si el email tiene cuenta.
//
// Simulación mientras no hay Supabase:
// - una contraseña de menos de 6 caracteres "no coincide";
// - un email que empieza con "admin" pide el código de la app de autenticación;
// - el código 000000 "no coincide"; cualquier otro entra.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { IconoAlerta } from "@/components/iconos";
import { Boton, cx } from "@/components/ui";

export type PasoLogin = "credenciales" | "codigo" | "recuperar" | "recuperado";

type Errores = { email?: string; clave?: string; general?: string; codigo?: string };

const ERROR_CREDENCIALES = "El email o la contraseña no coinciden.";
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CLASE_CAMPO =
  "min-h-12 w-full rounded-[var(--radius-boton)] border bg-papel px-3 text-base text-tinta placeholder:text-cemento";

function Campo({
  id,
  rotulo,
  error,
  children,
  extra,
}: {
  id: string;
  rotulo: string;
  error?: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={id} className="rotulo text-lg">
          {rotulo}
        </label>
        {extra}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-rojo">
          {error}
        </p>
      )}
    </div>
  );
}

function ErrorGeneral({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-[var(--radius-planilla)] border-2 border-rojo bg-papel p-3">
      <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function FormularioLogin({
  pasoInicial = "credenciales",
  errorInicial = false,
}: {
  pasoInicial?: PasoLogin;
  errorInicial?: boolean;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<PasoLogin>(pasoInicial);
  const [email, setEmail] = useState(
    pasoInicial === "codigo" ? "admin@scp.com.ar" : errorInicial ? "matias.ferreyra@scp.com.ar" : "",
  );
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [codigo, setCodigo] = useState<string[]>(Array(6).fill(""));
  const [errores, setErrores] = useState<Errores>(errorInicial ? { general: ERROR_CREDENCIALES } : {});
  const [enviando, setEnviando] = useState(false);

  const titulo = useRef<HTMLHeadingElement>(null);
  const campoEmail = useRef<HTMLInputElement>(null);
  const campoClave = useRef<HTMLInputElement>(null);
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  const pasoAnterior = useRef(pasoInicial);

  // Al cambiar de paso, el foco va a lo primero que hay que completar
  useEffect(() => {
    if (pasoAnterior.current === paso) return;
    pasoAnterior.current = paso;
    if (paso === "codigo") casillas.current[0]?.focus();
    else if (paso === "recuperar") campoEmail.current?.focus();
    else titulo.current?.focus();
  }, [paso]);

  function irA(p: PasoLogin) {
    setErrores({});
    setEnviando(false);
    setPaso(p);
  }

  function validarEmail(): string | undefined {
    if (!email.trim()) return "Escribí tu email.";
    if (!EMAIL_VALIDO.test(email.trim())) return "A ese email le falta algo. Ej.: nombre@scp.com.ar";
  }

  function entrar(e: FormEvent) {
    e.preventDefault();
    const nuevos: Errores = { email: validarEmail(), clave: clave ? undefined : "Escribí tu contraseña." };
    if (nuevos.email || nuevos.clave) {
      setErrores(nuevos);
      (nuevos.email ? campoEmail : campoClave).current?.focus();
      return;
    }
    // TODO(supabase): supabase.auth.signInWithPassword({ email, password }). Si el perfil es admin,
    // pedir el segundo factor (mfa.challenge) porque sus acciones exigen aal2.
    if (clave.length < 6) {
      setErrores({ general: ERROR_CREDENCIALES });
      setClave("");
      campoClave.current?.focus();
      return;
    }
    if (email.trim().toLowerCase().startsWith("admin")) {
      irA("codigo");
      return;
    }
    setErrores({});
    setEnviando(true);
    router.push("/s");
  }

  function escribirCodigo(i: number, valor: string) {
    const digitos = valor.replace(/\D/g, "");
    const nuevo = [...codigo];
    if (!digitos) {
      nuevo[i] = "";
      setCodigo(nuevo);
      return;
    }
    // Un número, o varios si se pegó el código o lo completó el celular
    for (let k = 0; k < digitos.length && i + k < 6; k++) nuevo[i + k] = digitos[k];
    setCodigo(nuevo);
    if (errores.codigo) setErrores({});
    casillas.current[Math.min(i + digitos.length, 5)]?.focus();
  }

  function teclaCodigo(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codigo[i] && i > 0) {
      e.preventDefault();
      const nuevo = [...codigo];
      nuevo[i - 1] = "";
      setCodigo(nuevo);
      casillas.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) casillas.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) casillas.current[i + 1]?.focus();
  }

  function verificar(e: FormEvent) {
    e.preventDefault();
    const c = codigo.join("");
    if (c.length < 6) {
      setErrores({ codigo: `Faltan ${6 - c.length === 1 ? "1 número" : `${6 - c.length} números`}: el código tiene 6.` });
      casillas.current[c.length]?.focus();
      return;
    }
    // TODO(supabase): supabase.auth.mfa.challengeAndVerify({ factorId, code }) para pasar a aal2.
    if (c === "000000") {
      setErrores({ codigo: "El código no coincide o ya cambió. Escribí el que aparece ahora en la app." });
      setCodigo(Array(6).fill(""));
      casillas.current[0]?.focus();
      return;
    }
    setEnviando(true);
    router.push("/s");
  }

  function recuperar(e: FormEvent) {
    e.preventDefault();
    const error = validarEmail();
    if (error) {
      setErrores({ email: error });
      campoEmail.current?.focus();
      return;
    }
    // TODO(supabase): supabase.auth.resetPasswordForEmail(email, { redirectTo: "/auth/confirm" }).
    // La respuesta es siempre la misma, exista o no el email.
    irA("recuperado");
  }

  const campoEmailJsx = (
    <Campo id="email" rotulo="Email" error={errores.email}>
      <input
        ref={campoEmail}
        id="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!!errores.email}
        aria-describedby={errores.email ? "email-error" : undefined}
        placeholder="nombre@scp.com.ar"
        className={cx(CLASE_CAMPO, errores.email ? "border-rojo" : "border-borde")}
      />
    </Campo>
  );

  // ——— Código de la app de autenticación (admin) ———
  if (paso === "codigo") {
    return (
      <form onSubmit={verificar} noValidate>
        <h1 ref={titulo} tabIndex={-1} className="titulo text-[28px] outline-none">
          Código de la app de autenticación
        </h1>
        <p className="mt-2 text-cemento">
          Abrí la app de autenticación del celular y escribí el código de 6 números que aparece para SCP.
        </p>
        <p className="mt-1 text-sm text-cemento">
          Entrás como <span className="font-medium text-tinta [overflow-wrap:anywhere]">{email}</span>
        </p>

        <fieldset className="mt-6">
          <legend className="mb-2 font-semibold">Código</legend>
          <div className="flex gap-2">
            {codigo.map((n, i) => (
              <input
                key={i}
                ref={(el) => {
                  casillas.current[i] = el;
                }}
                value={n}
                onChange={(e) => escribirCodigo(i, e.target.value)}
                onKeyDown={(e) => teclaCodigo(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                pattern="[0-9]*"
                aria-label={`Número ${i + 1} de 6`}
                aria-invalid={!!errores.codigo}
                aria-describedby={errores.codigo ? "codigo-error" : undefined}
                className={cx(
                  "cifra size-12 rounded-[var(--radius-boton)] border bg-papel text-center text-2xl sm:size-14",
                  i === 3 && "ml-2",
                  errores.codigo ? "border-rojo" : n ? "border-tinta" : "border-borde",
                )}
              />
            ))}
          </div>
          {errores.codigo && (
            <p id="codigo-error" role="alert" className="mt-2 text-sm font-medium text-rojo">
              {errores.codigo}
            </p>
          )}
        </fieldset>

        <Boton type="submit" ancho className="mt-6" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Boton>
        <Boton
          type="button"
          variante="fantasma"
          ancho
          className="mt-2"
          onClick={() => {
            setCodigo(Array(6).fill(""));
            setClave("");
            irA("credenciales");
          }}
        >
          Entrar con otra cuenta
        </Boton>
      </form>
    );
  }

  // ——— Olvidé mi contraseña ———
  if (paso === "recuperar") {
    return (
      <form onSubmit={recuperar} noValidate>
        <h1 ref={titulo} tabIndex={-1} className="titulo text-[28px] outline-none">
          Olvidé mi contraseña
        </h1>
        <p className="mt-2 text-cemento">Escribí tu email y te mandamos un link para crear una contraseña nueva.</p>
        <div className="mt-6">{campoEmailJsx}</div>
        <Boton type="submit" ancho className="mt-6">
          Mandar link
        </Boton>
        <Boton type="button" variante="fantasma" ancho className="mt-2" onClick={() => irA("credenciales")}>
          Volver
        </Boton>
      </form>
    );
  }

  if (paso === "recuperado") {
    return (
      <div>
        <h1 ref={titulo} tabIndex={-1} className="titulo text-[28px] outline-none">
          Revisá tu email
        </h1>
        <p className="mt-2" role="status">
          Si <span className="font-medium [overflow-wrap:anywhere]">{email}</span> tiene una cuenta en SCP, te mandamos un link para
          crear una contraseña nueva. Puede tardar unos minutos: mirá también en el correo no deseado.
        </p>
        <Boton type="button" variante="secundario" ancho className="mt-6" onClick={() => irA("credenciales")}>
          Volver a entrar
        </Boton>
      </div>
    );
  }

  // ——— Email y contraseña ———
  return (
    <form onSubmit={entrar} noValidate>
      <h1 ref={titulo} tabIndex={-1} className="titulo text-[28px] outline-none">
        Entrá con tu cuenta
      </h1>

      {errores.general && (
        <div className="mt-5">
          <ErrorGeneral>
            <p className="font-semibold">{errores.general}</p>
            <p className="mt-0.5 text-cemento">Revisá que estén bien escritos o pedí una contraseña nueva.</p>
          </ErrorGeneral>
        </div>
      )}

      <div className="mt-6 grid gap-5">
        {campoEmailJsx}

        <Campo id="clave" rotulo="Contraseña" error={errores.clave}>
          <div className="relative">
            <input
              ref={campoClave}
              id="clave"
              type={verClave ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              aria-invalid={!!errores.clave}
              aria-describedby={errores.clave ? "clave-error" : undefined}
              className={cx(CLASE_CAMPO, "pr-24", errores.clave ? "border-rojo" : "border-borde")}
            />
            <button
              type="button"
              onClick={() => setVerClave(!verClave)}
              aria-controls="clave"
              className="absolute inset-y-1 right-1 rounded-[2px] px-3 text-sm font-medium text-cemento hover:bg-yeso hover:text-tinta"
            >
              {verClave ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </Campo>
      </div>

      <Boton type="submit" ancho className="mt-6" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Boton>

      <button
        type="button"
        onClick={() => irA("recuperar")}
        className="mt-2 inline-flex min-h-12 items-center rounded-[var(--radius-boton)] font-medium underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
      >
        Olvidé mi contraseña
      </button>
    </form>
  );
}
