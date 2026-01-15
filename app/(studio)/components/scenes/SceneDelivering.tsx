'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'
import { ThinkingBubble } from '../ThinkingBubble'

const deliveringMessages = [
  'Submitting to Mattermost...',
  'Creating Craft.io ticket...',
  'Notifying design team...',
  'Almost done...',
]

export function SceneDelivering() {
  const requestArea = useSceneStore((state) => state.requestArea)
  const userRequest = useSceneStore((state) => state.userRequest)
  const deadline = useSceneStore((state) => state.deadline)
  const assignedDesigner = useSceneStore((state) => state.assignedDesigner)
  const setIsWalkingOut = useSceneStore((state) => state.setIsWalkingOut)
  const reset = useSceneStore((state) => state.reset)
  const goToScene = useSceneStore((state) => state.goToScene)
  const setShowLilly = useSceneStore((state) => state.setShowLilly)
  const [isDelivering, setIsDelivering] = useState(true)
  const [deliveryComplete, setDeliveryComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const deliverRequest = async () => {
      try {
        const response = await fetch('/api/deliver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestArea,
            userRequest,
            deadline,
            assignedDesigner,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setDeliveryComplete(true)
          setIsDelivering(false)
        } else {
          setError(data.error || 'Failed to submit request')
          setIsDelivering(false)
        }
      } catch (err) {
        console.error('Delivery error:', err)
        setError('Failed to submit request. Please try again.')
        setIsDelivering(false)
      }
    }

    deliverRequest()
  }, [requestArea, userRequest, deadline, assignedDesigner])

  if (isDelivering) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="text-center space-y-4 w-full">
            <h2 className="text-white text-2xl font-bold sf-title mb-4">Submitting Request...</h2>
            <ThinkingBubble messages={deliveringMessages} inline={true} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="text-center space-y-4 w-full max-w-md">
            <h2 className="text-white text-2xl font-bold sf-title mb-4">Error</h2>
            <p className="text-white/70 text-sm font-light mb-6">{error}</p>
            <motion.button
              onClick={() => window.location.reload()}
              className="px-6 py-3 neu-flat rounded-lg hover:neu-inset transition-all font-light"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  const handleBackToCH = () => {
    // Reset state and go back to intro
    setShowLilly(false)
    setIsWalkingOut(false)
    reset()
    // Small delay to ensure reset completes before scene change
    setTimeout(() => {
      goToScene('intro')
    }, 100)
  }

  if (deliveryComplete) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 w-full max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-4xl mb-4"
            >
              ✨
            </motion.div>
            <h2 className="text-white text-2xl font-bold sf-title mb-2">Request Submitted!</h2>
            <p className="text-white/70 text-sm font-light">
              Your design request has been sent to Mattermost and Craft.io
            </p>
            {assignedDesigner && (
              <p className="text-white/50 text-xs font-light mt-4">
                {assignedDesigner} will be notified
              </p>
            )}
            
            {/* Back to CH button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleBackToCH}
              className="mt-6 px-8 py-3 neu-flat rounded-lg hover:neu-inset transition-all font-light text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to CH
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}
