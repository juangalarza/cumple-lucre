'use client'

import { useState, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { revelarAsignacion } from '@/lib/amigo-invisible/actions'

interface Props {
  token: string
  miNombre: string
  disponibles: string[]
}

type Phase = 'idle' | 'spinning' | 'done'

const CONFETTI_COLORS = ['#C9A84C', '#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#F0F4FF']

function fireConfetti() {
  const opts = { spread: 360, gravity: 0, decay: 0.94, startVelocity: 25, colors: CONFETTI_COLORS, origin: { x: 0.5, y: 0.45 } }
  confetti({ ...opts, particleCount: 50, scalar: 1.2, shapes: ['star'] as confetti.Shape[] })
  confetti({ ...opts, particleCount: 15, scalar: 0.75, shapes: ['circle'] as confetti.Shape[] })
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors: CONFETTI_COLORS })
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: CONFETTI_COLORS })
  }, 150)
}

export function PlayerGate({ token, miNombre, disponibles }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayName, setDisplayName] = useState<string>(disponibles[0] ?? '')
  const [ganador, setGanador] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function jugar() {
    if (phase !== 'idle') return
    setError(null)
    setPhase('spinning')

    // Ciclo rápido de nombres
    let idx = Math.floor(Math.random() * Math.max(disponibles.length, 1))
    const pool = disponibles.length > 0 ? disponibles : ['…']
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return
      setDisplayName(pool[idx++ % pool.length])
    }, 80)

    try {
      const result = await revelarAsignacion(token)

      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!mountedRef.current) return

      if (!result.ok) {
        setPhase('idle')
        setError(result.error)
        return
      }

      // Desaceleración: mostrar nombres aleatoriamente cada vez más lento
      const delays = [140, 180, 230, 290, 360]
      for (const d of delays) {
        await new Promise<void>(r => setTimeout(r, d))
        if (!mountedRef.current) return
        setDisplayName(pool[idx++ % pool.length])
      }

      // Revelar el ganador
      await new Promise<void>(r => setTimeout(r, 420))
      if (!mountedRef.current) return

      setDisplayName(result.nombre)
      setGanador(result.nombre)
      setPhase('done')
      setTimeout(fireConfetti, 150)
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!mountedRef.current) return
      setPhase('idle')
      setError(err instanceof Error ? err.message : 'Error al jugar. Intentá de nuevo.')
    }
  }

  // ── Pantalla resultado ────────────────────────────────────────────────────────
  if (phase === 'done' && ganador) {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#16161E] border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl">
          <div className="text-7xl select-none animate-bounce">🎁</div>
          <div>
            <p className="text-white/40 text-sm mb-1">¡{miNombre},</p>
            <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-2">
              tu amigo invisible es…
            </p>
            <h1 className="text-4xl font-bold text-white">{ganador}</h1>
          </div>
          <div className="w-full h-px bg-white/10" />
          <p className="text-white/40 text-sm leading-relaxed">
            ¡Guardalo bien! No se lo cuentes a nadie 🤫
          </p>
        </div>
      </main>
    )
  }

  // ── Pantalla de juego (idle + spinning) ──────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Saludo */}
        <div className="text-center">
          <div className="text-5xl mb-3 select-none">🎁</div>
          <h1 className="text-2xl font-bold text-white">¡Hola, {miNombre}!</h1>
          <p className="text-white/40 text-sm mt-1">Presioná el botón para descubrir a quién le regalás</p>
        </div>

        {/* Display de nombre girando — blurred matrix */}
        {phase === 'spinning' && (
          <div className="w-full rounded-2xl py-8 flex items-center justify-center overflow-hidden"
            style={{
              background: '#0a120a',
              border: '1px solid rgba(74,222,128,0.25)',
              boxShadow: '0 0 18px rgba(74,222,128,0.12), inset 0 0 30px rgba(0,0,0,0.6)',
            }}
          >
            <span
              className="select-none text-3xl"
              style={{
                fontFamily: 'monospace',
                color: '#4ade80',
                filter: 'blur(9px)',
                letterSpacing: '0.05em',
                textShadow: '0 0 12px rgba(74,222,128,0.8)',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {displayName}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Botón jugar */}
        <button
          onClick={jugar}
          disabled={phase !== 'idle'}
          className="w-full py-5 rounded-2xl text-xl font-bold text-white bg-[#1A3A6B] hover:bg-[#274d8a] active:scale-95 border-2 border-[#C9A84C] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 select-none"
        >
          {phase === 'spinning' ? 'Sorteando…' : '🎲 ¡Jugar!'}
        </button>

      </div>
    </main>
  )
}
