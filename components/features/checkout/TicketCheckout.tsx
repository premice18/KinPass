"use client";

// ────────────────────────────────────────────────────────────────────────────
// Tunnel de réservation (maquette) — enrichissement visuel.
//
// Ajouts :
// - État intermédiaire « paiement en cours » avec animation Lottie
//   (`payment-loading.json`) qui simule la redirection Mobile Money.
// - Écran de confirmation avec animation Lottie de succès
//   (`success-check.json`).
// - Transitions douces entre les états via Framer Motion (`AnimatePresence`).
// Les textes et `data-testid` utilisés par les tests E2E sont préservés.
// ────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lottie } from "lottie-react";
import {
  Calendar,
  MapPin,
  Minus,
  Plus,
  SmartphoneDevice,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/ui/eyebrow";
import paymentLoading from "@/public/lottie/payment-loading.json";
import successCheck from "@/public/lottie/success-check.json";

type CheckoutStatus = "booking" | "processing" | "paid";

export function TicketCheckout() {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<CheckoutStatus>("booking");
  const total = quantity * 38;

  // Lance le paiement simulé : état « processing » puis confirmation.
  const startPayment = () => {
    if (status !== "booking") return;
    setStatus("processing");
    // Simule le temps de redirection/confirmation Mobile Money.
    window.setTimeout(() => setStatus("paid"), 1400);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
        <section>
          <div className="mb-4">
            <Eyebrow>Billet numérique</Eyebrow>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Kin House : Open Studio
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground">
            Une soirée dédiée aux artistes, à la musique et aux rencontres dans
            un lieu unique.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              20 septembre · 19h00
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Galerie d’art moderne
            </span>
          </div>
        </section>

        <Card className="lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>Réserver vos billets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {status === "booking" && (
                <motion.div
                  key="booking"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Entrée générale</p>
                      <p className="text-sm text-muted-foreground">
                        38 $ par billet
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        aria-label="Diminuer la quantité"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setQuantity((q) => Math.max(1, q - 1))
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span
                        className="w-5 text-center font-semibold"
                        data-testid="checkout-quantity"
                      >
                        {quantity}
                      </span>
                      <Button
                        aria-label="Augmenter la quantité"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium">
                      Nom complet
                      <Input className="mt-2" placeholder="Ex. Jean-Marc K." />
                    </label>
                    <label className="block text-sm font-medium">
                      Numéro de téléphone
                      <Input
                        className="mt-2"
                        placeholder="+243 81 000 00 00"
                        type="tel"
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between border-t pt-5">
                    <span className="text-muted-foreground">Total</span>
                    <span
                      className="text-2xl font-semibold"
                      data-testid="checkout-total"
                    >
                      {total} $
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={startPayment}
                  >
                    <SmartphoneDevice className="h-4 w-4" />
                    Payer via Mobile Money
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    M-Pesa · Orange Money · Airtel Money
                  </p>
                </motion.div>
              )}

              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-4 py-10 text-center"
                >
                  {/* Animation de chargement (points pulsants cyan) */}
                  <Lottie
                    src={paymentLoading}
                    loop
                    className="h-20 w-20"
                  />
                  <p className="font-medium">
                    Redirection vers Mobile Money…
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confirmez le paiement sur votre téléphone.
                  </p>
                </motion.div>
              )}

              {status === "paid" && (
                <motion.div
                  key="paid"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4 py-6 text-center"
                >
                  {/* Animation de succès (coche verte animée) */}
                  <Lottie
                    src={successCheck}
                    loop={false}
                    className="h-24 w-24"
                  />
                  <h2 className="text-xl font-semibold">Billets confirmés</h2>
                  <p className="text-muted-foreground">
                    Vos billets numériques ont été envoyés sur votre téléphone.
                  </p>
                  <div className="w-full rounded-lg bg-muted p-4 text-left">
                    <p className="text-xs text-muted-foreground">
                      CODE D’ACCÈS
                    </p>
                    <p
                      className="mt-1 text-2xl font-bold tracking-[0.25em]"
                      data-testid="checkout-confirm-code"
                    >
                      A4B-8K9
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setStatus("booking")}
                  >
                    Acheter un autre billet
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
