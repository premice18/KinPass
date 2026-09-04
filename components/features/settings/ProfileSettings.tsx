'use client'

// ────────────────────────────────────────────────────────────────────────────
// Page Réglages / Profil de l'organisateur (Phase 4.3).
//
// Sections :
// 1. Identité : avatar (upload depuis l'appareil, redimensionné en 128 px,
//    ou URL manuelle, ou photo Google automatique ; repli = initiales),
//    nom complet.
// 2. Présence : bio courte, site web, Instagram.
// 3. Contact & localisation : email (lecture seule), WhatsApp, adresse.
// 4. Comptes de reversement : liste + ajout / modification / suppression /
//    méthode par défaut.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { ArrowLeft, Check, EditPencil, MediaImage, Plus, Refresh, Trash, WarningCircle } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { cn } from '@/lib/utils'
import type { PayoutMethod } from '@/lib/db/schema'
import {
  addPayoutMethod,
  getProfile,
  removePayoutMethod,
  setDefaultPayoutMethod,
  updatePayoutMethod,
  updateProfile,
  type ProfileData,
} from '@/lib/actions/profile'
import { PAYOUT_PROVIDERS, type PayoutProvider } from '@/lib/validators/profile'

interface ProfileSettingsProps {
  // Retour au dashboard.
  onBack: () => void
  // Appelé après chaque enregistrement (rafraîchit la session, ex. avatar).
  onProfileUpdated?: () => void
}

// Libellés français des providers de reversement.
const PROVIDER_LABELS: Record<PayoutProvider, string> = {
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank: 'Virement bancaire',
}

// Initiales du nom (repli quand pas d'avatar).
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

// Champ avec libellé (réutilisé localement).
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      {label}
      {children}
      {hint && <p className="text-xs font-normal text-muted-foreground">{hint}</p>}
    </label>
  )
}

// Classes partagées select/textarea.
const controlClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Importe une image depuis l'appareil, la redimensionne en 128×128 (cover) et
// renvoie une data-URL légère (webp) — sans stockage externe pour le moment.
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'))
    reader.readAsDataURL(file)
  })

  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas indisponible.'))
        return
      }
      // Recadrage « cover » : on centre sur le plus petit côté.
      const side = Math.min(image.width, image.height)
      const sx = (image.width - side) / 2
      const sy = (image.height - side) / 2
      context.drawImage(image, sx, sy, side, side, 0, 0, size, size)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    image.onerror = () => reject(new Error('Image illisible.'))
    image.src = raw
  })
}

export function ProfileSettings({ onBack, onProfileUpdated }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  // Référence vers l'input fichier (déclenché par le bouton « Importer »).
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Champs du formulaire d'identité / présence / contact.
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Nouveau compte de reversement.
  const [newProvider, setNewProvider] = useState<PayoutProvider>('mpesa')
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')

  // Compte en cours de modification (édition inline).
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editProvider, setEditProvider] = useState<PayoutProvider>('mpesa')
  const [editAccountName, setEditAccountName] = useState('')
  const [editAccountNumber, setEditAccountNumber] = useState('')

  // Charge le profil au montage.
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getProfile()
    if (result.success) {
      applyProfile(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  // Remplit le formulaire depuis un profil chargé.
  const applyProfile = (data: ProfileData) => {
    setProfile(data)
    setFullName(data.fullName)
    setBio(data.bio ?? '')
    setWebsite(data.website ?? '')
    setInstagram(data.instagram ?? '')
    setPhoneWhatsapp(data.phoneWhatsapp ?? '')
    setAddress(data.address ?? '')
    setAvatarUrl(data.avatarUrl ?? '')
  }

  useEffect(() => {
    load()
  }, [load])

  // Import d'une photo depuis l'appareil → redimension → data-URL.
  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir une image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (5 Mo maximum).')
      return
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setAvatarUrl(dataUrl)
      setSuccess('Photo importée — cliquez sur Enregistrer pour appliquer.')
    } catch {
      setError('Impossible de lire cette image.')
    }
  }

  // Enregistre les informations du profil.
  const saveProfile = () => {
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await updateProfile({
        fullName: fullName.trim(),
        phoneWhatsapp: phoneWhatsapp.trim(),
        address: address.trim(),
        bio: bio.trim(),
        website: website.trim(),
        instagram: instagram.trim(),
        avatarUrl: avatarUrl.trim(),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      applyProfile(result.data)
      setSuccess('Profil enregistré.')
      onProfileUpdated?.()
    })
  }

  // Ajoute un compte de reversement.
  const handleAddPayout = () => {
    setError('')
    setSuccess('')
    if (!newAccountName.trim() || !newAccountNumber.trim()) {
      setError('Renseignez le titulaire et le numéro du compte.')
      return
    }
    startTransition(async () => {
      const result = await addPayoutMethod({
        provider: newProvider,
        accountName: newAccountName.trim(),
        accountNumber: newAccountNumber.trim(),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setNewAccountName('')
      setNewAccountNumber('')
      setProfile((prev) => (prev ? { ...prev, payoutMethods: result.data, complete: true } : prev))
      onProfileUpdated?.()
      setSuccess('Compte de reversement ajouté.')
    })
  }

  // Ouvre l'édition inline d'un compte.
  const startEdit = (method: PayoutMethod) => {
    setEditingId(method.id)
    setEditProvider(method.provider as PayoutProvider)
    setEditAccountName(method.accountName)
    setEditAccountNumber(method.accountNumber)
  }

  // Enregistre la modification d'un compte.
  const saveEdit = () => {
    if (!editingId) return
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await updatePayoutMethod(editingId, {
        provider: editProvider,
        accountName: editAccountName.trim(),
        accountNumber: editAccountNumber.trim(),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setEditingId(null)
      setProfile((prev) => (prev ? { ...prev, payoutMethods: result.data } : prev))
      setSuccess('Compte de reversement modifié.')
    })
  }

  // Supprime un compte de reversement.
  const handleRemovePayout = (methodId: string) => {
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await removePayoutMethod(methodId)
      if (!result.success) {
        setError(result.error)
        return
      }
      setProfile((prev) => (prev ? { ...prev, payoutMethods: result.data } : prev))
      setSuccess('Compte supprimé.')
    })
  }

  // Définit la méthode par défaut.
  const handleDefaultPayout = (methodId: string) => {
    startTransition(async () => {
      const result = await setDefaultPayoutMethod(methodId)
      if (result.success) {
        setProfile((prev) => (prev ? { ...prev, payoutMethods: result.data } : prev))
      }
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Refresh className="h-5 w-5 animate-spin" />
            Chargement du profil…
          </div>
        </div>
      </main>
    )
  }

  const avatarDisplay = avatarUrl.trim() || profile?.avatarUrl
  const avatarInitials = initialsOf(fullName || profile?.fullName || '?')

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <Eyebrow>Réglages</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-1 text-muted-foreground">
          Complétez votre profil pour publier vos événements et inspirer
          confiance à vos invités.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <WarningCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <Check className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* ── Identité & photo de profil ────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              {/* Aperçu : photo importée/Google/URL ou initiales */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-bold text-foreground">
                {avatarDisplay ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarDisplay} alt="Photo de profil" className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Upload depuis l'appareil (redimensionné 128 px) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <MediaImage className="h-4 w-4" />
                  Importer une photo
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Photo redimensionnée automatiquement (128 px). L’upload vers un
              stockage externe arrivera plus tard ; vous pouvez aussi coller une
              URL ou garder la photo Google.
            </p>

            <Field label="Photo de profil (URL)">
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://… ou laissé vide"
                type="url"
              />
            </Field>

            <Field label="Nom complet">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {/* ── Présence (bio, site, réseau) ──────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Présence</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visible sur votre futur profil public d’organisateur — bâtissez la
              confiance avant l’événement.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Bio courte" hint="300 caractères max — qui êtes-vous, quel type d’événements ?">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Organisateur d’événements à Kinshasa depuis 2019…"
                className={cn(controlClass, 'min-h-20')}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Site web">
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://votresite.cd"
                  type="url"
                />
              </Field>
              <Field label="Instagram">
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@votrecompte"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact & localisation ───────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Contact & localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Adresse email (connexion)">
              <Input value={profile?.email ?? ''} disabled className="opacity-70" />
            </Field>
            <Field
              label="Téléphone WhatsApp"
              hint="Pour les notifications et le contact des invités."
            >
              <Input
                value={phoneWhatsapp}
                onChange={(e) => setPhoneWhatsapp(e.target.value)}
                placeholder="+243 812 345 678"
                type="tel"
              />
            </Field>
            <Field label="Adresse / ville / commune">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex. Kinshasa, Gombe"
              />
            </Field>

            <Button onClick={saveProfile} disabled={isPending}>
              {isPending ? (
                <>
                  <Refresh className="h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Comptes de reversement ────────────────────────────────────────── */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Comptes de reversement</CardTitle>
            <p className="text-sm text-muted-foreground">
              C’est sur ce compte que kinPass vous reversera vos revenus lors
              d’un retrait. Au moins un compte est requis pour publier.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Liste des comptes */}
            <div className="space-y-2">
              {(profile?.payoutMethods.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun compte pour le moment — ajoutez-en un ci-dessous.
                </p>
              )}
              {profile?.payoutMethods.map((method) => {
                const isEditing = editingId === method.id
                return (
                  <div
                    key={method.id}
                    className="rounded-lg border border-border bg-muted/30 p-3"
                  >
                    {isEditing ? (
                      /* Édition inline du compte */
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Fournisseur">
                            <select
                              value={editProvider}
                              onChange={(e) => setEditProvider(e.target.value as PayoutProvider)}
                              className={controlClass}
                            >
                              {PAYOUT_PROVIDERS.map((p) => (
                                <option key={p} value={p}>
                                  {PROVIDER_LABELS[p]}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Titulaire">
                            <Input
                              value={editAccountName}
                              onChange={(e) => setEditAccountName(e.target.value)}
                            />
                          </Field>
                          <Field label="Numéro / téléphone">
                            <Input
                              value={editAccountNumber}
                              onChange={(e) => setEditAccountNumber(e.target.value)}
                              className="sm:col-span-2"
                            />
                          </Field>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={isPending}>
                            {isPending ? (
                              <Refresh className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Enregistrer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {PROVIDER_LABELS[method.provider as PayoutProvider] ?? method.provider}
                            </p>
                            {method.isDefault && <Badge variant="success">Par défaut</Badge>}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {method.accountName} · {method.accountNumber}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {!method.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDefaultPayout(method.id)}
                              aria-label="Définir par défaut"
                            >
                              Par défaut
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => startEdit(method)}
                            aria-label={`Modifier ${PROVIDER_LABELS[method.provider as PayoutProvider]}`}
                          >
                            <EditPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemovePayout(method.id)}
                            aria-label={`Supprimer ${PROVIDER_LABELS[method.provider as PayoutProvider]}`}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Ajout d'un compte */}
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="mb-3 text-sm font-medium">Ajouter un compte</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fournisseur">
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as PayoutProvider)}
                    className={controlClass}
                  >
                    {PAYOUT_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Titulaire">
                  <Input
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Nom complet du compte"
                  />
                </Field>
                <Field label="Numéro / téléphone">
                  <Input
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder="+243 812 345 678 ou IBAN"
                    className="sm:col-span-2"
                  />
                </Field>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPayout}
                className="mt-3"
                disabled={isPending}
              >
                <Plus className="h-4 w-4" />
                Ajouter ce compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
