import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Fetch current count
  const { data: current, error: fetchError } = await supabase
    .from('roast_confirmations')
    .select('count')
    .eq('id', 1)
    .single()

  if (fetchError || current === null) {
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
  }

  // Increment and save
  const { data: updated, error: updateError } = await supabase
    .from('roast_confirmations')
    .update({ count: current.count + 1 })
    .eq('id', 1)
    .select('count')
    .single()

  if (updateError || updated === null) {
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 })
  }

  return NextResponse.json({ count: updated.count })
}
