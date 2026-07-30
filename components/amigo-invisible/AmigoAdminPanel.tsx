'use client'

import { useState, useTransition } from 'react'
import {
  agregarJugador,
  eliminarJugador,
  realizarSorteo,
  resetearSorteo,
} from '@/lib/amigo-invisible/admin-actions'
import type { Jugador, Config } from '@/lib/amigo-invisible/types'

interface Props {
  initialJugadores: Jugador[]
  config: Config
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3 4l.75 9.5h8.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

export function AmigoAdminPanel({ initialJugadores, config }: Props) {
  const [isPending, startTransition] = useTransition()
  const [inputValue, setInputValue] = useState('')
  const [confirmSorteo, setConfirmSorteo] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mostrarAsignaciones, setMostrarAsignaciones] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sorteado = config.estado === 'sorteado'

  function getLink(token: string) {
    return `${window.location.origin}/amigo/${token}`
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(getLink(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function shareWhatsApp(nombre: string, token: string) {
    const link = getLink(token)
    const mensaje = `🎁 *Amigo Invisible — Cumple de Lucre*\n¡Hola ${nombre}! Entrá a tu link secreto para descubrir a quién le regalás:\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    const nombre = inputValue.trim()
    if (!nombre) return
    setError(null)
    startTransition(async () => {
      try {
        await agregarJugador(nombre)
        setInputValue('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al agregar jugador')
      }
    })
  }

  function handleEliminar(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await eliminarJugador(id)
        setConfirmDeleteId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar')
      }
    })
  }

  function handleSortear() {
    setError(null)
    startTransition(async () => {
      try {
        await realizarSorteo()
        setConfirmSorteo(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al sortear')
      }
    })
  }

  function handleReset() {
    setError(null)
    startTransition(async () => {
      try {
        await resetearSorteo()
        setConfirmReset(false)
        setMostrarAsignaciones(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al resetear')
      }
    })
  }

  const revelados = initialJugadores.filter(j => j.revelado_at).length

  return (
    <main className="min-h-screen bg-[#0D0D12] p-4 md:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🎁 Amigo Invisible</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {initialJugadores.length} jugador{initialJugadores.length !== 1 ? 'es' : ''}
              {sorteado && ` · ${revelados}/${initialJugadores.length} revelados`}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            sorteado
              ? 'bg-green-500/10 text-green-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            {sorteado ? 'Sorteado' : 'Abierto'}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Formulario agregar (solo si abierto) */}
        {!sorteado && (
          <form onSubmit={handleAgregar} className="flex gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Nombre del jugador"
              maxLength={40}
              disabled={isPending}
              className="flex-1 bg-[#1E1E28] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !inputValue.trim()}
              className="px-5 py-3 bg-[#1A3A6B] hover:bg-[#274d8a] border-2 border-[#C9A84C] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
            >
              Agregar
            </button>
          </form>
        )}

        {/* Lista de jugadores */}
        {initialJugadores.length === 0 ? (
          <div className="bg-[#1E1E28] rounded-xl px-4 py-10 text-center text-white/30 text-sm">
            Aún no hay jugadores. Agregá uno arriba.
          </div>
        ) : (
          <div className="bg-[#1E1E28] border border-white/5 rounded-xl overflow-hidden" style={{ opacity: isPending ? 0.6 : 1 }}>
            <ul className="divide-y divide-white/5">
              {initialJugadores.map(j => {
                const isConfirmDelete = confirmDeleteId === j.id
                return (
                  <li key={j.id} className="flex items-center gap-3 px-4 py-3">

                    {/* Avatar inicial */}
                    <div className="w-8 h-8 rounded-full bg-[#1A3A6B] border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] font-bold text-sm shrink-0 select-none">
                      {j.nombre[0]?.toUpperCase()}
                    </div>

                    {/* Nombre + estado */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{j.nombre}</p>
                      {sorteado && (
                        <p className="text-xs mt-0.5">
                          {j.revelado_at
                            ? <span className="text-green-400">Ya reveló</span>
                            : <span className="text-white/30">Pendiente</span>
                          }
                          {mostrarAsignaciones && j.asignado_nombre && (
                            <span className="text-[#C9A84C] ml-2">→ {j.asignado_nombre}</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    {isConfirmDelete ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-white/40 hidden sm:inline">¿Eliminar?</span>
                        <button
                          onClick={() => handleEliminar(j.id)}
                          className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 text-xs font-semibold rounded transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyLink(j.token, j.id)}
                          disabled={isPending}
                          title="Copiar link"
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors disabled:opacity-20 relative"
                        >
                          {copiedId === j.id
                            ? <span className="text-[10px] text-green-400 font-bold">✓</span>
                            : <IconCopy className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => shareWhatsApp(j.nombre, j.token)}
                          disabled={isPending}
                          title="Compartir por WhatsApp"
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-green-500/20 text-white/40 hover:text-green-400 flex items-center justify-center transition-colors disabled:opacity-20"
                        >
                          <IconWhatsApp className="w-3.5 h-3.5" />
                        </button>
                        {!sorteado && (
                          <button
                            onClick={() => setConfirmDeleteId(j.id)}
                            disabled={isPending}
                            title="Eliminar jugador"
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors disabled:opacity-20"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Botones de acción principales */}
        <div className="flex flex-col gap-3">

          {/* Mostrar/ocultar asignaciones (solo post-sorteo) */}
          {sorteado && (
            <button
              onClick={() => setMostrarAsignaciones(v => !v)}
              className="w-full py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              {mostrarAsignaciones ? 'Ocultar asignaciones' : 'Mostrar asignaciones (solo admin)'}
            </button>
          )}

          {/* Realizar sorteo */}
          {!sorteado && initialJugadores.length >= 2 && (
            confirmSorteo ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSortear}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#C9A84C] hover:bg-[#b8943e] disabled:opacity-40 transition-colors"
                >
                  {isPending ? 'Sorteando…' : 'Sí, realizar sorteo'}
                </button>
                <button
                  onClick={() => setConfirmSorteo(false)}
                  className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmSorteo(true)}
                disabled={isPending}
                className="w-full py-4 rounded-xl text-base font-bold text-white bg-[#1A3A6B] hover:bg-[#274d8a] border-2 border-[#C9A84C] disabled:opacity-40 transition-colors"
              >
                🎲 Realizar sorteo
              </button>
            )
          )}

          {!sorteado && initialJugadores.length < 2 && initialJugadores.length > 0 && (
            <p className="text-center text-white/30 text-xs">
              Necesitás al menos 2 jugadores para sortear
            </p>
          )}

          {/* Resetear (solo post-sorteo) */}
          {sorteado && (
            confirmReset ? (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors"
                >
                  {isPending ? 'Reseteando…' : 'Sí, resetear todo'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={isPending}
                className="w-full py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 disabled:opacity-40 transition-colors"
              >
                Resetear sorteo (borra asignaciones, mantiene jugadores)
              </button>
            )
          )}

        </div>

        {/* Back al admin */}
        <a
          href="/admin"
          className="text-center text-white/20 hover:text-white/40 text-xs transition-colors"
        >
          ← Volver al panel de premios
        </a>

      </div>
    </main>
  )
}
