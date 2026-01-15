'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'

export function CreationPanel() {
  const brandName = useSceneStore((state) => state.brandName)
  const industry = useSceneStore((state) => state.industry)
  const targetAudience = useSceneStore((state) => state.targetAudience)
  const companyPillars = useSceneStore((state) => state.companyPillars)
  const colorPreferences = useSceneStore((state) => state.colorPreferences)
  const typographyPreference = useSceneStore((state) => state.typographyPreference)
  const designStyle = useSceneStore((state) => state.designStyle)
  const brandPillars = useSceneStore((state) => state.brandPillars)
  const positioning = useSceneStore((state) => state.positioning)
  const creativeDirections = useSceneStore((state) => state.creativeDirections)
  const selectedDirection = useSceneStore((state) => state.selectedDirection)
  const brandSystem = useSceneStore((state) => state.brandSystem)
  const currentScene = useSceneStore((state) => state.currentScene)

  const hasBriefingData = brandName || industry || targetAudience || companyPillars.length > 0
  const hasResearch = currentScene === 'research' || currentScene === 'strategy' || currentScene === 'creative_directions'
  const hasProduction = currentScene === 'production' || currentScene === 'delivering' || currentScene === 'delivery'

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-white text-xl font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
        The Creation
      </h2>

      {/* Briefing Data */}
      {hasBriefingData && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            Brief
          </h3>
          
          {brandName && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Brand Name</p>
              <p className="text-white text-lg font-light">{brandName}</p>
            </div>
          )}

          {industry && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Industry</p>
              <p className="text-white text-lg font-light">{industry}</p>
            </div>
          )}

          {targetAudience && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Target Audience</p>
              <p className="text-white text-lg font-light">{targetAudience}</p>
            </div>
          )}

          {companyPillars.length > 0 && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-2">Company Pillars</p>
              <div className="flex flex-wrap gap-2">
                {companyPillars.map((pillar, index) => (
                  <span key={index} className="px-3 py-1 neu-flat rounded-lg text-sm text-white/80">
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colorPreferences.length > 0 && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-2">Color Preferences</p>
              <div className="flex flex-wrap gap-2">
                {colorPreferences.map((pref, index) => (
                  <span key={index} className="px-3 py-1 neu-flat rounded-lg text-sm text-white/80">
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {typographyPreference && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Typography</p>
              <p className="text-white text-lg font-light">{typographyPreference.split(',')[0]}</p>
            </div>
          )}

          {designStyle && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Design Style</p>
              <p className="text-white text-lg font-light">{designStyle}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Strategy Data */}
      {brandPillars && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            Strategy
          </h3>

          {positioning && (
            <div className="neu-soft rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Positioning</p>
              <p className="text-white text-base font-light leading-relaxed">{positioning}</p>
            </div>
          )}

          <div className="neu-soft rounded-xl p-4">
            <p className="text-white/60 text-xs mb-2">Brand Pillars</p>
            <div className="space-y-2">
              {brandPillars.map((pillar, index) => (
                <div key={index} className="neu-flat rounded-lg p-3">
                  <p className="text-white text-sm font-light font-bold mb-1">{pillar.name}</p>
                  <p className="text-white/70 text-xs font-light">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Creative Direction */}
      {selectedDirection !== null && creativeDirections && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            Creative Direction
          </h3>

          <div className="neu-soft rounded-xl p-4">
            <p className="text-white text-lg font-light mb-2">{creativeDirections[selectedDirection].name}</p>
            <p className="text-white/70 text-sm font-light">{creativeDirections[selectedDirection].strategicIntent}</p>
          </div>
        </motion.div>
      )}

      {/* Brand System */}
      {brandSystem && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-white/40 text-xs uppercase tracking-wider font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
            Brand System
          </h3>

          <div className="neu-soft rounded-xl p-4">
            <p className="text-white/60 text-xs mb-2">Color Palette</p>
            <div className="flex gap-2 mb-3">
              {brandSystem.palette.primary.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="neu-soft rounded-xl p-4">
            <p className="text-white/60 text-xs mb-1">Typography</p>
            <p className="text-white text-base font-light">{brandSystem.typography.heading}</p>
            <p className="text-white text-sm font-light mt-1">{brandSystem.typography.body}</p>
          </div>
        </motion.div>
      )}

      {!hasBriefingData && !hasResearch && !hasProduction && (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm font-light">Knowledge will appear here as you answer questions</p>
        </div>
      )}
    </div>
  )
}
