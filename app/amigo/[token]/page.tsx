import { estadoJuego } from '@/lib/amigo-invisible/actions'
import { PlayerGate } from '@/components/amigo-invisible/PlayerGate'

export const dynamic = 'force-dynamic'

interface Props {
  params: { token: string }
}

export default async function AmigoPage({ params }: Props) {
  const estado = await estadoJuego(params.token)

  // Token inválido
  if (!estado.valido) {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 select-none">🔒</div>
        <h1 className="text-xl font-bold text-white mb-2">Link inválido</h1>
        <p className="text-white/40 text-sm">Este link no existe o ya no es válido.</p>
      </main>
    )
  }

  // Sorteo todavía no se realizó
  if (estado.estado === 'abierto') {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 select-none">⏳</div>
        <h1 className="text-xl font-bold text-white mb-2">¡Hola, {estado.miNombre}!</h1>
        <p className="text-white/50 text-sm">El sorteo todavía no se realizó. Volvé más tarde.</p>
      </main>
    )
  }

  // Ya jugó → mostrar resultado directo
  if (estado.yaJugue && estado.miAsignado) {
    return (
      <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#16161E] border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl">
          <div className="text-7xl select-none">🎁</div>
          <div>
            <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-1">
              Tu amigo invisible
            </p>
            <h1 className="text-3xl font-bold text-white">{estado.miAsignado}</h1>
          </div>
          <div className="w-full h-px bg-white/10" />
          <p className="text-white/40 text-sm">Ya jugaste. ¡No lo olvides! 🤫</p>
        </div>
      </main>
    )
  }

  // Puede jugar
  return (
    <PlayerGate
      token={params.token}
      miNombre={estado.miNombre}
      disponibles={estado.disponibles}
    />
  )
}
