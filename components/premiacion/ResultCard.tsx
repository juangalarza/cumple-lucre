interface Props {
  nombre:       string
  emoji:        string
  participante?: string
}

export function ResultCard({ nombre, emoji, participante }: Props) {
  return (
    <main className="min-h-screen bg-[#0D0D12] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-[#16161E] border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl">

        <div className="text-8xl animate-bounce select-none">{emoji}</div>

        <div>
          {participante && (
            <p className="text-white/40 text-sm mb-1">¡{participante},</p>
          )}
          <p className="text-[#C9A84C] font-semibold text-xs uppercase tracking-widest mb-1">
            ¡Ganaste!
          </p>
          <h1 className="text-3xl font-bold text-white">{nombre}</h1>
        </div>

        <div className="w-full h-px bg-white/10" />

        <p className="text-white/50 text-sm leading-relaxed">
          Mostrá esta pantalla al organizador para canjear tu premio 🎉
        </p>
        <p className="text-white/30 text-sm leading-relaxed">
          Y animate a probar los tragos que <span className="text-white/60 font-semibold">la puta ama</span> preparó para vos 🍹
        </p>

      </div>
    </main>
  )
}
