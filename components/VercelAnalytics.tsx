'use client'

import React, { useEffect, useState } from 'react'

// Dynamically import the Analytics component at runtime so builds won't fail
// when the package isn't installed locally (useful during CI or before npm install).
export default function VercelAnalytics(){
  const [Comp, setComp] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    let mounted = true
    import('@vercel/analytics/react')
      .then(mod => {
        if (mounted) setComp(() => mod.Analytics || mod.default || null)
      })
      .catch(() => {
        // module missing (not installed) — silently ignore so dev/build doesn't break
      })
    return () => { mounted = false }
  }, [])

  if (!Comp) return null
  const A = Comp
  return <A />
}
