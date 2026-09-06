import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: adminsData } = await supabase
      .from('admins')
      .select('id, user_id, role, permissions, created_at')

    const { data: usersData } = await supabase.auth.admin.listUsers()
    
    const usersMap = new Map((usersData?.users || []).map((u: any) => [u.id, u]))
    
    const admins = (adminsData || []).map((a: any) => {
      const user = usersMap.get(a.user_id)
      return {
        ...a,
        email: user?.email || 'Unknown',
      }
    })

    return NextResponse.json({ admins })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}
