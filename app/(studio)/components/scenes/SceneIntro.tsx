'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'

export function SceneIntro() {
  const nextScene = useSceneStore((state) => state.nextScene)
  const [showContent, setShowContent] = useState(false)

  // Show content after character arrives (3 seconds walk + 0.5 delay)
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  const handleContinue = () => {
    nextScene()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <h2 className="text-white text-3xl font-bold sf-title">how the Fu@* can the design team help you?</h2>
            <p className="text-white/50 text-xs font-light">this request better be worth my time! - CH, Head of Design</p>
            <motion.button
              onClick={handleContinue}
              className="mt-6 px-8 py-3 neu-flat rounded-lg hover:neu-inset transition-all font-light text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              I need something
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
