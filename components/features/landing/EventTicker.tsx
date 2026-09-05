// ────────────────────────────────────────────────────────────────────────────
// Bandeau défilant « Événements à venir » — landing (Proposition UI validée).
//
// Un marquee doux sous le hero : les événements défilent sans interruption,
// attirant le regard même sans scroll (social proof immédiate) et invitant à
// découvrir le bandeau complet plus bas. Volontairement DISCRET :
//   - contenu compact (pastille de date + titre + prix), hauteur réduite ;
//   - vitesse lente (55 s par boucle) ;
//   - pause au survol / au focus (règles UI/UX : auto-rotating content) ;
//   - `prefers-reduced-motion` respecté : animation coupée, liste statique
//     scrollable, moitié dupliquée masquée (accessibilité).
// La moitié « fantôme » sert uniquement à la boucle sans couture (aria-hidden).
// ────────────────────────────────────────────────────────────────────────────

import type { PublicEventCard } from '@/lib/actions/events'

interface EventTickerProps {
  events: PublicEventCard[]
}

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function formatPrice(price: number, currency: string): string {
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price)
  return currency === 'CDF' ? `${amount} FC` : `${amount} $`
}

// Pastille date (jour + mois) + titre + prix — format compact du ticker.
function TickerItem({ event }: { event: PublicEventCard }) {
  const date = event.startAt ? new Date(event.startAt) : null
  return (
    <a
      href={`/e/${event.slug}`}
      className="flex shrink-0 items-center gap-3 rounded-[3px] border border-border bg-background/80 py-1.5 pl-1.5 pr-3 transition-colors hover:border-cyan-500/60 hover:bg-background"
    >
      {date && (
        <span className="flex flex-col items-center justify-center rounded-[3px] bg-slate-950 px-1.5 py-0.5 text-white dark:bg-muted">
          <span className="text-xs font-bold leading-none tabular-nums">{date.getDate()}</span>
          <span className="text-[9px] font-semibold uppercase leading-tight text-cyan-400">
            {MONTHS_FR[date.getMonth()]}
          </span>
        </span>
      )}
      <span className="max-w-44 truncate text-sm font-medium sm:max-w-56">{event.title}</span>
      {event.isFree ? (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Entrée libre</span>
      ) : event.minPrice != null ? (
        <span className="font-mono text-xs font-semibold tabular-nums text-cyan-600 dark:text-cyan-400">
          {formatPrice(event.minPrice, event.minPriceCurrency ?? 'USD')}
        </span>
      ) : null}
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-cyan-500/50" />
    </a>
  )
}

export function EventTicker({ events }: EventTickerProps) {
  if (events.length === 0) return null

  // Répétition pour que chaque moitié dépasse la largeur du viewport desktop
  // (boucle sans couture, sans trou à droite).
  const repeats = events.length <= 3 ? 3 : 2
  const items = Array.from({ length: repeats }, (_, r) => events).flat()

  return (
    <section
      aria-label="Événements à venir — bandeau défilant"
      data-testid="event-ticker"
      className="kinpass-ticker border-b border-dashed border-border bg-muted/30 py-3"
    >
      <div className="kinpass-ticker-track">
        {/* Deux moitiés identiques pour une boucle sans couture */}
        {[false, true].map((isGhost) => (
          <div
            key={isGhost ? 'ghost' : 'live'}
            aria-hidden={isGhost}
            className="kinpass-ticker-half flex shrink-0 items-center gap-3 pr-3"
          >
            {items.map((event, index) => (
              <TickerItem key={`${event.id}-${index}`} event={event} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
