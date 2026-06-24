'use client'

import { useState, useTransition } from 'react'
import { deleteGanador } from '@/lib/premiacion/actions'
import type { Ganador } from '@/lib/premiacion/types'

function formatDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${mi}`
}

interface Props { ganadores: Ganador[] }

export function HistorialList({ ganadores }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmId, setConfirmId]    = useState<string | null>(null)

  if (ganadores.length === 0) {
    return (
      <p className="text-center py-10 text-white/30 text-sm">
        Aún no hay ganadores registrados.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-white/5">
      {ganadores.map(g => {
        const isConfirm = confirmId === g.id

        return (
          <li
            key={g.id}
            className="group flex items-center gap-3 py-3"
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            <span className="text-xl select-none w-8 text-center shrink-0">{g.premio_emoji}</span>
            <div className="flex-1 min-w-0">
              {g.participante_nombre && (
                <p className="text-white font-medium text-sm leading-tight truncate">{g.participante_nombre}</p>
              )}
              <p className={`truncate ${g.participante_nombre ? 'text-white/40 text-xs' : 'text-white font-medium text-sm'}`}>
                {g.premio_nombre}
              </p>
            </div>
            <span className="text-white/30 text-xs tabular-nums shrink-0">
              {formatDate(g.created_at)}
            </span>

            {/* Acciones */}
            {isConfirm ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-white/40">¿Eliminar?</span>
                <button
                  onClick={() => {
                    setConfirmId(null)
                    startTransition(() => deleteGanador(g.id))
                  }}
                  className="px-2 py-0.5 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/50 text-xs font-semibold rounded transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(g.id)}
                disabled={isPending}
                className="text-white/30 hover:text-red-400 text-xs disabled:opacity-20 transition-colors shrink-0"
                title="Eliminar registro"
              >
                ✕
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
