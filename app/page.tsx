'use client'

import { AnimatePresence } from 'framer-motion'
import { WalkingSprite } from './(studio)/components/WalkingSprite'
import { LillySprite } from './(studio)/components/LillySprite'
import { LillySpeechBubble } from './(studio)/components/LillySpeechBubble'
import { CharacterAura } from './(studio)/components/CharacterAura'
import { ClarityGradient } from './(studio)/components/ClarityGradient'
import { KnowledgeTags } from './(studio)/components/KnowledgeTags'
import { SceneIntro } from './(studio)/components/scenes/SceneIntro'
import { SceneRequestArea } from './(studio)/components/scenes/SceneRequestArea'
import { SceneUserRequest } from './(studio)/components/scenes/SceneUserRequest'
import { SceneDeadline } from './(studio)/components/scenes/SceneDeadline'
import { SceneConfirmation } from './(studio)/components/scenes/SceneConfirmation'
import { SceneDelivering } from './(studio)/components/scenes/SceneDelivering'
import { useSceneStore } from '@/lib/store/sceneStore'

export default function StudioPage() {
  const currentScene = useSceneStore((state) => state.currentScene)
  const showLilly = useSceneStore((state) => state.showLilly)
  const isWalkingOut = useSceneStore((state) => state.isWalkingOut)
  const requestArea = useSceneStore((state) => state.requestArea)
  const userRequest = useSceneStore((state) => state.userRequest)
  
  // Use a stable key for WalkingSprite so it doesn't remount during normal scene transitions
  // The component's internal useEffect will handle resetting when needed
  const spriteKey = 'walking-sprite'

  const renderScene = () => {
    switch (currentScene) {
      case 'intro':
        return <SceneIntro key="intro" />
      case 'request_area':
        return <SceneRequestArea key="request_area" />
      case 'user_request':
        return <SceneUserRequest key="user_request" />
      case 'deadline':
        return <SceneDeadline key="deadline" />
      case 'confirmation':
        return <SceneConfirmation key="confirmation" />
      case 'delivering':
        return <SceneDelivering key="delivering" />
      default:
        return null
    }
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex relative overflow-hidden">
      {/* Logo - top left */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <img 
          src="/logo..svg" 
          alt="Logo" 
          className="h-8 w-auto"
        />
      </div>

      {/* Center - Character area with aura and knowledge tags */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Knowledge Tags at bottom - lowest z-index */}
        <KnowledgeTags />
        
        {/* Clarity Gradient - grows as questions are answered */}
        <ClarityGradient />
        
        {/* Character Aura - middle z-index */}
        <CharacterAura />
        
        {/* Walking Sprite - centered - highest z-index, always on top */}
        <div className="relative pointer-events-none" style={{ zIndex: 100 }}>
          {/* Show CH if not showing Lilly, or if CH is walking out (so we see both) */}
          {/* Priority: if isWalkingOut is true, always show CH */}
          {/* Use resetKey to force remount when going back to intro after reset */}
          {(isWalkingOut || !showLilly) && (
            <WalkingSprite key={spriteKey} />
          )}
          {/* Show Lilly when showLilly is true - appears while CH is walking out */}
          {showLilly && (
            <div className="relative">
              <LillySprite />
              <LillySpeechBubble />
            </div>
          )}
        </div>
      </div>
      
      {/* Right sidebar - Questions, options, and chat */}
      <div className="w-96 border-l border-white/5 bg-[#0a0a0a] h-full overflow-hidden flex flex-col" style={{ zIndex: 40 }}>
        <AnimatePresence mode="wait">
          {renderScene()}
        </AnimatePresence>
      </div>
    </div>
  )
}
