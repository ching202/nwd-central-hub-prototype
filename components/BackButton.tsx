'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      style={{
        marginBottom: 16,
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      ← Back
    </button>
  )
}