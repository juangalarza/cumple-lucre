'use client'

import { useState, useTransition } from 'react'
import { updateStock, deletePremio, updatePremio } from '@/lib/premiacion/actions'
import type { Premio } from '@/lib/premiacion/types'

interface Props { premios: Premio[] }

interface EditForm {
  emoji:  string
  nombre: string
  stock:  number
  activo: boolean
}

function StatusBadge({ premio }: { premio: Premio }) {
  if (!premio.activo || premio.stock === 0) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
        Sin stock
      </span>
    )
  }
  if (premio.stock < 5) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
        Poco stock
      </span>
    )
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
      Disponible
    </span>
  )
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 2.474L5.01 12.378l-3.468.694.694-3.468L11.013 1.427Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3 4l.75 9.5h8.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PrizesTable({ premios }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId]    = useState<string | null>(null)
  const [editForm,  setEditForm]     = useState<EditForm | null>(null)
  const [confirmId, setConfirmId]    = useState<string | null>(null)

  function startEdit(p: Premio) {
    setConfirmId(null)
    setEditingId(p.id)
    setEditForm({ emoji: p.emoji, nombre: p.nombre, stock: p.stock, activo: p.activo })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  function saveEdit() {
    if (!editingId || !editForm) return
    startTransition(async () => {
      await updatePremio(editingId, editForm)
      setEditingId(null)
      setEditForm(null)
    })
  }

  if (premios.length === 0) {
    return (
      <p className="text-center py-10 text-white/30 text-sm">
        No hay premios. Agregá uno con el botón de arriba.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2" style={{ opacity: isPending ? 0.6 : 1 }}>
      {premios.map(premio => {
        const isEditing = editingId === premio.id && editForm !== null
        const isConfirm = confirmId === premio.id

        // ── Modo edición ───────────────────────────────────────────────────
        if (isEditing && editForm) {
          return (
            <div key={premio.id} className="bg-[#1E1E28] border border-[#7C5CFC]/40 rounded-xl p-4 flex flex-col gap-3">
              {/* Fila 1: emoji + nombre */}
              <div className="flex gap-2">
                <input
                  value={editForm.emoji}
                  onChange={e => setEditForm({ ...editForm, emoji: e.target.value })}
                  maxLength={2}
                  placeholder="🎁"
                  className="w-12 shrink-0 bg-[#0D0D12] border border-white/15 rounded-lg px-2 py-2 text-white text-center text-lg focus:outline-none focus:border-[#7C5CFC] transition-colors"
                />
                <input
                  value={editForm.nombre}
                  onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                  placeholder="Nombre del premio"
                  className="flex-1 bg-[#0D0D12] border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                />
              </div>

              {/* Fila 2: stock + activo + botones */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/40">Stock</span>
                  <input
                    type="number"
                    min={0}
                    value={editForm.stock}
                    onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-20 bg-[#0D0D12] border border-white/15 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-[#7C5CFC] transition-colors"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={e => setEditForm({ ...editForm, activo: e.target.checked })}
                    className="w-4 h-4 accent-[#7C5CFC]"
                  />
                  <span className="text-sm text-white/60">Activo</span>
                </label>

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isPending || !editForm.nombre.trim() || !editForm.emoji.trim()}
                    className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6a4de0] text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )
        }

        // ── Modo normal ────────────────────────────────────────────────────
        return (
          <div
            key={premio.id}
            className="bg-[#1E1E28] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            {/* Emoji */}
            <span className="text-2xl select-none shrink-0">{premio.emoji}</span>

            {/* Nombre + estado */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm leading-tight truncate">
                {premio.nombre}
              </p>
              <div className="mt-1">
                <StatusBadge premio={premio} />
              </div>
            </div>

            {/* Stock ± */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => startTransition(() => updateStock(premio.id, premio.stock - 1))}
                disabled={isPending || premio.stock === 0}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-bold text-lg disabled:opacity-20 transition-colors flex items-center justify-center leading-none"
              >
                −
              </button>
              <span className="w-8 text-center text-white font-mono text-sm tabular-nums">
                {premio.stock}
              </span>
              <button
                onClick={() => startTransition(() => updateStock(premio.id, premio.stock + 1))}
                disabled={isPending}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-bold text-lg disabled:opacity-20 transition-colors flex items-center justify-center leading-none"
              >
                +
              </button>
            </div>

            {/* Botones acción */}
            {isConfirm ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-white/40 hidden sm:inline">¿Eliminar?</span>
                <button
                  onClick={() => {
                    setConfirmId(null)
                    startTransition(() => deletePremio(premio.id))
                  }}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 active:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-semibold rounded-lg transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(premio)}
                  disabled={isPending}
                  title="Editar premio"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#7C5CFC]/20 active:bg-[#7C5CFC]/30 text-white/40 hover:text-[#7C5CFC] disabled:opacity-20 transition-colors flex items-center justify-center"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmId(premio.id)}
                  disabled={isPending}
                  title="Eliminar premio"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/15 active:bg-red-500/25 text-white/40 hover:text-red-400 disabled:opacity-20 transition-colors flex items-center justify-center"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
