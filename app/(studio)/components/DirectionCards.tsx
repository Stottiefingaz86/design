'use client'

import { motion } from 'framer-motion'
import { useStudioStore } from '@/lib/store/studioStore'
import { staggerContainer, staggerItem, scaleIn } from '@/lib/motion/transitions'

export function DirectionCards() {
  const directions = useStudioStore((state) => state.directions)
  const selectDirection = useStudioStore((state) => state.selectDirection)
  const approveDirections = useStudioStore((state) => state.approveDirections)

  if (directions.length === 0) return null

  const hasSelection = directions.some((d) => d.selected)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {directions.map((direction, index) => (
        <motion.div
          key={direction.id}
          variants={staggerItem}
          className="relative"
        >
          <motion.button
            onClick={() => selectDirection(direction.id)}
            className={`relative w-full p-6 rounded-2xl border-2 transition-all ${
              direction.selected
                ? 'border-white bg-white/10'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-xl font-bold mb-2">{direction.name}</h3>
            <p className="text-sm text-white/70 mb-4">{direction.description}</p>
            
            {/* Color palette preview */}
            <div className="flex gap-2 mb-4">
              {direction.palette.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="text-xs text-white/50">{direction.mood}</div>

            {/* Selection indicator */}
            {direction.selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white flex items-center justify-center"
              >
                <span className="text-black text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        </motion.div>
      ))}

      {/* Approve button */}
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full flex justify-center mt-8"
        >
          <motion.button
            onClick={approveDirections}
            className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Approve Direction
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
