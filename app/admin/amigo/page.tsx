import { getJugadores, getConfig } from '@/lib/amigo-invisible/admin-actions'
import { AmigoAdminPanel } from '@/components/amigo-invisible/AmigoAdminPanel'

export const dynamic = 'force-dynamic'

export default async function AmigoAdminPage() {
  const [jugadores, config] = await Promise.all([
    getJugadores(),
    getConfig(),
  ])

  return (
    <AmigoAdminPanel initialJugadores={jugadores} config={config} />
  )
}
