'use client'

import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'
import { useState, useEffect } from 'react'
import { WalkingOutBubble } from './WalkingOutBubble'
import { CHIntroBubble } from './CHIntroBubble'

export function WalkingSprite() {
  const currentScene = useSceneStore((state) => state.currentScene)
  const triggerKoolAnimation = useSceneStore((state) => state.triggerKoolAnimation)
  const isDesigning = useSceneStore((state) => state.isDesigning)
  const isWalkingOut = useSceneStore((state) => state.isWalkingOut)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isWalking, setIsWalking] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasArrived, setHasArrived] = useState(false)
  const [walkOutComplete, setWalkOutComplete] = useState(false)
  const [animationState, setAnimationState] = useState<'walking' | 'idle' | 'kool' | 'designing' | 'walkingOut'>('walking')

  // Walking animation: 4 frames
  const walkingFrameCount = 4
  // Idle animation: 6 frames (images 5-10)
  const idleFrameCount = 6
  const idleStartFrame = 5 // First idle frame number
  // Kool animation: 6 frames (1-6)
  const koolFrameCount = 6
  // Designing animation: loop kool animation
  const designingFrameCount = 6
  const fps = 10
  const displayHeight = 120

  // Reset when scene changes to intro (after reset) - trigger walk-in again
  useEffect(() => {
    // When we go back to intro and CH is not walking out, reset to walk in again
    if (currentScene === 'intro' && !isWalkingOut) {
      // Reset internal state to trigger walk-in animation
      setHasArrived(false)
      setAnimationState('walking')
      setCurrentFrame(0)
      setWalkOutComplete(false)
      setIsWalking(false)
    }
  }, [currentScene, isWalkingOut])

  // Check if first image loads
  useEffect(() => {
    const img = new Image()
    img.src = '/walk/image 1.png'
    img.onload = () => {
      setImageLoaded(true)
    }
    img.onerror = () => {
      console.error('Failed to load sprite')
    }
  }, [])

  const resetKoolTrigger = useSceneStore((state) => state.resetKoolTrigger)

  // Trigger kool animation when requested
  useEffect(() => {
    if (triggerKoolAnimation && hasArrived && animationState === 'idle') {
      setAnimationState('kool')
      setCurrentFrame(0) // Start from first kool frame
      resetKoolTrigger() // Reset the trigger flag
    }
  }, [triggerKoolAnimation, hasArrived, animationState, resetKoolTrigger])

  // Trigger designing animation when isDesigning is true
  useEffect(() => {
    if (isDesigning && hasArrived && animationState === 'idle') {
      setAnimationState('designing')
      setCurrentFrame(0)
    } else if (!isDesigning && animationState === 'designing') {
      setAnimationState('idle')
      setCurrentFrame(0)
    }
  }, [isDesigning, hasArrived, animationState])

  // Trigger walking out animation
  useEffect(() => {
    if (isWalkingOut && hasArrived) {
      // If currently idle, kool, or designing, transition to walking out
      if (animationState === 'idle' || animationState === 'kool' || animationState === 'designing') {
        setAnimationState('walkingOut')
        setCurrentFrame(0)
      }
    } else if (!isWalkingOut && animationState === 'walkingOut') {
      // If isWalkingOut becomes false while walking out, reset to idle
      setAnimationState('idle')
      setCurrentFrame(0)
    }
  }, [isWalkingOut, hasArrived, animationState])

  // Animate through walking frames while walking
  useEffect(() => {
    if (animationState !== 'walking' || !imageLoaded || hasArrived) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % walkingFrameCount)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [animationState, walkingFrameCount, fps, imageLoaded, hasArrived])

  // Animate through walking frames while walking out
  useEffect(() => {
    if (animationState !== 'walkingOut' || !imageLoaded) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % walkingFrameCount)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [animationState, walkingFrameCount, fps, imageLoaded])

  // Loop idle animation when arrived
  useEffect(() => {
    if (animationState !== 'idle' || !hasArrived || !imageLoaded) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % idleFrameCount)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [animationState, hasArrived, imageLoaded, idleFrameCount, fps])

  // Play kool animation once, then return to idle
  useEffect(() => {
    if (animationState !== 'kool' || !imageLoaded) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev + 1 >= koolFrameCount) {
          // Animation complete, return to idle
          setAnimationState('idle')
          setCurrentFrame(0)
          return 0
        }
        return prev + 1
      })
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [animationState, imageLoaded, koolFrameCount, fps])

  // Loop designing animation while isDesigning is true
  useEffect(() => {
    if (animationState !== 'designing' || !imageLoaded) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % designingFrameCount)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [animationState, imageLoaded, designingFrameCount, fps])

  // Stop walking when arrived
  useEffect(() => {
    if (hasArrived && animationState === 'walking') {
      setIsWalking(false)
      setAnimationState('idle')
      setCurrentFrame(0)
    }
  }, [hasArrived, animationState])


  // Get current sprite file
  const getSpriteFile = () => {
    if (animationState === 'walking' || animationState === 'walkingOut') {
      // Walking animation: use frames 1-4
      return `/walk/image ${currentFrame + 1}.png`
    } else if (animationState === 'kool') {
      // Kool animation: use frames 1-6 from kool folder
      return `/walk/idle/kool/${currentFrame + 1}.png`
    } else if (animationState === 'designing') {
      // Designing animation: loop kool animation
      return `/walk/idle/kool/${currentFrame + 1}.png`
    } else {
      // Idle animation: use frames 5-10
      const idleFrameNumber = idleStartFrame + currentFrame
      return `/walk/idle/image ${idleFrameNumber}.png`
    }
  }

  const spriteFile = getSpriteFile()

  const handleAnimationComplete = () => {
    setHasArrived(true)
  }

  const handleWalkOutComplete = () => {
    setWalkOutComplete(true)
  }

  // Determine animation based on state
  const getAnimationProps = () => {
    if (animationState === 'walkingOut') {
      return {
        animate: {
          opacity: 1,
          x: '100vw',
          scale: 1,
        },
        transition: {
          x: {
            duration: 3,
            ease: 'easeInOut',
            onComplete: handleWalkOutComplete,
          },
          opacity: {
            duration: 0.5,
          },
        },
      }
    } else if (!hasArrived) {
      return {
        initial: {
          opacity: 0,
          x: '-100vw',
        },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        transition: {
          x: {
            duration: 3,
            ease: 'easeInOut',
            onComplete: handleAnimationComplete,
          },
          opacity: {
            duration: 0.5,
          },
        },
      }
    } else {
      return {
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
      }
    }
  }

  return (
    <motion.div
      className="relative"
      {...getAnimationProps()}
      style={{
        position: 'relative',
        transform: 'translateX(0)',
        width: 'auto',
        height: 'auto',
      }}
    >
      {imageLoaded ? (
        <motion.img
          src={spriteFile}
          alt={
            animationState === 'walking' 
              ? "Walking character" 
              : animationState === 'walkingOut'
              ? "Walking out character"
              : animationState === 'kool'
              ? "Kool animation"
              : animationState === 'designing'
              ? "Designing character"
              : "Idle character"
          }
          style={{
            height: `${displayHeight}px`,
            width: 'auto',
            maxWidth: 'none',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            imageRendering: '-moz-crisp-edges',
            imageRendering: 'crisp-edges',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
          }}
          key={spriteFile}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            scale: 1, // Ensure no scaling during animation
          }}
          transition={{ duration: 0.1 }}
        />
      ) : (
        <div className="w-24 h-24 flex items-center justify-center text-white/50 text-xs border border-white/20">
          Loading...
        </div>
      )}
      <WalkingOutBubble />
      <CHIntroBubble />
    </motion.div>
  )
}
