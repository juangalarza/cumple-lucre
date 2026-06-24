export interface Premio {
  id: string
  nombre: string
  emoji: string
  stock: number
  activo: boolean
  created_at: string
  updated_at: string
}

export type PremioSlim = Pick<Premio, 'id' | 'nombre' | 'emoji' | 'stock'>

export interface Ganador {
  id: string
  premio_id: string | null
  premio_nombre: string
  premio_emoji: string
  participante_nombre: string | null
  created_at: string
}

export interface SorteoResult {
  id: string
  nombre: string
  emoji: string
  ganador_id: string
  error?: 'sin_stock'
}

export interface StatsData {
  totalPremios: number
  premiosActivos: number
  stockTotal: number
  ganadoresTotales: number
}
