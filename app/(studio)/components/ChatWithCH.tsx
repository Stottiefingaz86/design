'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSceneStore } from '@/lib/store/sceneStore'
import { UXFindingsCard } from './UXFindingsCard'
import { ReviewSummaryCard } from './ReviewSummaryCard'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[] // Base64 encoded images or URLs
  generatedImage?: string // URL for AI-generated images
}

interface ColorSwatch {
  token: string
  hex: string
  description: string
  figmaLink?: string
}

interface TokenCopy {
  token: string
  value: string
  figmaLink?: string
}

interface LogoImage {
  brand: string
  type: string
  color: string
  figmaLink?: string
  downloadUrl?: string
}

// Parse color swatches from message content
function parseColorSwatches(content: string): { text: string; swatches: ColorSwatch[] } {
  const swatchRegex = /COLOR_SWATCH:([^:\n]+):([^:\n]+):([^:\n]*):?([^\n]*)/g
  const swatches: ColorSwatch[] = []
  let match
  
  // Debug: check if content contains COLOR_SWATCH
  if (content.includes('COLOR_SWATCH')) {
    console.log('Found COLOR_SWATCH in content:', content.match(/COLOR_SWATCH:[^\n]+/g))
  }
  
  // Reset regex lastIndex
  swatchRegex.lastIndex = 0
  
  while ((match = swatchRegex.exec(content)) !== null) {
    const swatch = {
      token: match[1],
      hex: match[2],
      description: match[3] || '',
      figmaLink: match[4]?.trim() || undefined,
    }
    console.log('Parsed color swatch:', swatch)
    swatches.push(swatch)
  }
  
  // Remove COLOR_SWATCH markers from text
  const text = content.replace(/COLOR_SWATCH:[^\n]+/g, '').trim()
  
  return { text, swatches }
}

// Parse token copy blocks from message content
function parseTokenCopies(content: string): { text: string; tokens: TokenCopy[] } {
  const tokenRegex = /TOKEN_COPY:([^:\n]+):([^:\n]+):?([^\n]*)/g
  const tokens: TokenCopy[] = []
  let match
  
  while ((match = tokenRegex.exec(content)) !== null) {
    tokens.push({
      token: match[1],
      value: match[2],
      figmaLink: match[3]?.trim() || undefined,
    })
  }
  
  // Remove TOKEN_COPY markers from text
  const text = content.replace(tokenRegex, '').trim()
  
  return { text, tokens }
}

// Parse logo images from message content
function parseLogoImages(content: string): { text: string; logos: LogoImage[] } {
  // Format: LOGO_IMAGE:brand:type:color:figmaLink:downloadUrl
  // URLs contain colons, so we need to parse manually
  const logoLines = content.split('\n').filter(line => line.startsWith('LOGO_IMAGE:'))
  const logos: LogoImage[] = []
  
  // Debug: check if content contains LOGO_IMAGE
  if (logoLines.length > 0) {
    console.log('Found LOGO_IMAGE lines:', logoLines)
  }
  
  logoLines.forEach(line => {
    // Remove "LOGO_IMAGE:" prefix
    const rest = line.substring('LOGO_IMAGE:'.length)
    
    // We know the format is: brand:type:color:figmaLink:downloadUrl
    // But URLs contain ://, so we need a smarter approach
    // Strategy: Find the first 3 colons (for brand, type, color), then handle the rest
    
    const firstColon = rest.indexOf(':')
    if (firstColon === -1) return
    
    const secondColon = rest.indexOf(':', firstColon + 1)
    if (secondColon === -1) return
    
    const thirdColon = rest.indexOf(':', secondColon + 1)
    if (thirdColon === -1) return
    
    const brand = rest.substring(0, firstColon).trim()
    const type = rest.substring(firstColon + 1, secondColon).trim()
    const color = rest.substring(secondColon + 1, thirdColon).trim()
    
    // Everything after the third colon
    const remaining = rest.substring(thirdColon + 1)
    
    let figmaLink: string | undefined = undefined
    let downloadUrl: string | undefined = undefined
    
    // Look for /logos/ to split figmaLink and downloadUrl
    const logosIndex = remaining.indexOf('/logos/')
    
    if (logosIndex > 0) {
      // Found /logos/, split there
      figmaLink = remaining.substring(0, logosIndex).trim()
      downloadUrl = remaining.substring(logosIndex).trim()
    } else if (remaining.startsWith('http')) {
      // Only figmaLink, no downloadUrl
      figmaLink = remaining.trim()
    } else if (remaining.startsWith('/')) {
      // Only downloadUrl, no figmaLink
      downloadUrl = remaining.trim()
    } else if (remaining.trim()) {
      // Try to split by the last colon (if there's a colon after http://)
      const lastColon = remaining.lastIndexOf(':')
      if (lastColon > 0 && remaining.substring(0, lastColon).includes('http')) {
        // Likely format: http://...:downloadUrl
        figmaLink = remaining.substring(0, lastColon).trim()
        downloadUrl = remaining.substring(lastColon + 1).trim()
      } else {
        // Assume it's a downloadUrl if it starts with /
        if (remaining.trim().startsWith('/')) {
          downloadUrl = remaining.trim()
        } else {
          // Fallback: treat as figmaLink
          figmaLink = remaining.trim()
        }
      }
    }
    
    // Clean up figmaLink (remove trailing colon if present)
    if (figmaLink) {
      figmaLink = figmaLink.replace(/:$/, '').trim()
      if (figmaLink === '') figmaLink = undefined
    }
    
    const logo = {
      brand,
      type,
      color,
      figmaLink: figmaLink || undefined,
      downloadUrl: downloadUrl || undefined,
    }
    console.log('Parsed logo:', logo)
    logos.push(logo)
  })
  
  // Remove LOGO_IMAGE markers from text
  const text = content.replace(/LOGO_IMAGE:[^\n]+/g, '').trim()
  
  return { text, logos }
}

// Parse UX findings from message content
// Format: UX_FINDINGS:title:source:[JSON array of findings]
function parseUXFindings(content: string): { text: string; findings: any[]; title?: string; source?: string } {
  const findingsRegex = /UX_FINDINGS:([^:]*):([^:]*):(\[[\s\S]*?\])/g
  const matches = Array.from(content.matchAll(findingsRegex))
  
  if (matches.length === 0) {
    return { text: content, findings: [] }
  }
  
  const lastMatch = matches[matches.length - 1]
  let findings: any[] = []
  let title: string | undefined
  let source: string | undefined
  
  try {
    title = lastMatch[1] || undefined
    source = lastMatch[2] || undefined
    findings = JSON.parse(lastMatch[3])
  } catch (e) {
    console.error('Failed to parse UX findings:', e)
  }
  
  // Remove UX_FINDINGS markers from text
  const text = content.replace(findingsRegex, '').trim()
  
  return { text, findings, title, source }
}

// Parse review summary from message content
// Format: REVIEW_SUMMARY:rating:totalReviews:themes:strengths
function parseReviewSummary(content: string): { text: string; summary: any } {
  const summaryRegex = /REVIEW_SUMMARY:([^:]*):([^:]*):(\[[^\]]*\]):(\[[^\]]*\])/g
  const match = summaryRegex.exec(content)
  
  if (!match) {
    return { text: content, summary: null }
  }
  
  let overallRating: number | undefined
  let totalReviews: number | undefined
  let commonThemes: string[] = []
  let strengths: string[] = []
  
  try {
    overallRating = match[1] ? parseFloat(match[1]) : undefined
    totalReviews = match[2] ? parseInt(match[2]) : undefined
    commonThemes = match[3] ? JSON.parse(match[3]) : []
    strengths = match[4] ? JSON.parse(match[4]) : []
  } catch (e) {
    console.error('Failed to parse review summary:', e)
  }
  
  // Remove REVIEW_SUMMARY marker from text
  const text = content.replace(summaryRegex, '').trim()
  
  return {
    text,
    summary: {
      overallRating,
      totalReviews,
      commonThemes,
      strengths,
    },
  }
}

export function ChatWithCH() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hey, what do you need help with?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const showLilly = useSceneStore((state) => state.showLilly)
  const isWalkingOut = useSceneStore((state) => state.isWalkingOut)

  // Only show chat when CH is visible (not when Lilly is showing)
  const shouldShow = !showLilly && !isWalkingOut

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setUploadedImages((prev) => [...prev, base64])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() && uploadedImages.length === 0) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim() || 'Analyze this image',
      timestamp: new Date(),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue.trim()
    const currentImages = [...uploadedImages]
    setInputValue('')
    setUploadedImages([])
    setIsTyping(true)

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .slice(-5) // Last 5 messages for context
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      // Call AI chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput || 'Analyze this image',
          conversationHistory,
          images: currentImages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        generatedImage: data.generatedImage, // AI-generated image URL
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Try asking me about colors, typography, components, or our design system!",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  if (!shouldShow) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4" style={{ zIndex: 101 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-soft rounded-xl overflow-hidden border border-white/10"
      >
        {/* Chat Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 flex items-center justify-between hover:neu-inset transition-all"
        >
          <div className="flex items-center gap-2">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              className="text-white/60 flex-shrink-0"
            >
              <path 
                d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V10C14 10.5523 13.5523 11 13 11H6L3 14V3Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-white/80 text-sm font-light">Chat with CH</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </motion.div>
        </button>

        {/* Chat Messages */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="h-[300px] overflow-y-auto p-4 space-y-3 flex flex-col">
                {messages.map((message) => {
                  // Parse all special content types in order
                  const { text: textAfterSwatches, swatches } = parseColorSwatches(message.content)
                  const { text: textAfterTokens, tokens } = parseTokenCopies(textAfterSwatches)
                  const { text: textAfterLogos, logos } = parseLogoImages(textAfterTokens)
                  const { text: textAfterFindings, findings, title: findingsTitle, source: findingsSource } = parseUXFindings(textAfterLogos)
                  const { text: finalText, summary: reviewSummary } = parseReviewSummary(textAfterFindings)
                  
                  // Debug: log parsed content
                  if (logos.length > 0) {
                    console.log('Parsed logos from message:', logos)
                  }
                  if (findings.length > 0) {
                    console.log('Parsed UX findings from message:', findings)
                  }
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'neu-inset bg-white/5 text-white text-sm'
                            : 'neu-soft bg-white/5 text-white/90 text-sm'
                        }`}
                      >
                        {/* Display uploaded images */}
                        {message.images && message.images.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Uploaded ${idx + 1}`}
                                className="max-w-full max-h-48 rounded-lg object-contain border border-white/10"
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Display generated image */}
                        {message.generatedImage && (
                          <div className="mb-2">
                            <img
                              src={message.generatedImage}
                              alt="AI Generated"
                              className="max-w-full max-h-64 rounded-lg object-contain border border-white/10"
                            />
                          </div>
                        )}
                        
                        {/* Render text with markdown-style formatting */}
                        {finalText && (
                        <div className="whitespace-pre-wrap">
                          {finalText.split('\n').map((line, idx) => {
                            // Handle bold text (**text**)
                            const parts = line.split(/(\*\*[^*]+\*\*)/g)
                            return (
                              <div key={idx} className={idx > 0 ? 'mt-2' : ''}>
                                {parts.map((part, partIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <strong key={partIdx} className="font-semibold">
                                        {part.slice(2, -2)}
                                      </strong>
                                    )
                                  }
                                  // Handle inline code (`code`)
                                  const codeParts = part.split(/(`[^`]+`)/g)
                                  return (
                                    <span key={partIdx}>
                                      {codeParts.map((codePart, codeIdx) => {
                                        if (codePart.startsWith('`') && codePart.endsWith('`')) {
                                          return (
                                            <code
                                              key={codeIdx}
                                              className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono"
                                            >
                                              {codePart.slice(1, -1)}
                                            </code>
                                          )
                                        }
                                        return <span key={codeIdx}>{codePart}</span>
                                      })}
                                    </span>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                        )}
                        
                        {/* Render token copy blocks */}
                        {tokens.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {tokens.map((token, idx) => (
                              <TokenCopyBlock key={idx} token={token} />
                            ))}
                          </div>
                        )}
                        
                        {/* Render color swatches */}
                        {swatches.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {swatches.map((swatch, idx) => (
                              <ColorSwatchBlock key={idx} swatch={swatch} />
                            ))}
                          </div>
                        )}
                        
                        {/* Render logo images */}
                        {logos.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {logos.map((logo, idx) => (
                              <LogoImageBlock key={idx} logo={logo} />
                            ))}
                          </div>
                        )}
                        
                        {/* Render UX findings card */}
                        {findings.length > 0 && (
                          <UXFindingsCard
                            findings={findings}
                            title={findingsTitle}
                            source={findingsSource}
                          />
                        )}
                        
                        {/* Render review summary card */}
                        {reviewSummary && (
                          <ReviewSummaryCard
                            overallRating={reviewSummary.overallRating}
                            totalReviews={reviewSummary.totalReviews}
                            commonThemes={reviewSummary.commonThemes}
                            strengths={reviewSummary.strengths}
                          />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="neu-soft rounded-lg p-3 bg-white/5">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-white/60 rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-white/60 rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-white/60 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-white/5 space-y-2">
                {/* Preview uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white/80 text-xs hover:bg-white/30"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="neu-inset rounded-lg p-2 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1.5 neu-flat rounded-lg hover:neu-inset transition-all text-white/80 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Upload image"
                  >
                    📷
                  </motion.button>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask CH anything or upload an image..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm font-light focus:outline-none"
                    autoFocus={isOpen}
                  />
                  <motion.button
                    type="submit"
                    disabled={(!inputValue.trim() && uploadedImages.length === 0) || isTyping}
                    className="px-3 py-1.5 neu-flat rounded-lg hover:neu-inset transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white/80 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    →
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Token Copy Block Component
function TokenCopyBlock({ token }: { token: TokenCopy }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 group">
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium text-xs">{token.token}</div>
        <div className="text-white/60 text-xs font-mono break-all">{token.value}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleCopy(token.value)}
          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs"
          title="Copy to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
        {token.figmaLink && (
          <a
            href={token.figmaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs"
            title="Open in Figma"
          >
            🔗
          </a>
        )}
      </div>
    </div>
  )
}

// Color Swatch Block Component
function ColorSwatchBlock({ swatch }: { swatch: ColorSwatch }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
      {/* Color swatch */}
      <div
        className="w-12 h-12 rounded-lg border-2 border-white/20 flex-shrink-0"
        style={{ backgroundColor: swatch.hex }}
      />
      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium text-xs">{swatch.token}</div>
        <div className="text-white/60 text-xs font-mono">{swatch.hex}</div>
        {swatch.description && (
          <div className="text-white/50 text-xs mt-0.5">{swatch.description}</div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleCopy(swatch.hex)}
          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs"
          title="Copy hex to clipboard"
        >
          {copied ? '✓' : '📋'}
        </button>
        {swatch.figmaLink && (
          <a
            href={swatch.figmaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs"
            title="Open in Figma"
          >
            🔗
          </a>
        )}
      </div>
    </div>
  )
}

// Logo Image Block Component
function LogoImageBlock({ logo }: { logo: LogoImage }) {
  // Generate logo file path based on brand, type, and color
  const getLogoPath = () => {
    // Use downloadUrl if provided and it's a valid path
    if (logo.downloadUrl && logo.downloadUrl.startsWith('/')) {
      return logo.downloadUrl
    }
    
    // Construct path from brand, type, and color
    // Format: /logos/BrandName/type/color.svg
    const brandName = logo.brand.replace(/\s+/g, '')
    const typeName = logo.type.toLowerCase()
    const colorName = logo.color.replace(/\s+/g, '').toLowerCase()
    
    return `/logos/${brandName}/${typeName}/${colorName}.svg`
  }
  
  const logoPath = getLogoPath()
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  
  // Debug: log the logo path
  useEffect(() => {
    console.log('LogoImageBlock - logo:', logo)
    console.log('LogoImageBlock - logoPath:', logoPath)
    console.log('LogoImageBlock - downloadUrl:', logo.downloadUrl)
  }, [logo, logoPath])
  
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="text-white font-medium text-xs mb-2">
        {logo.brand} {logo.type} ({logo.color})
      </div>
      <div className="flex items-center gap-3">
        {imageLoading && !imageError && (
          <div className="w-[120px] h-[60px] flex items-center justify-center bg-white/5 border border-white/10 rounded text-white/50 text-xs">
            Loading...
          </div>
        )}
        {!imageError ? (
          <img
            src={logoPath}
            alt={`${logo.brand} ${logo.type} ${logo.color}`}
            className="max-w-[120px] max-h-[60px] object-contain bg-white/5 rounded"
            onLoad={() => {
              console.log('Logo loaded successfully:', logoPath)
              setImageLoading(false)
            }}
            onError={(e) => {
              console.error('Logo failed to load:', logoPath, e)
              console.error('Logo object:', logo)
              setImageError(true)
              setImageLoading(false)
            }}
            style={{ 
              display: imageLoading ? 'none' : 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: '120px',
              maxHeight: '60px'
            }}
          />
        ) : (
          <div className="w-[120px] h-[60px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded text-white/50 text-xs text-center p-2">
            <div className="text-[8px] mb-1">📐</div>
            <div className="text-[8px]">Logo</div>
            <div className="text-[8px] opacity-60 mt-1">{logo.brand}</div>
          </div>
        )}
        <div className="flex-1 flex flex-col gap-1">
          {logo.figmaLink && (
            <a
              href={logo.figmaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs text-center"
            >
              🔗 View in Figma
            </a>
          )}
          {logo.downloadUrl && (
            <a
              href={logo.downloadUrl}
              download
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs text-center"
            >
              ⬇️ Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

