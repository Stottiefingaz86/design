'use client'

import { useState, useEffect } from 'react'
import { useSceneStore } from '@/lib/store/sceneStore'
import { ChatInput } from '../ChatInput'

export function SceneComplete() {
  const brandName = useSceneStore((state) => state.brandName)
  const industry = useSceneStore((state) => state.industry)
  const targetAudience = useSceneStore((state) => state.targetAudience)
  const adjectives = useSceneStore((state) => state.adjectives)
  const goToScene = useSceneStore((state) => state.goToScene)
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowInput(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showInput) {
      const timer = setTimeout(() => {
        goToScene('researching')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showInput, goToScene])

  return (
    <ChatInput show={showInput} showButton={false}>
      <div className="space-y-2">
        <p className="text-xl font-light">Perfect. I've got everything I need.</p>
        <div className="text-sm text-white/60 font-light space-y-1">
          <p><span className="text-white/40">Brand:</span> {brandName}</p>
          <p><span className="text-white/40">Industry:</span> {industry}</p>
          <p><span className="text-white/40">Audience:</span> {targetAudience}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-white/40">Words:</span>
            {adjectives.map((adj, i) => (
              <span key={i} className="px-3 py-1 neu-flat rounded-lg text-xs">
                {adj}
              </span>
            ))}
          </div>
        </div>
        <p className="text-lg text-white/70 mt-4 font-light">
          Let me do some research. I'll be back soon...
        </p>
      </div>
    </ChatInput>
  )
}
