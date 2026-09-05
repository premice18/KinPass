// ────────────────────────────────────────────────────────────────────────────
// Billet PDF (Phase 6.3) — rendu serveur via @react-pdf/renderer.
//
// Format « talon de billet » horizontal (700 × 340 pt) : zone blanche avec
// les infos (événement, date, lieu, type, acheteur) et talon sombre à droite
// portant le QR + le code 6 caractères.
//
// NB : l'arbre est construit avec `React.createElement` (pas de JSX) pour que
// ce module reste exécutable hors Next.js — le script de prévisualisation
// `scripts/preview-ticket.mts` l'importe directement.
// ────────────────────────────────────────────────────────────────────────────

import { createElement, type ReactElement } from 'react'
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'

import type { TicketArtwork } from './types'
import { qrPngDataUrl } from './qr'

// Construit le style via l'API du moteur (couleurs de la charte kinPass).
const styles = StyleSheet.create({
  page: {
    width: 700,
    height: 340,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  // ── Zone blanche : informations ─────────────────────────────────────────
  main: {
    flex: 1,
    padding: 28,
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#06B6D4',
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 1.15,
    marginBottom: 10,
  },
  meta: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.6,
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'dashed',
    paddingTop: 12,
  },
  label: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#0F172A',
  },
  // ── Talon sombre : QR + code ────────────────────────────────────────────
  stub: {
    width: 210,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  stubLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  code: {
    fontSize: 18,
    color: '#06B6D4',
    letterSpacing: 3,
    fontFamily: 'Courier-Bold',
    marginBottom: 16,
  },
  qrBox: {
    width: 150,
    height: 150,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 138,
    height: 138,
  },
  stubFootnote: {
    marginTop: 14,
    fontSize: 7,
    letterSpacing: 1,
    color: '#64748B',
    textAlign: 'center',
  },
})

// createElement « assoupli » : les types react-pdf (classes) sont trop stricts
// pour un arbre construit dynamiquement — la vérification reste assurée sur
// les données d'entrée (TicketArtwork) et à la frontière de renderToBuffer.
const h = createElement as (
  type: unknown,
  props: object | null,
  ...children: unknown[]
) => ReactElement

// Petit helper : crée un élément React avec des enfants optionnels.
function el(type: unknown, props: object | null, ...children: unknown[]): ReactElement {
  return h(type, props, ...children)
}

// Génère le PDF du billet (buffer prêt à être envoyé/téléchargé).
export async function buildTicketPdf(artwork: TicketArtwork): Promise<Uint8Array> {
  const qr = await qrPngDataUrl(artwork.qrValue ?? artwork.code)

  const document = el(
    Document,
    { author: 'kinPass', title: `Billet — ${artwork.eventTitle}`, creator: 'kinPass' },
    el(
      Page,
      { size: [700, 340], style: styles.page },
      // Zone blanche : informations
      el(
        View,
        { style: styles.main },
        el(View, null, el(Text, { style: styles.eyebrow }, 'kinPass — billet numérique')),
        el(View, null, el(Text, { style: styles.title }, artwork.eventTitle)),
        el(Text, { style: styles.meta }, [artwork.eventDateLabel, artwork.venue].filter(Boolean).join('\n')),
        el(
          View,
          { style: styles.buyerRow },
          el(
            View,
            null,
            el(Text, { style: styles.label }, 'Billet'),
            el(Text, { style: styles.value }, artwork.ticketTypeName),
          ),
          el(
            View,
            null,
            el(Text, { style: styles.label }, 'Acheteur'),
            el(Text, { style: styles.value }, artwork.buyerName),
          ),
        ),
      ),
      // Talon sombre : QR + code
      el(
        View,
        { style: styles.stub },
        el(Text, { style: styles.stubLabel }, 'Code d’accès'),
        el(Text, { style: styles.code }, artwork.code),
        el(View, { style: styles.qrBox }, el(Image, { src: qr, style: styles.qrImage })),
        el(Text, { style: styles.stubFootnote }, 'Scannez ce QR ou saisissez le code à l’entrée'),
      ),
    ),
  )

  const buffer = await renderToBuffer(document as Parameters<typeof renderToBuffer>[0])
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}
