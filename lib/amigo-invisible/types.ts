export interface Jugador {
  id: string
  nombre: string
  token: string
  asignado_a: string | null
  asignado_nombre: string | null
  revelado_at: string | null
  created_at: string
}

export interface Config {
  estado: 'abierto' | 'sorteado'
  titulo: string | null
}

export type EstadoJuego =
  | { valido: false }
  | {
      valido: true
      estado: 'abierto' | 'sorteado'
      titulo: string | null
      miNombre: string
      yaJugue: boolean
      disponibles: string[]
      miAsignado: string | null
    }
