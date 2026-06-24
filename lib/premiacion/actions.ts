'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Premio, Ganador, SorteoResult, StatsData } from './types'

export async function getPremios(): Promise<Premio[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('prem_premios')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addPremio(
  nombre: string,
  emoji: string,
  stock: number
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prem_premios')
    .insert({ nombre, emoji, stock })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateStock(id: string, nuevoStock: number): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prem_premios')
    .update({ stock: Math.max(0, nuevoStock) })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function toggleActivo(id: string, activo: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prem_premios')
    .update({ activo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function deletePremio(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prem_premios')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function getGanadores(limit = 50): Promise<Ganador[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('prem_ganadores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStats(): Promise<StatsData> {
  const supabase = createAdminClient()
  const [premios, ganadores] = await Promise.all([
    supabase.from('prem_premios').select('stock, activo'),
    supabase.from('prem_ganadores').select('id', { count: 'exact', head: true }),
  ])
  const lista = premios.data ?? []
  return {
    totalPremios:     lista.length,
    premiosActivos:   lista.filter(p => p.activo && p.stock > 0).length,
    stockTotal:       lista.reduce((a, p) => a + p.stock, 0),
    ganadoresTotales: ganadores.count ?? 0,
  }
}

export async function updatePremio(
  id: string,
  data: { emoji: string; nombre: string; stock: number; activo: boolean }
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prem_premios')
    .update({ emoji: data.emoji, nombre: data.nombre, stock: Math.max(0, data.stock), activo: data.activo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function deleteGanador(id: string): Promise<void> {
  const supabase = createAdminClient()

  // Obtener premio_id antes de borrar para restaurar el stock
  const { data: ganador } = await supabase
    .from('prem_ganadores')
    .select('premio_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('prem_ganadores')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Restaurar 1 unidad de stock al premio correspondiente
  if (ganador?.premio_id) {
    const { data: premio } = await supabase
      .from('prem_premios')
      .select('stock')
      .eq('id', ganador.premio_id)
      .single()
    if (premio) {
      await supabase
        .from('prem_premios')
        .update({ stock: premio.stock + 1 })
        .eq('id', ganador.premio_id)
    }
  }

  revalidatePath('/admin')
}

// Llamada desde /api/premiacion/sortear — la RPC es SECURITY DEFINER, no necesita service_role
export async function sortearPremio(): Promise<SorteoResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('sortear_premio')
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return data as SorteoResult
}
