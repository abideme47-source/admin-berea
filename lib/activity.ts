import { createClient } from './supabase/client'

export async function logActivity(action: string, details: string = '') {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const adminId = data.user?.id || null
  await supabase.from('activity_log').insert({
    admin_id: adminId,
    action,
    details,
  })
}
