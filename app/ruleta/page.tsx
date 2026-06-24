import { createClient } from '@/lib/supabase/server'
import { ParticipantGate } from '@/components/premiacion/ParticipantGate'

export const dynamic = 'force-dynamic'

export default async function RuletaPage() {
  const supabase = createClient()
  const { data: premios } = await supabase
    .from('prem_premios')
    .select('id, nombre, emoji, stock')
    .eq('activo', true)
    .gt('stock', 0)
    .order('created_at', { ascending: true })

  return <ParticipantGate premios={premios ?? []} />
}
