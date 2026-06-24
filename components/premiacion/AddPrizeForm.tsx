'use client'

import { useState, useTransition } from 'react'
import { addPremio } from '@/lib/premiacion/actions'

interface Props {
  onClose: () => void
}

export function AddPrizeForm({ onClose }: Props) {
  const [nombre, setNombre] = useState('')
  const [emoji,  setEmoji]  = useState('🎁')
  const [stock,  setStock]  = useState(10)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    startTransition(async () => {
      await addPremio(nombre.trim(), emoji, stock)
      onClose()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#1E1E28] border border-white/10 rounded-2xl p-6 flex flex-col gap-5"
    >
      <h3 className="font-semibold text-white">Nuevo premio</h3>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Emoji */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wide">
            Emoji
          </label>
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={2}
            className="w-16 text-center text-2xl bg-[#16161E] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#7C5CFC] transition-colors"
          />
        </div>

        {/* Nombre */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wide">
            Nombre del premio
          </label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="ej. Campera"
            required
            className="bg-[#16161E] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#7C5CFC] transition-colors"
          />
        </div>

        {/* Stock */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wide">
            Stock inicial
          </label>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(Math.max(1, Number(e.target.value)))}
            min={1}
            className="w-28 bg-[#16161E] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7C5CFC] transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !nombre.trim()}
          className="px-5 py-2 bg-[#7C5CFC] hover:bg-[#6a4de0] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Guardando…' : 'Guardar premio'}
        </button>
      </div>
    </form>
  )
}
