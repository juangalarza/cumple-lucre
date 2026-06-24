import type { StatsData } from '@/lib/premiacion/types'

interface Props {
  stats: StatsData
}

export function StatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total premios"  value={stats.totalPremios}       icon="🎁" />
      <StatCard label="Con stock"      value={stats.premiosActivos}      icon="✅" />
      <StatCard label="Stock total"    value={stats.stockTotal}          icon="📦" />
      <StatCard label="Ganadores"      value={stats.ganadoresTotales}    icon="🏆" />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-[#16161E] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <span className="text-2xl select-none">{icon}</span>
      <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}
