import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { data: newCount, error } = await supabase.rpc('increment_roast_count')

  if (error || newCount === null) {
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 })
  }

  return NextResponse.json({ count: newCount })
}
