import * as React from "react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Eyebrow — étiquette de section « talon de billet ».
//
// Remplace les anciennes étiquettes de section (pilule arrondie teintée ou
// simple libellé `text-primary`). Rendu : une petite règle horizontale suivie
// d'un texte en petites capitales espacées, coloré en cyan (Flash Cyan, la
// couleur d'accent de la charte). Cohérent sur toutes les vues.
// ────────────────────────────────────────────────────────────────────────────
export function Eyebrow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="h-px w-6 bg-current" />
      {children}
    </span>
  );
}
