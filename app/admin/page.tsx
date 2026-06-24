// Auth protection se agrega en la Fase 6 (middleware Supabase Auth)
import { getPremios, getGanadores, getStats } from '@/lib/premiacion/actions'
import { AdminPanel } from '@/components/premiacion/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [premios, ganadores, stats] = await Promise.all([
    getPremios(),
    getGanadores(),
    getStats(),
  ])

  return (
    <AdminPanel
      initialPremios={premios}
      initialGanadores={ganadores}
      initialStats={stats}
    />
  )
}
