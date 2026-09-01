"use client";
import { useState } from "react";
import { Camera, Check, Clock, Scanning, X } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function Scanner() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"valid" | "invalid" | "used" | null>(
    null,
  );
  const validate = () => {
    const normalized = code.toUpperCase().replaceAll("-", "").trim();
    setResult(
      normalized === "A4B8K9"
        ? "valid"
        : normalized === "X7PM3R"
          ? "used"
          : "invalid",
    );
  };
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
              KIN PASS · MODE CONTRÔLE
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Scanner un billet</h1>
            <p className="mt-1 text-sm text-slate-400">
              Kin House : Open Studio
            </p>
          </div>
          <Scanning className="h-7 w-7 text-cyan-400" />
        </div>
        <div className="relative mt-7 flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
          <div className="absolute inset-8 rounded-2xl border-2 border-cyan-500" />
          <div className="absolute left-12 right-12 top-1/2 h-px bg-cyan-500/70" />
          <Camera className="h-12 w-12 text-slate-500" />
          <p className="absolute bottom-5 text-sm text-slate-400">
            Placez le QR code dans le cadre
          </p>
        </div>
        <div className="mt-6 space-y-3">
          <label
            htmlFor="ticket-code"
            className="text-sm font-medium text-slate-300"
          >
            Ou saisir le code du billet
          </label>
          <div className="flex gap-3">
            <Input
              id="ticket-code"
              data-testid="scanner-code-input"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setResult(null);
              }}
              placeholder="A4B-8K9"
              className="h-14 border-slate-700 bg-slate-900 text-lg uppercase tracking-[0.25em] text-white placeholder:text-slate-600"
            />
            <Button className="h-14 px-6" onClick={validate}>
              Vérifier
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Les tirets et la casse sont automatiquement ignorés.
          </p>
        </div>
        {result && (
          <div
            data-testid="scan-result"
            className={`mt-5 rounded-2xl p-5 ${result === "valid" ? "bg-emerald-500 text-emerald-950" : result === "used" ? "bg-orange-400 text-orange-950" : "bg-red-500 text-white"}`}
          >
            <div className="flex items-center gap-3">
              {result === "valid" ? (
                <Check />
              ) : result === "used" ? (
                <Clock />
              ) : (
                <X />
              )}
              <div>
                <p className="text-xl font-bold">
                  {result === "valid"
                    ? "VALIDE"
                    : result === "used"
                      ? "DÉJÀ SCANNÉ"
                      : "INVALIDE"}
                </p>
                <p className="mt-1 text-sm">
                  {result === "valid"
                    ? "Jean-Marc K. · Billet VIP"
                    : result === "used"
                      ? "Premier scan aujourd’hui à 19:42"
                      : "Ce billet n’est pas reconnu."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
