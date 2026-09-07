'use client'

// ────────────────────────────────────────────────────────────────────────────
// Équipe / Scanneurs (Phase 7.1) — gestion des agents de contrôle.
//
// L'organisateur : crée des agents (nom + mot de passe — l'EMAIL est
// auto-généré `{slug}-{n}@kinpass.com`, jamais saisi), les assigne à ses
// événements, les suspend/réactive, réinitialise leur mot de passe et les
// supprime. Aucun agent ne peut se créer lui-même.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState, useTransition } from 'react'
import { ArrowLeft, Check, Copy, InfoCircle, Plus, Refresh, Trash, UserPlus, WarningCircle, Whatsapp, Xmark } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  assignAgentToEvent,
  createAgent,
  deleteAgent,
  getAgentScans,
  getTeam,
  resetAgentPassword,
  setAgentActive,
  unassignAgentFromEvent,
  type AgentScanLog,
  type TeamAgent,
} from '@/lib/actions/team'
import { getOrganizerEvents, type EventWithStats } from '@/lib/actions/events'
import { cn } from '@/lib/utils'

interface TeamScannersProps {
  onBack: () => void
}

const fieldClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function TeamScanners({ onBack }: TeamScannersProps) {
  const [agents, setAgents] = useState<TeamAgent[]>([])
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Formulaire de création (nom + événements — identifiants auto-générés).
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Identifiants du compte VENANT d'être créé — affichés UNE SEULE fois pour
  // transmission à l'agent (le mot de passe n'existe qu'en mémoire client).
  const [createdCreds, setCreatedCreds] = useState<{ fullName: string; email: string; password: string } | null>(null)
  const [copiedCreds, setCopiedCreds] = useState(false)
  // Origine du site (uniquement côté navigateur — lien WhatsApp pré-rempli).
  const [origin, setOrigin] = useState('')
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // Nouveau mot de passe généré lors d'une réinitialisation (affichage unique,
  // par ligne).
  const [resetCreds, setResetCreds] = useState<{ agentId: string; fullName: string; email: string; password: string } | null>(null)
  const [copyingReset, setCopyingReset] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [teamResult, eventsResult] = await Promise.all([getTeam(), getOrganizerEvents()])
    if (teamResult.success) setAgents(teamResult.data)
    else setError(teamResult.error)
    if (eventsResult.success) setEvents(eventsResult.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Création d'un agent (email + mot de passe auto-générés côté serveur).
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createAgent({ name, eventIds: [...selectedIds] })
      if (!result.success) {
        setError(result.error)
        return
      }
      const { agent, passwordOnce } = result.data
      setAgents((prev) => [...prev, agent])
      // Panneau de transmission des identifiants (une seule fois).
      setCreatedCreds({ fullName: agent.fullName, email: agent.email, password: passwordOnce })
      // Retour à la liste + réinitialisation du formulaire.
      setCreating(false)
      setName('')
      setSelectedIds(new Set())
    })
  }

  // Copie des identifiants prêts à transmettre (bloc texte complet).
  const copyCredentials = async () => {
    if (!createdCreds) return
    const loginUrl = `${window.location.origin}/auth/login`
    const text = [
      `kinPass — identifiants de contrôle pour ${createdCreds.fullName}`,
      `Adresse de connexion : ${createdCreds.email}`,
      `Mot de passe : ${createdCreds.password}`,
      `Page de connexion : ${loginUrl}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCreds(true)
      window.setTimeout(() => setCopiedCreds(false), 2500)
    } catch {
      // Presse-papiers indisponible : l'utilisateur peut copier manuellement.
    }
  }

  // Actions par ligne.
  const toggleActive = async (agent: TeamAgent) => {
    const result = await setAgentActive(agent.id, !agent.active)
    if (result.success) setAgents((prev) => prev.map((a) => (a.id === agent.id ? result.data : a)))
  }

  // Réinitialisation : un NOUVEAU mot de passe est généré côté serveur et
  // affiché une seule fois (le précédent devient inutilisable immédiatement).
  const handleReset = async (agent: TeamAgent) => {
    setError('')
    const result = await resetAgentPassword(agent.id)
    if (result.success) {
      setResetCreds({ agentId: agent.id, fullName: agent.fullName, email: agent.email, password: result.data.passwordOnce })
    } else {
      setError(result.error)
    }
  }

  // Copie du mot de passe régénéré (bloc complet prêt à transmettre).
  const copyResetCreds = async () => {
    if (!resetCreds) return
    const text = [
      `kinPass — identifiants de contrôle pour ${resetCreds.fullName}`,
      `Adresse de connexion : ${resetCreds.email}`,
      `Mot de passe : ${resetCreds.password}`,
      `Page de connexion : ${origin || 'http://localhost:3000'}/auth/login`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyingReset(true)
      window.setTimeout(() => setCopyingReset(false), 2500)
    } catch {
      // Silencieux : copie manuelle possible.
    }
  }

  const handleDelete = async (agent: TeamAgent) => {
    const confirmed = window.confirm(
      `Supprimer le compte « ${agent.fullName} » (${agent.email}) ? Son historique de scans est conservé, le compte sera définitivement retiré.`,
    )
    if (!confirmed) return
    const result = await deleteAgent(agent.id)
    if (result.success) setAgents((prev) => prev.filter((a) => a.id !== agent.id))
  }

  // Assignation depuis la liste des événements NON encore assignés.
  const assignableEvents = (agent: TeamAgent) =>
    events.filter((event) => !agent.events.some((access) => access.id === event.id))

  const handleAssign = async (agentId: string, eventId: string) => {
    const result = await assignAgentToEvent(agentId, eventId)
    if (result.success) setAgents((prev) => prev.map((a) => (a.id === agentId ? result.data : a)))
  }

  const handleUnassign = async (agentId: string, eventId: string) => {
    const result = await unassignAgentFromEvent(agentId, eventId)
    if (result.success) setAgents((prev) => prev.map((a) => (a.id === agentId ? result.data : a)))
  }

  // Journal des scans d'un agent (vue organisateur, Phase 7.3).
  const [scansOpenAgentId, setScansOpenAgentId] = useState<string | null>(null)
  const [agentScans, setAgentScans] = useState<AgentScanLog[] | null>(null)

  const toggleAgentScans = async (agent: TeamAgent) => {
    if (scansOpenAgentId === agent.id) {
      setScansOpenAgentId(null)
      setAgentScans(null)
      return
    }
    const result = await getAgentScans(agent.id)
    if (result.success) {
      setAgentScans(result.data)
      setScansOpenAgentId(agent.id)
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Équipe / Scanneurs</Eyebrow>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Agents de contrôle</h1>
            <p className="mt-1 text-muted-foreground">
              Créez les comptes de vos équipes à la porte — chacun n'accède qu'aux événements
              assignés, jamais à vos ventes.
            </p>
          </div>
          <Button onClick={() => setCreating((value) => !value)} data-testid="team-create-button">
            {creating ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Ajouter un scanneur
              </>
            )}
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <WarningCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Formulaire de création ─────────────────────────────────────── */}
        {creating && (
          <Card className="mt-6" data-testid="team-create-form">
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="max-w-sm">
                  <label className="block space-y-2 text-sm font-medium">
                    Nom de l'agent
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex. Contrôle porte A"
                      data-testid="team-create-name"
                      aria-required="true"
                    />
                  </label>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <InfoCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Son mot de passe (8 caractères, majuscules et chiffres) sera généré
                    automatiquement et affiché une seule fois après la création.
                  </p>
                </div>

                {/* Événements à assigner (les siens uniquement) */}
                <fieldset>
                  <legend className="text-sm font-medium">
                    Événements où ce scanneur pourra contrôler les billets
                  </legend>

                  {/* Explication « non développeur » de l'email auto-généré */}
                  <p className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <InfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                    <span>
                      <strong className="font-medium text-foreground">Son adresse de connexion est créée automatiquement</strong>{' '}
                      (ex. <span className="font-mono">mon-evenement-01@kinpass.com</span>) : vous n'avez rien à
                      inventer. Elle s'affichera dans la liste dès que le compte sera créé, avec le nom de
                      l'agent.
                    </span>
                  </p>

                  {events.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Aucun événement disponible — créez d'abord un événement.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {events.map((event) => (
                        <label
                          key={event.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            data-testid="team-create-event"
                            checked={selectedIds.has(event.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds)
                              if (e.target.checked) next.add(event.id)
                              else next.delete(event.id)
                              setSelectedIds(next)
                            }}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="truncate">{event.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>

                <Button type="submit" disabled={isPending || !name.trim()} data-testid="team-create-submit">
                  {isPending ? (
                    <>
                      <Refresh className="h-4 w-4 animate-spin" />
                      Création…
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer le compte scanneur
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Panneau de transmission des identifiants (après création) ─── */}
        {createdCreds && (
          <Card className="mt-6 border-emerald-500/40 bg-emerald-500/5" data-testid="team-created-creds">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-bold tracking-tight">
                    Compte créé — transmettez ces identifiants à {createdCreds.fullName}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setCreatedCreds(null)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Xmark className="h-4 w-4" />
                </button>
              </div>

              {/* Identifiants (affichés une seule fois) */}
              <div className="mt-4 space-y-2 rounded-lg border border-border bg-background p-4 font-mono text-sm">
                <p>
                  <span className="text-muted-foreground">Adresse de connexion : </span>
                  <span className="font-semibold" data-testid="team-creds-email">
                    {createdCreds.email}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Mot de passe : </span>
                  <span className="font-semibold" data-testid="team-creds-password">
                    {createdCreds.password}
                  </span>
                </p>
              </div>

              {/* Transmission : WhatsApp (canal roi) ou copie */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    [
                      `kinPass — vos identifiants de contrôle (${createdCreds.fullName})`,
                      `Adresse de connexion : ${createdCreds.email}`,
                      `Mot de passe : ${createdCreds.password}`,
                      `Page de connexion : ${origin || 'http://localhost:3000'}/auth/login`,
                    ].join('\n'),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="team-creds-whatsapp"
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <Whatsapp className="h-4 w-4" />
                  Envoyer par WhatsApp
                </a>
                <Button variant="outline" onClick={copyCredentials} data-testid="team-creds-copy">
                  {copiedCreds ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedCreds ? 'Identifiants copiés !' : 'Copier les identifiants'}
                </Button>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                <InfoCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Ces identifiants ne sont affichés qu'une seule fois : en cas de perte, réinitialisez le
                mot de passe depuis la liste ci-dessous.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Liste des agents ───────────────────────────────────────────── */}
        <div className="mt-8 space-y-3">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Refresh className="h-5 w-5 animate-spin" />
                Chargement de votre équipe…
              </CardContent>
            </Card>
          ) : agents.length === 0 ? (
            <EmptyState
              title="Aucun scanneur pour le moment"
              description="Créez un compte par agent de contrôle et assignez-lui vos événements."
            >
              <Button onClick={() => setCreating(true)}>
                <UserPlus className="h-4 w-4" />
                Ajouter un scanneur
              </Button>
            </EmptyState>
          ) : (
            agents.map((agent) => (
              <Card key={agent.id} data-testid="team-agent-row" className={cn(!agent.active && 'opacity-70')}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{agent.fullName}</p>
                        {agent.active ? (
                          <Badge variant="success">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Suspendu</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{agent.email}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {agent.scanCount} scan{agent.scanCount > 1 ? 's' : ''}
                        {agent.lastScannedAt
                          ? ` — dernier : ${new Date(agent.lastScannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {agent.active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(agent)}
                          data-testid="team-agent-deactivate"
                        >
                          Suspendre
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => toggleActive(agent)} data-testid="team-agent-activate">
                          Réactiver
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReset(agent)}
                        data-testid="team-agent-reset"
                      >
                        <Refresh className="h-4 w-4" />
                        Nouveau mot de passe
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAgentScans(agent)}
                        aria-expanded={scansOpenAgentId === agent.id}
                        data-testid="team-agent-scans-open"
                      >
                        {scansOpenAgentId === agent.id ? 'Masquer' : 'Voir'} les scans
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(agent)}
                        aria-label={`Supprimer ${agent.fullName}`}
                        data-testid="team-agent-delete"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe généré (affichage unique, par ligne) */
                  resetCreds?.agentId === agent.id && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nouveau mot de passe (à transmettre)
                        </p>
                        <p className="mt-1 font-mono text-base font-bold tracking-[0.15em]" data-testid="team-reset-password">
                          {resetCreds.password}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={copyResetCreds} data-testid="team-reset-copy">
                        {copyingReset ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        {copyingReset ? 'Copié !' : 'Copier'}
                      </Button>
                      <button
                        type="button"
                        aria-label="Fermer"
                        onClick={() => setResetCreds(null)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Xmark className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Journal des scans de l'agent (Phase 7.3) */}
                  {scansOpenAgentId === agent.id && (
                    <div data-testid="team-agent-scans-panel" className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Derniers scans ({agentScans?.length ?? 0})
                      </p>
                      {!agentScans || agentScans.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">Aucun scan enregistré.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-muted-foreground">
                              <tr>
                                <th className="py-1.5 pr-3 font-medium">Code</th>
                                <th className="py-1.5 pr-3 font-medium">Acheteur</th>
                                <th className="py-1.5 pr-3 font-medium">Événement</th>
                                <th className="py-1.5 pr-3 font-medium">Résultat</th>
                                <th className="py-1.5 font-medium">Heure</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agentScans.map((scan, index) => (
                                <tr key={`${scan.code}-${index}`} className="border-t border-border/60">
                                  <td className="py-1.5 pr-3 font-mono">{scan.code}</td>
                                  <td className="py-1.5 pr-3">{scan.buyerName}</td>
                                  <td className="py-1.5 pr-3">{scan.eventTitle}</td>
                                  <td className="py-1.5 pr-3">
                                    <span
                                      className={cn(
                                        'rounded-[3px] px-1.5 py-0.5 font-semibold uppercase tracking-wider',
                                        scan.result === 'valid'
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                      )}
                                    >
                                      {scan.result === 'valid' ? 'Entrée' : 'Doublon'}
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-muted-foreground">
                                    {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Événements assignés */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Événements assignés
                    </p>
                    {agent.events.length === 0 ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Aucun événement — cet agent ne peut scanner aucun accès.
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {agent.events.map((event) => (
                          <span
                            key={event.id}
                            className="inline-flex items-center gap-1 rounded-[3px] border border-border bg-background px-2 py-0.5 text-xs"
                          >
                            {event.title}
                            <button
                              type="button"
                              aria-label={`Retirer ${event.title} de ${agent.fullName}`}
                              data-testid="team-agent-event-remove"
                              onClick={() => handleUnassign(agent.id, event.id)}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Assigner un événement supplémentaire */}
                    {assignableEvents(agent).length > 0 && (
                      <select
                        defaultValue=""
                        data-testid="team-agent-assign"
                        aria-label={`Assigner un événement à ${agent.fullName}`}
                        onChange={(e) => {
                          if (e.target.value) handleAssign(agent.id, e.target.value)
                        }}
                        className={cn(fieldClass, 'mt-2 max-w-sm')}
                      >
                        <option value="" disabled>
                          + Assigner un événement…
                        </option>
                        {assignableEvents(agent).map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
