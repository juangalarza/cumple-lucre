import { NextResponse, type NextRequest } from 'next/server'
import { sortearPremio } from '@/lib/premiacion/actions'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { nombre?: string }
    const participante_nombre = body.nombre?.trim() || null

    const result = await sortearPremio()

    if (result.error === 'sin_stock') {
      return NextResponse.json({ error: 'sin_stock' }, { status: 409 })
    }

    // Guardar nombre del participante en el registro del ganador
    if (participante_nombre && result.ganador_id) {
      const supabase = createAdminClient()
      await supabase
        .from('prem_ganadores')
        .update({ participante_nombre })
        .eq('id', result.ganador_id)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
