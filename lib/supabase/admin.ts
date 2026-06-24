import { createClient } from '@supabase/supabase-js'

// Cliente con service_role: bypasea RLS — solo usar en Server Actions o API Routes
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
