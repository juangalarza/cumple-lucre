'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { getPrizeImageSrc } from '@/lib/premiacion/prize-images'

const STAR_DEFAULTS = {
  spread:        360,
  ticks:         80,
  gravity:       0,
  decay:         0.94,
  startVelocity: 30,
  origin:        { x: 0.5, y: 0.45 },
  colors:        ['#C9A84C', '#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#F0F4FF'],
}

function fireConfetti() {
  const shoot = () => {
    confetti({ ...STAR_DEFAULTS, particleCount: 40, scalar: 1.2, shapes: ['star'] as confetti.Shape[] })
    confetti({ ...STAR_DEFAULTS, particleCount: 10, scalar: 0.75, shapes: ['circle'] as confetti.Shape[] })
  }

  // Tres ráfagas de estrellas desde el centro
  setTimeout(shoot, 0)
  setTimeout(shoot, 150)
  setTimeout(shoot, 300)

  // Cañones laterales de fondo
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0,   y: 0.65 }, colors: STAR_DEFAULTS.colors })
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1,   y: 0.65 }, colors: STAR_DEFAULTS.colors })
  }, 100)
}

interface Props {
  nombre:       string
  emoji:        string
  participante?: string
}

export function ResultCard({ nombre, emoji, participante }: Props) {
  useEffect(() => {
    // Delay de 300ms para que el card sea visible antes de los confettis
    const t = setTimeout(fireConfetti, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#16161E] border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl">

        {(() => {
          const src = getPrizeImageSrc(nombre)
          return src
            ? <img src={src} alt={nombre} className="w-28 h-28 object-contain animate-bounce select-none" />
            : <div className="text-8xl animate-bounce select-none">{emoji}</div>
        })()}

        <div>
          {participante && (
            <p className="text-white/40 text-sm mb-1">¡{participante},</p>
          )}
          <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-1">
            ¡Ganaste!
          </p>
          <h1 className="text-3xl font-bold text-white">{nombre}</h1>
        </div>

        <div className="w-full h-px bg-white/10" />

        <p className="text-white/50 text-sm leading-relaxed">
          Mostrá esta pantalla al organizador para canjear tu premio 🎉
        </p>
        <p className="text-white/30 text-sm leading-relaxed">
          Y animate a probar los tragos que <span className="text-white/60 font-semibold">la puta ama</span> preparó para vos 🍹
        </p>

      </div>
    </main>
  )
}
