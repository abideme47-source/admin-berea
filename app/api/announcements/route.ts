import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ announcements: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        message: body.message,
        link_url: body.link_url || null,
        link_text: body.link_text || 'Learn More',
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ announcement: data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
