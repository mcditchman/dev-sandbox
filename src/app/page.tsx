import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'

export default async function Home() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('roast_confirmations')
    .select('count')
    .eq('id', 1)
    .single()

  const count = data?.count ?? 0

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-6">
      <div className="flex flex-col items-center gap-8 text-center text-white max-w-md w-full">

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">
            Your IQ Results Are In
          </p>
          <p className="text-xs text-white/50">Uncle Hotdog · Official Assessment</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-9xl font-bold leading-none">12</span>
          <span className="text-white/60 text-sm">out of a possible 200</span>
        </div>

        <div className="w-full bg-white/20 rounded-full h-3">
          <div className="bg-red-400 h-3 rounded-full" style={{ width: '6%' }} />
        </div>

        <blockquote className="bg-white/10 rounded-2xl px-6 py-4 text-white/90 italic text-base leading-relaxed">
          &ldquo;Clinically remarkable. We&apos;ve never seen this before.&rdquo;
        </blockquote>

        <ConfirmButton initialCount={count} />

      </div>
    </main>
  )
}
