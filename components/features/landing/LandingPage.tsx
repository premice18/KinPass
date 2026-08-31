"use client";

import {
  ArrowRight,
  Check,
  QrCode,
  SecurityPass,
  ShieldCheck,
  SmartphoneDevice,
} from "iconoir-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
  onCheckout?: () => void;
}

export function LandingPage({ onGetStarted, onCheckout }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            Billetterie sécurisée en RDC
          </div>
          <h1 className="max-w-2xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            La billetterie intelligente pour vos événements en RDC
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
            Créez, vendez et contrôlez vos billets numériques depuis une seule
            plateforme. Simple pour vos invités, rapide pour vos équipes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={onGetStarted}>
              Créer un événement <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onCheckout}>
              Voir un événement
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Sans installation
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Contrôle en moins de 3 s
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-300">
                KIN PASS
              </span>
              <SecurityPass className="h-5 w-5 text-blue-300" />
            </div>
            <div className="mt-16">
              <p className="text-sm text-slate-400">ÉVÉNEMENT À KINSHASA</p>
              <h2 className="mt-2 text-3xl font-semibold">Kin House</h2>
              <p className="mt-2 text-slate-300">Open Studio · 20 septembre</p>
            </div>
            <div className="mt-10 flex items-end justify-between border-t border-slate-700 pt-5">
              <div>
                <p className="text-xs text-slate-400">BILLET VIP</p>
                <p className="mt-1 text-xl font-semibold">50 $</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white">
                <QrCode className="h-12 w-12 text-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">
              TOUT CE QU’IL VOUS FAUT
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Une entrée fluide, du paiement au contrôle.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
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
      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-semibold text-foreground">Kin Pass</span>
        <span>© 2026 Kin Pass. La billetterie pensée pour la RDC.</span>
        <div className="flex gap-4">
          <span>Confidentialité</span>
          <span>Assistance</span>
        </div>
      </footer>
    </main>
  );
}
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
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
