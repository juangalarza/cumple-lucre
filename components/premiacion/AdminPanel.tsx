'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Premio, Ganador, StatsData } from '@/lib/premiacion/types'
import { StatsRow } from './StatsRow'
import { PrizesTable } from './PrizesTable'
import { AddPrizeForm } from './AddPrizeForm'
import { HistorialList } from './HistorialList'
import { QRDisplay } from './QRDisplay'

interface Props {
  initialPremios: Premio[]
  initialGanadores: Ganador[]
  initialStats: StatsData
}

export function AdminPanel({ initialPremios, initialGanadores, initialStats }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  function copyResetLink() {
    const url = `${window.location.origin}/ruleta?reset=Lucre45`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#0D0D12] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* Header ─────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panel de administración</h1>
            <p className="text-white/40 text-sm mt-1">Sistema de premiación · gestión de premios y sorteos</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#16161E] border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              ◻ Ver QR
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 bg-[#16161E] border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-30"
            >
              {loggingOut ? '…' : 'Salir'}
            </button>
          </div>
        </div>

        {/* Stats ──────────────────────────── */}
        <StatsRow stats={initialStats} />

        {/* Premios ────────────────────────── */}
        <section className="bg-[#16161E] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Premios</h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6a4de0] text-white text-sm font-semibold rounded-xl transition-colors"
              >
                + Agregar premio
              </button>
            )}
          </div>

          {showAddForm && (
            <AddPrizeForm onClose={() => setShowAddForm(false)} />
          )}

          <PrizesTable premios={initialPremios} />
        </section>

        {/* Historial ──────────────────────── */}
        <section className="bg-[#16161E] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Historial de ganadores</h2>
          <p className="text-white/30 text-sm mb-5">
            {initialStats.ganadoresTotales} registros · mostrando los últimos {initialGanadores.length}
          </p>
          <HistorialList ganadores={initialGanadores} />
        </section>

        {/* Reset participación ─────────────── */}
        <section className="bg-[#16161E] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Reiniciar participación</h2>
            <p className="text-white/30 text-sm mt-1">
              Compartí este link con alguien que quiera volver a participar. Al abrirlo, su dispositivo queda desbloqueado.
            </p>
          </div>
          <button
            onClick={copyResetLink}
            className="self-start flex items-center gap-2 px-4 py-2.5 bg-[#0D0D12] border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/70 hover:text-white transition-all active:scale-95"
          >
            {copied ? (
              <><span className="text-green-400">✓</span> ¡Link copiado!</>
            ) : (
              <><span>🔗</span> Copiar link de reset</>
            )}
          </button>
        </section>

      </div>

      {/* Modal QR ───────────────────────── */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-[#16161E] border border-white/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">QR del evento</h2>
              <button
                onClick={() => setShowQR(false)}
                className="text-white/30 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <QRDisplay />
          </div>
        </div>
      )}
    </main>
  )
}
