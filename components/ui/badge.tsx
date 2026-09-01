import * as React from "react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Badge « talon de billet ».
//
// Refonte anti-« cliché IA » : l'ancien badge était une pilule arrondie
// (rounded-full + fond teinté léger + bordure), motif très répandu dans les
// interfaces générées. Le nouveau badge est angulaire (angle très faible),
// en petites capitales espacées, avec une barre latérale gauche colorée —
// un rappel du « talon » détachable d'un billet.
// ────────────────────────────────────────────────────────────────────────────
export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive";
}) {
  const variants = {
    default: "border-primary bg-primary/10 text-primary",
    secondary:
      "border-muted-foreground/40 bg-secondary text-secondary-foreground",
    success: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    destructive: "border-destructive bg-destructive/10 text-destructive",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[3px] border-l-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
