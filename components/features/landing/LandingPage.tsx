"use client";

// ────────────────────────────────────────────────────────────────────────────
// Landing page — refonte « billet ».
//
// Direction visuelle : l'ensemble de la page évoque l'univers du billet de
// spectacle (talons, perforations, codes). Éléments retirés car « cliché IA » :
// badge-pilule arrondi teinté, hero symétrique centré, cartes de fonctionnalités
// en boîtes arrondies avec ombre. Remplacés par : une étiquette « talon »
// (Eyebrow), un hero asymétrique, un mockup de billet avec talon détachable et
// perforations pointillées, une section sombre en contraste, des fonctionnalités
// séparées par des filets pointillés.
// ────────────────────────────────────────────────────────────────────────────

import {
  ArrowRight,
  Check,
  QrCode,
  SecurityPass,
  ShieldCheck,
  SmartphoneDevice,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

interface LandingPageProps {
  onGetStarted: () => void;
  onCheckout?: () => void;
}

export function LandingPage({ onGetStarted, onCheckout }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-background">
      {/* ── HERO (asymétrique) ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Trame de points subtile en fond : rappelle la perforation du billet */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:26px_26px] opacity-70"
        />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <Eyebrow>Billetterie sécurisée en RDC</Eyebrow>
            <h1 className="mt-6 max-w-2xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              La billetterie intelligente pour vos événements en{" "}
              <span className="text-cyan-500">RDC</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              Créez, vendez et contrôlez vos billets numériques depuis une seule
              plateforme. Simple pour vos invités, rapide pour vos équipes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" onClick={onGetStarted}>
                Créer un événement <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onCheckout}>
                Voir un événement
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-500" />
                Sans installation
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-500" />
                Contrôle en moins de 3 s
              </span>
            </div>
          </div>

          {/* Mockup de billet : talon détachable + perforations pointillées */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-2xl border border-dashed border-cyan-500/40"
            />
            <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/25">
              {/* Talon supérieur */}
              <div className="flex items-center justify-between border-b border-dashed border-white/15 px-6 py-4 sm:px-8">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                  Kin Pass
                </span>
                <SecurityPass className="h-5 w-5 text-cyan-400" />
              </div>
              {/* Corps du billet */}
              <div className="px-6 py-8 sm:px-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Événement à Kinshasa
                </p>
                <h2 className="mt-3 text-3xl font-bold">Kin House</h2>
                <p className="mt-2 text-slate-400">
                  Open Studio · 20 septembre · 19h00
                </p>
              </div>
              {/* Talon détachable (code + QR) */}
              <div className="flex items-end justify-between border-t border-dashed border-white/15 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Billet VIP
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold text-cyan-400">
                    50 $
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tracking-[0.2em] text-slate-400">
                    A4B-8K9
                  </span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white">
                    <QrCode className="h-10 w-10 text-slate-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS (section sombre en contraste) ──────────────────── */}
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="max-w-xl">
            <Eyebrow className="text-cyan-400">Tout ce qu’il vous faut</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Une entrée fluide, du paiement au contrôle.
            </h2>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
            <Feature
              icon={QrCode}
              title="Scan QR instantané"
              text="Validez chaque billet à la porte avec la caméra du smartphone."
            />
            <Feature
              icon={ShieldCheck}
              title="Code de secours"
              text="Un code alphanumérique de 6 caractères pour ne jamais bloquer l'entrée."
            />
            <Feature
              icon={SmartphoneDevice}
              title="Mobile Money"
              text="Acceptez M-Pesa, Orange Money et Airtel Money au même endroit."
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-dashed border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-semibold text-foreground">Kin Pass</span>
          <span>© 2026 Kin Pass. La billetterie pensée pour la RDC.</span>
          <div className="flex gap-4">
            <span>Confidentialité</span>
            <span>Assistance</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Fonctionnalité : colonne séparée par un filet pointillé vertical (talon),
// icône cyan dans un carré, titre fort. Aucun cadre de carte.
function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof QrCode;
  title: string;
  text: string;
}) {
  return (
    <div className="md:border-l md:border-dashed md:border-white/15 md:pl-8 md:first:border-l-0 md:first:pl-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
