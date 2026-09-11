"use client";

// ────────────────────────────────────────────────────────────────────────────
// Landing page — enrichissement visuel & animations.
//
// Ajouts par rapport à la version précédente :
// - Image de fond Pexels (via le proxy `/api/pexels`) derrière le hero, avec
//   un voile de lisibilité ; si l'API échoue ou qu'aucune clé n'est fournie,
//   la page conserve son fond « trame de points ».
// - Animations Framer Motion (`FadeIn`) au scroll, respectueuses de
//   `prefers-reduced-motion`.
// - Section « Comment ça marche » (séquence réelle 01→02→03) avec une
//   illustration SVG de marque (`public/illustrations/digital-ticket.svg`).
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  QrCode,
  SecurityPass,
  ShieldCheck,
  SmartphoneDevice,
} from 'iconoir-react'
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FadeIn } from "@/components/ui/motion";
import { usePexelsImages } from "@/lib/hooks/use-pexels-images";
import { EventCard } from '@/components/features/events/EventCard'
import { EventTicker } from '@/components/features/landing/EventTicker'
import { getPublicEvents, type PublicEventCard } from '@/lib/actions/events'

interface LandingPageProps {
  onGetStarted: () => void;
  // Ouvre la rubrique « Billetterie » (listing des événements à venir).
  onBrowse: () => void;
}

export function LandingPage({ onGetStarted, onBrowse }: LandingPageProps) {
  // Photo de couverture pour le hero (retombe sur le fond de points si vide).
  const { images: heroImages } = usePexelsImages("concert crowd", 3);
  const heroImage = heroImages[0];

  // Bandeau « Événements à venir » : 3 événements publiés max (Phase 9.2).
  // Section masquée tant que la liste n'est pas chargée (pas d'à-coup) et
  // entièrement cachée si aucun événement publié n'est à venir.
  const [upcoming, setUpcoming] = useState<PublicEventCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicEvents({ limit: 3 })
      .then((result) => {
        if (!cancelled) setUpcoming(result.success ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setUpcoming([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* ── HERO (asymétrique + fond photo optionnel) ──────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Image de fond Pexels, voilée pour la lisibilité du texte */}
        {heroImage && (
          <div aria-hidden="true" className="absolute inset-0">
            <img
              src={heroImage.src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-background/80 dark:bg-background/85" />
          </div>
        )}

        {/* Trame de points subtile en fond : rappelle la perforation du billet */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:26px_26px] opacity-70"
        />
        {/* Peek mobile : le hero est compact (py-14) pour que le bandeau
            défilant (EventTicker) affleure la ligne de flottaison — coupé en
            bas du premier écran, son mouvement invite au scroll sans voler
            la vedette au message principal (cf. analyse UI/UX). */}
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-8 sm:gap-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <FadeIn>
            <div>
              <Eyebrow>Billetterie sécurisée en RDC</Eyebrow>
              <h1 className="mt-6 max-w-2xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                La billetterie intelligente pour vos événements en{" "}
                <span className="text-cyan-500">RDC</span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                Créez, vendez et contrôlez vos billets numériques depuis une
                seule plateforme. Simple pour vos invités, rapide pour vos
                équipes.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="lg" onClick={onGetStarted}>
                  Créer un événement <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onBrowse}>
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
          </FadeIn>

          {/* Mockup de billet : talon détachable + perforations pointillées */}
          <FadeIn delay={0.15}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-2xl border border-dashed border-cyan-500/40"
              />
              <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/25">
                {/* Talon supérieur */}
                <div className="flex items-center justify-between border-b border-dashed border-white/15 px-6 py-4 sm:px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                      kinPass
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
                {/* Talon détachable (code + QR) — retour à la ligne si étroit */}
                <div className="flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-white/15 px-6 py-5 sm:px-8">
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
          </FadeIn>
        </div>
      </section>

      {/* ── BANDEAU DÉFILANT (teaser « à la une », Proposition UI) ──────────
          Défile sous le hero dès qu'il y a des événements : attire l'œil sans
          scroll et pousse à découvrir le bandeau « À venir » plus bas. */}
      {upcoming && upcoming.length > 0 && <EventTicker events={upcoming} />}

      {/* ── ÉVÉNEMENTS À VENIR (bandeau découverte, Phase 9.2) ───────────── */}
      {upcoming && upcoming.length > 0 && (
        <section
          aria-label="Événements à venir"
          className="border-b border-dashed border-border bg-card/40"
          data-testid="upcoming-events"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
            <FadeIn>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>À venir</Eyebrow>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    Événements à venir
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Réservez votre place dès maintenant.
                  </p>
                </div>
                <Button variant="ghost" onClick={onBrowse}>
                  Voir tous les événements
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeIn>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, index) => {
                // Couverture de repli Pexels (héro) si l'événement n'a pas d'affiche.
                const fallback = heroImages[index % Math.max(heroImages.length, 1)]
                return (
                  <FadeIn key={event.id} delay={Math.min(index * 0.08, 0.24)}>
                    <EventCard
                      event={event}
                      coverUrl={event.posterUrl ? null : (fallback?.src ?? null)}
                      testId="public-event-card"
                    />
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── COMMENT ÇA MARCHE (séquence 01 → 02 → 03) ─────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <FadeIn>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Illustration SVG de marque (aucune image IA) */}
            <img
              src="/illustrations/digital-ticket.svg"
              alt="Billet numérique kinPass sur téléphone"
              className="mx-auto w-full max-w-sm"
              loading="lazy"
            />
            <div>
              <Eyebrow>Comment ça marche</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Du clic à l’entrée, en trois étapes.
              </h2>
              <ol className="mt-8 space-y-6">
                <Step
                  n="01"
                  title="Créez votre événement"
                  text="Configurez vos billets et publiez votre page en quelques minutes."
                />
                <Step
                  n="02"
                  title="Vendez et recevez"
                  text="Vos invités paient en Mobile Money et reçoivent leur billet numérique."
                />
                <Step
                  n="03"
                  title="Contrôlez l’entrée"
                  text="Vos équipes scannent les billets à la porte, sans file d’attente."
                />
              </ol>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FONCTIONNALITÉS (section sombre en contraste) ──────────────────── */}
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <FadeIn>
            <div className="max-w-xl">
              <Eyebrow className="text-cyan-400">Tout ce qu’il vous faut</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Une entrée fluide, du paiement au contrôle.
              </h2>
            </div>
          </FadeIn>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
            <FadeIn delay={0}>
              <Feature
                icon={QrCode}
                title="Scan QR instantané"
                text="Validez chaque billet à la porte avec la caméra du smartphone."
              />
            </FadeIn>
            <FadeIn delay={0.1}>
              <Feature
                icon={ShieldCheck}
                title="Code de secours"
                text="Un code alphanumérique de 6 caractères pour ne jamais bloquer l'entrée."
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <Feature
                icon={SmartphoneDevice}
                title="Mobile Money"
                text="Acceptez M-Pesa, Orange Money et Airtel Money au même endroit."
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-dashed border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-semibold text-foreground">kinPass</span>
          <span>© 2026 kinPass. La billetterie pensée pour la RDC.</span>
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/legal/cgu" className="hover:text-foreground">
              Conditions d’utilisation
            </a>
            <a href="/legal/privacy" className="hover:text-foreground">
              Confidentialité
            </a>
            <a href="/legal/about" className="hover:text-foreground">
              À propos
            </a>
            <a href="/legal/contact" className="hover:text-foreground">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

// Étape numérotée de la section « Comment ça marche » (ordre porteur d'information).
function Step({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4 border-b border-dashed border-border pb-6 last:border-b-0 last:pb-0">
      <span className="font-mono text-sm font-semibold text-cyan-500">{n}</span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </li>
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
