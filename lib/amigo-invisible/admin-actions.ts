'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import type { Jugador, Config } from './types'

function genToken() {
  return randomBytes(8).toString('base64url')
}

export async function getJugadores(): Promise<Jugador[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('amigo_invisible_jugadores')
    .select('id, nombre, telefono, token, asignado_a, revelado_at, created_at')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  const jugadores = data ?? []
  const nameMap = new Map(jugadores.map(j => [j.id, j.nombre]))

  return jugadores.map(j => ({
    ...j,
    asignado_nombre: j.asignado_a ? (nameMap.get(j.asignado_a) ?? null) : null,
  }))
}

export async function getConfig(): Promise<Config> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('amigo_invisible_config')
    .select('estado, titulo')
    .eq('id', 1)
    .single()
  return (data as Config) ?? { estado: 'abierto', titulo: null }
}

export async function agregarJugador(nombre: string, telefono?: string): Promise<void> {
  const admin = createAdminClient()
  const { data: cfg } = await admin
    .from('amigo_invisible_config').select('estado').eq('id', 1).single()
  if (cfg?.estado === 'sorteado')
    throw new Error('El sorteo ya se realizó; no se pueden agregar jugadores.')

  const { error } = await admin
    .from('amigo_invisible_jugadores')
    .insert({
      nombre: nombre.trim(),
      token: genToken(),
      telefono: telefono?.trim() || null,
    })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/amigo')
}

export async function eliminarJugador(id: string): Promise<void> {
  const admin = createAdminClient()
  const { data: cfg } = await admin
    .from('amigo_invisible_config').select('estado').eq('id', 1).single()
  if (cfg?.estado === 'sorteado')
    throw new Error('No se puede eliminar jugadores después del sorteo.')

  const { error } = await admin
    .from('amigo_invisible_jugadores').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/amigo')
}

export async function realizarSorteo(): Promise<void> {
  const admin = createAdminClient()

  const { data: cfg } = await admin
    .from('amigo_invisible_config').select('estado').eq('id', 1).single()
  if (cfg?.estado === 'sorteado')
    throw new Error('El sorteo ya fue realizado.')

  const { data: jugadores } = await admin
    .from('amigo_invisible_jugadores').select('id')
  if (!jugadores || jugadores.length < 2)
    throw new Error('Se necesitan al menos 2 jugadores.')

  // Fisher-Yates shuffle
  const ids = jugadores.map(j => j.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[k]] = [ids[k], ids[i]]
  }

  // Derangement por método de ciclo: cada uno regala al siguiente del anillo
  for (let i = 0; i < ids.length; i++) {
    const { error } = await admin
      .from('amigo_invisible_jugadores')
      .update({ asignado_a: ids[(i + 1) % ids.length] })
      .eq('id', ids[i])
    if (error) throw new Error(error.message)
  }

  await admin
    .from('amigo_invisible_config')
    .update({ estado: 'sorteado' }).eq('id', 1)

  revalidatePath('/admin/amigo')
}

export async function resetearSorteo(): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('amigo_invisible_jugadores')
    .update({ asignado_a: null, revelado_at: null })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  await admin
    .from('amigo_invisible_config')
    .update({ estado: 'abierto' }).eq('id', 1)
  revalidatePath('/admin/amigo')
}
