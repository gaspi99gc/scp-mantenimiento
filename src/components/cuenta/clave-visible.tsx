"use client";

// Campo de contraseña con el botón "Mostrar / Ocultar" adentro.

import { useState } from "react";
import { cx } from "@/components/ui";
import { CLASE_CAMPO } from "./campos";

export function ClaveVisible({
  id,
  name,
  autoComplete,
  invalida,
  describedBy,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  invalida?: boolean;
  describedBy?: string;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={ver ? "text" : "password"}
        autoComplete={autoComplete}
        required
        aria-invalid={invalida || undefined}
        aria-describedby={describedBy}
        className={cx(CLASE_CAMPO, "pr-24", invalida ? "border-rojo" : "border-borde")}
      />
      <button
        type="button"
        onClick={() => setVer(!ver)}
        aria-controls={id}
        aria-pressed={ver}
        className="absolute inset-y-1 right-1 rounded-[2px] px-3 text-sm font-medium text-cemento hover:bg-yeso hover:text-tinta"
      >
        {ver ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
