'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { EstadoJuego } from './types'

export async function estadoJuego(token: string): Promise<EstadoJuego> {
  const admin = createAdminClient()

  const { data: cfg } = await admin
    .from('amigo_invisible_config').select('estado, titulo').eq('id', 1).single()

  const { data: yo } = await admin
    .from('amigo_invisible_jugadores')
    .select('id, nombre, asignado_a, revelado_at')
    .eq('token', token)
    .maybeSingle()
  if (!yo) return { valido: false }

  const { data: todos } = await admin
    .from('amigo_invisible_jugadores')
    .select('id, nombre, asignado_a, revelado_at')

  // Targets ya revelados por otros → sacar del pool visible
  const regaladosRevelados = new Set(
    (todos ?? []).filter(j => j.revelado_at).map(j => j.asignado_a)
  )

  // Pool disponible = todos menos yo, menos los ya revelados como regalados
  // (mi asignado siempre queda dentro porque nadie más lo tiene)
  const disponibles = (todos ?? [])
    .filter(j => j.id !== yo.id && !regaladosRevelados.has(j.id))
    .map(j => j.nombre)

  let miAsignado: string | null = null
  if (yo.revelado_at && yo.asignado_a) {
    miAsignado = (todos ?? []).find(j => j.id === yo.asignado_a)?.nombre ?? null
  }

  return {
    valido: true,
    estado: (cfg?.estado ?? 'abierto') as 'abierto' | 'sorteado',
    titulo: cfg?.titulo ?? null,
    miNombre: yo.nombre,
    yaJugue: !!yo.revelado_at,
    disponibles,
    miAsignado,
  }
}

export async function revelarAsignacion(token: string): Promise<{ nombre: string; primeraVez: boolean }> {
  const admin = createAdminClient()

  // Atómico: solo la PRIMERA llamada flipea revelado_at
  const { data: primerReveal } = await admin
    .from('amigo_invisible_jugadores')
    .update({ revelado_at: new Date().toISOString() })
    .eq('token', token)
    .is('revelado_at', null)
    .select('asignado_a')
    .maybeSingle()

  let asignadoId = primerReveal?.asignado_a ?? null
  const primeraVez = !!primerReveal

  if (!primeraVez) {
    const { data: existente } = await admin
      .from('amigo_invisible_jugadores')
      .select('asignado_a')
      .eq('token', token)
      .maybeSingle()
    if (!existente) throw new Error('Link inválido.')
    asignadoId = existente.asignado_a
  }

  if (!asignadoId) throw new Error('El sorteo todavía no se realizó.')

  const { data: target } = await admin
    .from('amigo_invisible_jugadores')
    .select('nombre')
    .eq('id', asignadoId)
    .single()

  return { nombre: target!.nombre, primeraVez }
}
