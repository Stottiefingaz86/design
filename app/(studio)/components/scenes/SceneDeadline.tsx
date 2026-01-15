'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'
import { ChatInput } from '../ChatInput'

const deadlineOptions = [
  'ASAP',
  'This week',
  'Next week',
  'In 2 weeks',
  'In a month',
  'Flexible',
]

export function SceneDeadline() {
  const deadline = useSceneStore((state) => state.deadline)
  const setDeadline = useSceneStore((state) => state.setDeadline)
  const triggerKool = useSceneStore((state) => state.triggerKool)
  const [showOptions, setShowOptions] = useState(false)
  const [customDeadline, setCustomDeadline] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowOptions(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSelectDeadline = (deadlineOption: string) => {
    if (deadlineOption === 'Custom') {
      setShowCustomInput(true)
    } else {
      triggerKool() // Trigger kool animation
      setDeadline(deadlineOption)
    }
  }

  const handleCustomSubmit = (value: string) => {
    if (value.trim()) {
      triggerKool() // Trigger kool animation
      setDeadline(value.trim())
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Question */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-white text-2xl font-bold mb-2 sf-title">when do you need this?</h2>
        <p className="text-white/50 text-sm font-light mb-6">
          Help us prioritize your request
        </p>

        {/* Options */}
        {showOptions && (
          <div className="space-y-3">
            {deadlineOptions.map((option, index) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectDeadline(option)}
                className={`w-full neu-soft rounded-xl p-4 text-left transition-all ${
                  deadline === option
                    ? 'ring-2 ring-white/50 neu-inset'
                    : 'hover:neu-inset hover:ring-2 hover:ring-white/20'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-white text-lg font-light">{option}</span>
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: deadlineOptions.length * 0.1 }}
              onClick={() => handleSelectDeadline('Custom')}
              className={`w-full neu-soft rounded-xl p-4 text-left transition-all ${
                showCustomInput
                  ? 'ring-2 ring-white/50 neu-inset'
                  : 'hover:neu-inset hover:ring-2 hover:ring-white/20'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-white text-lg font-light">Custom</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Custom input at bottom if "Custom" selected */}
      {showCustomInput && (
        <div className="border-t border-white/5 p-4">
          <ChatInput
            show={true}
            value={customDeadline}
            onChange={setCustomDeadline}
            onSubmit={handleCustomSubmit}
            placeholder="Enter deadline..."
          />
        </div>
      )}
    </div>
  )
}
