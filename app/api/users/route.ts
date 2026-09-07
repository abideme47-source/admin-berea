import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 })
    }
    
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Failed to list users:', listError)
      return NextResponse.json({ error: 'Failed to list users: ' + listError.message }, { status: 500 })
    }
    
    const { data: adminsData } = await supabase
      .from('admins')
      .select('user_id, role')

    const adminMap = new Map((adminsData || []).map((a: any) => [a.user_id, a.role]))

    const users = (usersData?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email || '',
      name: u.user_metadata?.name || '',
      role: adminMap.get(u.id) || 'member',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      providers: u.identities?.map((i: any) => i.provider) || [],
    }))

    return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users: ' + (error as any).message }, { status: 500 })
  }
}
