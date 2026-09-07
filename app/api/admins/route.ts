import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 })
    }
    
    const { data: adminsData, error: adminsError } = await supabase
      .from('admins')
      .select('id, user_id, role, permissions, created_at')
    
    if (adminsError) {
      console.error('Failed to fetch admins:', adminsError)
      return NextResponse.json({ error: 'Failed to fetch admins: ' + adminsError.message }, { status: 500 })
    }

    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Failed to list users:', usersError)
      return NextResponse.json({ error: 'Failed to list users: ' + usersError.message }, { status: 500 })
    }
    
    const usersMap = new Map((usersData?.users || []).map((u: any) => [u.id, u]))
    
    const admins = (adminsData || []).map((a: any) => {
      const user = usersMap.get(a.user_id)
      return {
        ...a,
        email: user?.email || 'Unknown',
      }
    })

    return NextResponse.json({ admins }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return NextResponse.json({ error: 'Failed to fetch admins: ' + (error as any).message }, { status: 500 })
  }
}
