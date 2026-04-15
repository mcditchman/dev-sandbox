'use client'

import { useState } from 'react'

interface ConfirmButtonProps {
  initialCount: number
}

export default function ConfirmButton({ initialCount }: ConfirmButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [confirmed, setConfirmed] = useState(false)

  async function handleConfirm() {
    try {
      const res = await fetch('/api/confirm', { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count)
      setConfirmed(true)
    } catch {
      // Network error — silently ignore, button remains enabled
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-white/70 text-sm">
        {count} {count === 1 ? 'person agrees' : 'people agree'} Uncle Hotdog is dumb
      </p>
      <button
        onClick={handleConfirm}
        disabled={confirmed}
        className="px-8 py-3 rounded-full bg-white text-purple-700 font-semibold text-sm
                   hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        {confirmed ? 'Confirmed ✓' : 'I confirm Uncle Hotdog is dumb'}
      </button>
    </div>
  )
}
