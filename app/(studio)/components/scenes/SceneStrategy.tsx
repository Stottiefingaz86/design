'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'
import { ThinkingBubble } from '../ThinkingBubble'

const thinkingMessages = [
  'Synthesizing insights...',
  'Defining brand pillars...',
  'Crafting positioning...',
  'Exploring tagline options...',
]

export function SceneStrategy() {
  const industry = useSceneStore((state) => state.industry)
  const targetAudience = useSceneStore((state) => state.targetAudience)
  const companyPillars = useSceneStore((state) => state.companyPillars)
  const colorPreferences = useSceneStore((state) => state.colorPreferences)
  const typographyPreference = useSceneStore((state) => state.typographyPreference)
  const designStyle = useSceneStore((state) => state.designStyle)
  const researchData = useSceneStore((state) => state.researchData)
  const brandPillars = useSceneStore((state) => state.brandPillars)
  const positioning = useSceneStore((state) => state.positioning)
  const taglineOptions = useSceneStore((state) => state.taglineOptions)
  const setStrategy = useSceneStore((state) => state.setStrategy)
  const goToScene = useSceneStore((state) => state.goToScene)
  const [isGenerating, setIsGenerating] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isGenerating && !brandPillars) {
      const fetchStrategy = async () => {
        try {
          const response = await fetch('/api/creative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              industry,
              targetAudience,
              companyPillars,
              colorPreferences,
              typographyPreference,
              designStyle,
              researchData,
            }),
          })
          const data = await response.json()
          setStrategy(data.strategy)
          setIsGenerating(false)
          setTimeout(() => setShowContent(true), 500)
        } catch (error) {
          console.error('Strategy generation failed:', error)
          setIsGenerating(false)
        }
      }

      fetchStrategy()
    } else if (!isGenerating) {
      setShowContent(true)
    }
  }, [isGenerating, brandPillars, industry, targetAudience, companyPillars, colorPreferences, typographyPreference, designStyle, researchData, setStrategy])

  const handleContinue = () => {
    goToScene('creative_directions')
  }

  return (
    <div className="h-full flex flex-col">
      {isGenerating && (
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="text-center space-y-4 w-full">
            <h2 className="text-white text-2xl font-bold sf-title mb-4">Synthesizing Strategy...</h2>
            <ThinkingBubble messages={thinkingMessages} inline={true} />
          </div>
        </div>
      )}

      {showContent && brandPillars && positioning && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-white text-2xl font-bold sf-title mb-2">Brand Strategy</h2>
              <p className="text-white/50 text-sm font-light mb-6">
                Your brand positioning and pillars
              </p>
            </div>

            {/* Positioning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neu-soft rounded-xl p-4"
            >
              <h3 className="text-white/40 text-xs uppercase tracking-wider mb-3 font-bold sf-title">Brand Positioning</h3>
              <p className="text-white/80 text-base font-light leading-relaxed">{positioning}</p>
            </motion.div>

            {/* Brand Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold sf-title">Brand Pillars</h3>
              <div className="space-y-2">
                {brandPillars.map((pillar, index) => (
                  <motion.div
                    key={pillar.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="neu-flat rounded-lg p-4"
                  >
                    <h4 className="text-white text-base font-light mb-1">{pillar.name}</h4>
                    <p className="text-white/70 text-sm font-light">{pillar.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Tagline Options */}
            {taglineOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="neu-soft rounded-xl p-4"
              >
                <h3 className="text-white/40 text-xs uppercase tracking-wider mb-3 font-bold sf-title">Tagline Options</h3>
                <div className="space-y-2">
                  {taglineOptions.map((tagline, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="text-white/80 text-sm font-light"
                    >
                      "{tagline}"
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Continue button at bottom */}
          <div className="border-t border-white/5 p-4">
            <motion.button
              onClick={handleContinue}
              className="w-full px-6 py-3 neu-flat rounded-lg hover:neu-inset transition-all font-light"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue to Creative Directions
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}
