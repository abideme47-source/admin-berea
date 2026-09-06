import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    const activitiesWithEmail = await Promise.all((data || []).map(async (a: any) => {
      if (!a.admin_id) return { ...a, admin_email: 'system' }
      const { data: user } = await supabase.auth.admin.getUserById(a.admin_id)
      return { ...a, admin_email: user?.user?.email || 'unknown' }
    }))

    return NextResponse.json({ activities: activitiesWithEmail })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
