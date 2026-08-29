'use client'

import { useState } from 'react'
import { Camera, Check, ScanLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ScannerView() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null)
  const validate = () => setResult(code.trim().toUpperCase() === 'A4B-8K9' ? 'valid' : 'invalid')
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-lg flex-col gap-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-400">KIN PASS / DOOR MODE</p><h1 className="mt-1 text-3xl font-semibold">Scan tickets</h1></div><ScanLine className="h-7 w-7 text-blue-400" /></div><div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-900"><div className="absolute inset-8 rounded-2xl border-2 border-dashed border-blue-400/80" /><Camera className="h-12 w-12 text-slate-500" /><p className="absolute bottom-5 text-sm text-slate-400">Camera preview placeholder</p></div><div className="space-y-3"><label htmlFor="ticket-code" className="text-sm font-medium text-slate-300">Or enter the ticket code</label><div className="flex gap-3"><Input id="ticket-code" value={code} onChange={(e) => { setCode(e.target.value); setResult(null) }} placeholder="A4B-8K9" className="h-14 border-slate-700 bg-slate-900 text-lg uppercase tracking-[0.25em] text-white placeholder:text-slate-600" /><Button className="h-14 px-6" onClick={validate}>Check</Button></div></div>{result && <div className={`flex items-center gap-4 rounded-2xl p-5 ${result === 'valid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{result === 'valid' ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}<div><p className="text-xl font-semibold">{result === 'valid' ? 'Ticket Valid' : 'Invalid Ticket'}</p><p className="text-sm opacity-80">{result === 'valid' ? 'Welcome to Kin House.' : 'Check the code and try again.'}</p></div></div>}</div></main>
}
