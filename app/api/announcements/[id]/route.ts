import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const body = await request.json()
    
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: body.is_active })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}
