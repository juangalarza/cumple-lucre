'use client'

import { useState, useEffect } from 'react'
import { WheelPage } from './WheelCanvas'
import type { PremioSlim, SorteoResult } from '@/lib/premiacion/types'
import { getPrizeImageSrc } from '@/lib/premiacion/prize-images'

const STORAGE_KEY = 'sorteo-cumple-participacion'
const RESET_TOKEN = 'Lucre45'

interface ParticipacionRecord {
  nombre: string
  premio: { nombre: string; emoji: string } | null
}

type Screen = 'loading' | 'name-input' | 'wheel' | 'ya-participo'

// ── Pantalla: ya participó ────────────────────────────────────────────────────
function YaParticipoScreen({ record }: { record: ParticipacionRecord }) {
  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {record.premio ? (
          <>
            {(() => {
              const src = getPrizeImageSrc(record.premio.nombre)
              return src
                ? <img src={src} alt={record.premio.nombre} className="w-24 h-24 object-contain animate-bounce select-none" />
                : <div className="text-7xl select-none animate-bounce">{record.premio.emoji}</div>
            })()}
            <div>
              <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-1">
                ¡Ya participaste!
              </p>
              <h1 className="text-2xl font-bold text-white">
                {record.nombre}, ganaste
              </h1>
              <p className="text-xl font-semibold text-white/80 mt-1">{record.premio.nombre}</p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div className="bg-[#16161E] border border-[#C9A84C]/20 rounded-2xl p-5 flex flex-col items-center gap-3">
              <span className="text-3xl">🍹</span>
              <p className="text-white/60 text-sm leading-relaxed">
                Ya participaste, pero podés ir a probar los tragos que{' '}
                <span className="text-white font-semibold">la puta ama</span> preparó para vos.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-7xl select-none">🎉</div>
            <div>
              <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-1">
                ¡Ya participaste!
              </p>
              <h1 className="text-2xl font-bold text-white">{record.nombre}</h1>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div className="bg-[#16161E] border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-3">
              <span className="text-3xl">🍹</span>
              <p className="text-white/60 text-sm leading-relaxed">
                Ya participaste, pero podés ir a probar los tragos que{' '}
                <span className="text-white font-semibold">la puta ama</span> preparó para vos.
              </p>
            </div>
          </>
        )}

      </div>
    </main>
  )
}

// ── Pantalla: ingresar nombre ────────────────────────────────────────────────
function NameInputScreen({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-7">

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-6xl select-none mb-1">🎂</div>
          <h1 className="text-2xl font-bold text-white">Cumple de Lucre</h1>
          <p className="text-white/40 text-sm">Ingresá tu nombre para participar en el sorteo</p>
        </div>

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
            required
            maxLength={40}
            autoComplete="given-name"
            className="w-full bg-[#16161E] border border-white/10 rounded-2xl px-5 py-4 text-white text-xl text-center placeholder-white/20 focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full py-4 rounded-2xl text-lg font-bold text-white bg-[#1A3A6B] hover:bg-[#274d8a] active:scale-95 border-2 border-[#C9A84C] transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            ¡Participar! 🎰
          </button>
        </form>

      </div>
    </main>
  )
}

// ── Gate principal ────────────────────────────────────────────────────────────
export function ParticipantGate({ premios }: { premios: PremioSlim[] }) {
  const [screen, setScreen] = useState<Screen>('loading')
  const [inputValue, setInputValue] = useState('')
  const [nombre, setNombre] = useState('')
  const [prevRecord, setPrevRecord] = useState<ParticipacionRecord | null>(null)

  useEffect(() => {
    // Si viene con ?reset=TOKEN, borrar participación y limpiar la URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === RESET_TOKEN) {
      localStorage.removeItem(STORAGE_KEY)
      const clean = new URL(window.location.href)
      clean.searchParams.delete('reset')
      window.history.replaceState({}, '', clean.toString())
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const record = JSON.parse(raw) as ParticipacionRecord
        setPrevRecord(record)
        setScreen('ya-participo')
      } catch {
        setScreen('name-input')
      }
    } else {
      setScreen('name-input')
    }
  }, [])

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setNombre(trimmed)
    setScreen('wheel')
  }

  function handleGanador(result: SorteoResult | null) {
    const record: ParticipacionRecord = {
      nombre,
      premio: result ? { nombre: result.nombre, emoji: result.emoji } : null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    setPrevRecord(record)
  }

  // Pantalla inicial de carga (evita parpadeo mientras lee localStorage)
  if (screen === 'loading') {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (screen === 'ya-participo' && prevRecord) {
    return <YaParticipoScreen record={prevRecord} />
  }

  if (screen === 'name-input') {
    return (
      <NameInputScreen
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleNameSubmit}
      />
    )
  }

  return (
    <WheelPage
      premios={premios}
      participanteName={nombre}
      onGanador={handleGanador}
    />
  )
}
