'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { SorteoResult } from '@/lib/premiacion/types'
import { ResultCard } from './ResultCard'

// ── Paleta Argentina + Dorado ────────────────────────────────────────────────
const CELESTE   = '#74ACDF'   // celeste Argentina
const WHITE_SEG = '#F0F4FF'   // blanco ligeramente azulado
const GOLD      = '#C9A84C'   // dorado
const DARK_BLUE = '#1A3A6B'   // azul oscuro Argentina
const GOLD_DARK = '#8B6914'   // dorado oscuro para stroke

// ── Dimensiones ──────────────────────────────────────────────────────────────
const SIZE    = 400
const CX      = SIZE / 2
const CY      = SIZE / 2
const OUTER_R = 170   // radio exterior de los segmentos
const HUB_R   = 22    // radio del centro (hub)

import type { PremioSlim } from '@/lib/premiacion/types'

type GameState = 'idle' | 'fetching' | 'spinning' | 'won' | 'sin_stock'

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function clampText(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function renderWheel(
  ctx: CanvasRenderingContext2D,
  premios: PremioSlim[],
  rotation: number,
) {
  ctx.clearRect(0, 0, SIZE, SIZE)
  const n = premios.length
  if (n === 0) return

  const segAngle = (2 * Math.PI) / n
  const TEXT_R   = OUTER_R * 0.63
  const fontSize = n <= 4 ? 13 : n <= 7 ? 11 : 9
  const maxChars = n <= 4 ? 11 : n <= 7 ? 7 : 5

  // ── 1. Segmentos (fill) ────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const start = rotation - Math.PI / 2 + i * segAngle
    const end   = start + segAngle

    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, OUTER_R, start, end)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? CELESTE : WHITE_SEG
    ctx.fill()
  }

  // ── 2. Líneas divisoras de segmentos ──────────────────────────────────────
  ctx.lineWidth   = 1.2
  ctx.strokeStyle = DARK_BLUE + 'AA'
  for (let i = 0; i < n; i++) {
    const a = rotation - Math.PI / 2 + i * segAngle
    ctx.beginPath()
    ctx.moveTo(CX + Math.cos(a) * (HUB_R + 2), CY + Math.sin(a) * (HUB_R + 2))
    ctx.lineTo(CX + Math.cos(a) * OUTER_R, CY + Math.sin(a) * OUTER_R)
    ctx.stroke()
  }

  // ── 3. Anillo dorado exterior ─────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(CX, CY, OUTER_R, 0, 2 * Math.PI)
  ctx.strokeStyle = GOLD
  ctx.lineWidth   = 13
  ctx.stroke()

  // ── 4. Anillo azul interior del borde ─────────────────────────────────────
  ctx.beginPath()
  ctx.arc(CX, CY, OUTER_R - 8, 0, 2 * Math.PI)
  ctx.strokeStyle = DARK_BLUE
  ctx.lineWidth   = 2.5
  ctx.stroke()

  // ── 5. Texto en cada segmento ─────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const midA = rotation - Math.PI / 2 + (i + 0.5) * segAngle
    const tx   = CX + Math.cos(midA) * TEXT_R
    const ty   = CY + Math.sin(midA) * TEXT_R

    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(midA + Math.PI / 2)
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle    = i % 2 === 0 ? '#FFFFFF' : DARK_BLUE

    const lineH  = fontSize + 3
    const nombre = clampText(premios[i].nombre, maxChars)

    // Emoji (más hacia el exterior)
    ctx.font = `${fontSize + 1}px Inter, system-ui`
    ctx.fillText(premios[i].emoji, 0, -lineH / 2)

    // Nombre (más hacia el centro)
    ctx.font = `bold ${fontSize}px Inter, system-ui`
    ctx.fillText(nombre, 0, lineH / 2 + 1)
    ctx.restore()
  }

  // ── 6. Hub central (dorado + punto azul) ──────────────────────────────────
  ctx.beginPath()
  ctx.arc(CX, CY, HUB_R, 0, 2 * Math.PI)
  ctx.fillStyle   = GOLD
  ctx.fill()
  ctx.strokeStyle = DARK_BLUE
  ctx.lineWidth   = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(CX, CY, HUB_R * 0.42, 0, 2 * Math.PI)
  ctx.fillStyle = DARK_BLUE
  ctx.fill()

  // ── 7. Puntero dorado fijo en 12 o'clock ──────────────────────────────────
  const tipY  = CY - OUTER_R + 3   // punta toca el anillo dorado
  const baseY = tipY - 22
  const hw    = 12

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur  = 7
  ctx.beginPath()
  ctx.moveTo(CX, tipY)
  ctx.lineTo(CX - hw, baseY)
  ctx.lineTo(CX + hw, baseY)
  ctx.closePath()
  ctx.fillStyle = GOLD
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.moveTo(CX, tipY)
  ctx.lineTo(CX - hw, baseY)
  ctx.lineTo(CX + hw, baseY)
  ctx.closePath()
  ctx.strokeStyle = GOLD_DARK
  ctx.lineWidth   = 1.5
  ctx.stroke()
}

interface WheelPageProps {
  premios:         PremioSlim[]
  participanteName?: string
  onGanador?:      (r: SorteoResult | null) => void
}

export function WheelPage({ premios, participanteName, onGanador }: WheelPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number | null>(null)
  const rotRef    = useRef(0)

  const [gameState, setGameState] = useState<GameState>(
    premios.length === 0 ? 'sin_stock' : 'idle'
  )
  const [result, setResult] = useState<SorteoResult | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = canvas?.getContext('2d')
    if (!ctx) return
    renderWheel(ctx, premios, rotRef.current)
  }, [premios])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  const spin = useCallback(async () => {
    if (gameState !== 'idle') return

    // 1 ─ Sorteo en el servidor ANTES de animar → la rueda cae en el premio real
    setGameState('fetching')

    let sorteoResult: SorteoResult
    try {
      const res  = await fetch('/api/premiacion/sortear', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre: participanteName ?? '' }),
      })
      const data = await res.json() as SorteoResult

      if (res.status === 409 || data.error === 'sin_stock') {
        onGanador?.(null)
        setGameState('sin_stock')
        return
      }
      if (!res.ok) { setGameState('idle'); return }

      sorteoResult = data
    } catch {
      setGameState('idle')
      return
    }

    // Notificar al padre para guardar en localStorage ANTES de la animación
    onGanador?.(sorteoResult)

    setResult(sorteoResult)

    // 2 ─ Calcular rotación exacta para que el segmento ganador quede arriba
    const n          = premios.length
    const segAngle   = (2 * Math.PI) / n
    const winnerIdx  = premios.findIndex(p => p.id === sorteoResult.id)
    const targetIdx  = winnerIdx >= 0 ? winnerIdx : Math.floor(Math.random() * n)

    // El segmento targetIdx debe quedar centrado en el puntero (ángulo -π/2)
    // rotation ≡ -(targetIdx + 0.5) * segAngle  (mod 2π)
    const baseAngle     = -(targetIdx + 0.5) * segAngle
    const targetAngle   = ((baseAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const currentAngle  = rotRef.current % (2 * Math.PI)
    let   delta         = targetAngle - currentAngle
    if (delta <= 0) delta += 2 * Math.PI   // siempre girar hacia adelante

    const totalSpin  = 6 * 2 * Math.PI + delta  // ≥6 vueltas completas + ajuste fino
    const startRot   = rotRef.current
    const endRot     = startRot + totalSpin
    const startTime  = performance.now()

    // 3 ─ Animar
    setGameState('spinning')

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / 4800, 1)
      rotRef.current = startRot + totalSpin * easeOut(t)
      draw()

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
        return
      }

      rotRef.current = endRot
      draw()
      setGameState('won')
    }

    animRef.current = requestAnimationFrame(animate)
  }, [gameState, draw, premios, participanteName, onGanador])

  // ── Pantalla ganador ───────────────────────────────────────────────────────
  if (gameState === 'won' && result) {
    return <ResultCard nombre={result.nombre} emoji={result.emoji} participante={participanteName} />
  }

  // ── Pantalla sin stock ─────────────────────────────────────────────────────
  if (gameState === 'sin_stock') {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-6 select-none">😔</div>
        <h1 className="text-2xl font-bold text-white mb-3">Premios agotados</h1>
        <p className="text-white/50 text-sm">Todos los premios ya fueron reclamados.</p>
      </main>
    )
  }

  const isDisabled = gameState !== 'idle'

  // ── Pantalla ruleta ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] flex flex-col items-center gap-8">

        <h1 className="text-2xl font-bold text-white tracking-tight select-none">
          ¡Girá la ruleta!
        </h1>

        <div className="relative w-full flex justify-center">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="w-full max-w-[400px] drop-shadow-2xl"
            style={{ aspectRatio: '1' }}
          />
          {gameState === 'fetching' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <button
          onClick={spin}
          disabled={isDisabled}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white bg-[#1A3A6B] hover:bg-[#274d8a] active:scale-95 border-2 border-[#C9A84C] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 select-none"
        >
          {gameState === 'fetching'
            ? 'Sorteando…'
            : gameState === 'spinning'
              ? 'Girando…'
              : '¡Girar!'}
        </button>

      </div>
    </main>
  )
}
