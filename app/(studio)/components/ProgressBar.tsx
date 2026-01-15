'use client'

import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'

export function ProgressBar() {
  const progress = useSceneStore((state) => state.progress)

  return (
    <div className="w-64">
      <div className="neu-inset p-4 rounded-lg">
        <div className="h-1 bg-white/5 overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-white/40"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <div className="text-center mt-2 text-xs text-white/40 agency-font font-light">
          {progress}%
        </div>
      </div>
    </div>
  )
}
