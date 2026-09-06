import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: usersData } = await supabase.auth.admin.listUsers()
    
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

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
