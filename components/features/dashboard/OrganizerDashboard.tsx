"use client";

// ────────────────────────────────────────────────────────────────────────────
// Tableau de bord organisateur (Phase 5) — branché sur les données réelles
//
// - Charge les événements via la Server Action `getOrganizerEvents()` dans un
//   `useEffect` (la vue est un composant client à cause de la navigation par
//   état dans KinPassApp ; un futur composant serveur pourra fournir les
//   données en props).
// - KPIs calculés depuis les agrégations serveur : revenus (USD/CDF), billets
//   vendus, taux de remplissage, personnes entrées (scans).
// - Liste des événements : statut (Brouillon/Publié/Terminé), progression des
//   ventes, actions Publier / Éditer / Supprimer (avec confirmation).
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Calendar,
  CardWallet,
  Clock,
  EditPencil,
  MapPin,
  Plus,
  Refresh,
  Scanning,
  Send,
  StatsReport,
  Trash,
  WarningCircle,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn, MotionCard } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { usePexelsImages } from "@/lib/hooks/use-pexels-images";
import {
  deleteEvent,
  getOrganizerEvents,
  publishEvent,
  type EventWithStats,
} from "@/lib/actions/events";

interface DashboardProps {
  // Navigation par état : ouvre le formulaire en mode création.
  onCreateEvent: () => void;
  // Navigation par état : ouvre le formulaire en mode édition (id).
  onEditEvent: (eventId: string) => void;
}

// Formate un montant avec des milliers à la française et la devise RDC.
function formatMoney(amount: number, currency: "USD" | "CDF"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return currency === "USD" ? `${formatted} $` : `${formatted} FC`;
}

// Formate une date au format français court (ex. « 20 sept. 2026 »).
function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Formate une heure au format français (ex. « 18:00 »).
function formatTime(value: Date | string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Libellé et variante de badge pour chaque statut d'événement.
const STATUS_META: Record<
  EventWithStats["status"],
  { label: string; badge: "secondary" | "success" | "default" }
> = {
  draft: { label: "Brouillon", badge: "secondary" },
  published: { label: "Publié", badge: "success" },
  finished: { label: "Terminé", badge: "default" },
};

export function OrganizerDashboard({
  onCreateEvent,
  onEditEvent,
}: DashboardProps) {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Identifiants d'événements en cours d'action (spinner sur le bouton).
  const [pendingPublishId, setPendingPublishId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Photos de couverture (Pexels) pour les cartes d'événements.
  // Une seule requête, images réparties sur les cartes ; fallback de marque sinon.
  const { images: coverImages } = usePexelsImages("concert crowd", 6);

  // Charge (ou recharge) la liste des événements depuis la base.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getOrganizerEvents();
    if (result.success) {
      setEvents(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Publication d'un événement (brouillon → publié).
  const handlePublish = async (event: EventWithStats) => {
    setPendingPublishId(event.id);
    const result = await publishEvent(event.id);
    setPendingPublishId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    // Mise à jour locale du statut sans recharger toute la liste.
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, status: "published" } : e)),
    );
  };

  // Suppression avec confirmation (MVP : window.confirm).
  const handleDelete = async (event: EventWithStats) => {
    const confirmed = window.confirm(
      `Supprimer « ${event.title} » ? Cette action est irréversible (billets et scans inclus).`,
    );
    if (!confirmed) return;

    setPendingDeleteId(event.id);
    const result = await deleteEvent(event.id);
    setPendingDeleteId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
  };

  // KPIs agrégés sur l'ensemble des événements de l'organisateur.
  const kpis = useMemo(() => {
    const revenueUSD = events.reduce((sum, e) => sum + e.revenueUSD, 0);
    const revenueCDF = events.reduce((sum, e) => sum + e.revenueCDF, 0);
    const soldCount = events.reduce((sum, e) => sum + e.soldCount, 0);
    const capacity = events.reduce((sum, e) => sum + (e.capacity ?? 0), 0);
    const scannedCount = events.reduce((sum, e) => sum + e.scannedCount, 0);
    return {
      revenueUSD,
      revenueCDF,
      soldCount,
      capacity,
      fillRate:
        capacity > 0
          ? Math.min(100, Math.round((soldCount / capacity) * 100))
          : 0,
      scannedCount,
      scannedRate:
        soldCount > 0 ? Math.round((scannedCount / soldCount) * 100) : 0,
    };
  }, [events]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* En-tête + bouton de création */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Eyebrow>ESPACE ORGANISATEUR</Eyebrow>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Tableau de bord
            </h1>
            <p className="mt-1 text-muted-foreground">
              Suivez vos événements et vos ventes en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              aria-label="Actualiser la liste"
            >
              <Refresh className="h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={onCreateEvent}>
              <Plus className="h-4 w-4" />
              Créer un événement
            </Button>
          </div>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <span className="flex items-center gap-2">
              <WarningCircle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            {/* Non connecté : inviter à se connecter pour voir ses événements */}
            {error.startsWith('Connexion requise') && (
              <a
                href="/auth/login"
                className="ml-auto rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium hover:bg-destructive/10"
              >
                Se connecter
              </a>
            )}
          </div>
        )}

        {/* KPIs calculés sur les données réelles */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={CardWallet}
            testId="kpi-revenue"
            label="Revenus totaux"
            value={formatMoney(kpis.revenueUSD, "USD")}
            detail={
              kpis.revenueCDF > 0
                ? `+ ${formatMoney(kpis.revenueCDF, "CDF")} en FC`
                : "Aucune vente en FC"
            }
          />
          <Stat
            icon={Barcode}
            testId="kpi-sold"
            label="Billets vendus"
            value={new Intl.NumberFormat("fr-FR").format(kpis.soldCount)}
            detail={
              kpis.capacity > 0
                ? `sur ${new Intl.NumberFormat("fr-FR").format(kpis.capacity)} disponibles`
                : "capacité non définie"
            }
          />
          <Stat
            icon={StatsReport}
            testId="kpi-fill-rate"
            label="Taux de remplissage"
            value={`${kpis.fillRate} %`}
            detail={
              kpis.capacity > 0
                ? `${new Intl.NumberFormat("fr-FR").format(kpis.soldCount)} / ${new Intl.NumberFormat("fr-FR").format(kpis.capacity)} places`
                : "capacité non définie"
            }
          />
          <Stat
            icon={Scanning}
            testId="kpi-scanned"
            label="Personnes entrées"
            value={new Intl.NumberFormat("fr-FR").format(kpis.scannedCount)}
            detail={`${kpis.scannedRate} % des ventes`}
          />
        </div>

        {/* Liste des événements */}
        <div className="mt-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Vos événements</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez vos événements actifs et à venir.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Refresh className="h-5 w-5 animate-spin" />
                Chargement de vos événements…
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            /* État vide : premier événement à créer (illustration de marque) */
            <EmptyState
              title="Aucun événement pour le moment"
              description="Créez votre premier événement pour commencer à vendre vos billets."
            >
              <Button onClick={onCreateEvent}>
                <Plus className="h-4 w-4" />
                Créer un événement
              </Button>
            </EmptyState>
          ) : (
            events.map((event, index) => {
              const status = STATUS_META[event.status];
              const progressWidth = Math.min(100, event.fillRate);
              // Couverture : image Pexels tournante, sinon placeholder de marque.
              const cover = coverImages[index % Math.max(coverImages.length, 1)];
              return (
                <FadeIn key={event.id} delay={Math.min(index * 0.05, 0.2)}>
                  <MotionCard className="rounded-lg border border-border bg-card text-card-foreground">
                    <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between" data-testid="event-card">
                    {/* Couverture + informations principales */}
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      {/* Photo de couverture (fallback : pictogramme catégorie) */}
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                        {cover ? (
                          <img
                            src={cover.src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Calendar className="h-6 w-6" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant={status.badge}>{status.label}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {event.startAt && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(event.startAt)}
                            </span>
                          )}
                          {event.startAt && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {formatTime(event.startAt)}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {event.venue || event.location || "Lieu à définir"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progression des ventes */}
                    <div className="w-full lg:w-56">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{event.soldCount} vendus</span>
                        <span>
                          {event.capacity != null
                            ? `sur ${event.capacity}`
                            : "capacité non définie"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            event.fillRate >= 100
                              ? "bg-emerald-500"
                              : "bg-primary",
                          )}
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions : publier / éditer / supprimer */}
                    <div className="flex items-center gap-2">
                      {event.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(event)}
                          disabled={pendingPublishId === event.id}
                        >
                          {pendingPublishId === event.id ? (
                            <Refresh className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Publier
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => onEditEvent(event.id)}
                        aria-label={`Modifier ${event.title}`}
                      >
                        <EditPencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(event)}
                        disabled={pendingDeleteId === event.id}
                        aria-label={`Supprimer ${event.title}`}
                      >
                        {pendingDeleteId === event.id ? (
                          <Refresh className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    </CardContent>
                  </MotionCard>
                </FadeIn>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

// Carte KPI : barre latérale d'accent cyan, libellé en petites capitales,
// valeur en chiffres tabulaires (alignement stable). `testId` expose un
// identifiant stable pour les tests end-to-end (Playwright).
function Stat({
  icon: Icon,
  label,
  value,
  detail,
  testId,
}: {
  icon: typeof CardWallet;
  label: string;
  value: string;
  detail: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="relative overflow-hidden rounded-lg border border-border bg-card p-5"
    >
      {/* Barre d'accent latérale (rappel du talon de billet) */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-cyan-500"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-5 w-5 text-cyan-500" />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
