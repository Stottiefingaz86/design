import { NextResponse } from 'next/server'
import { designSystem, colorTokenMap, getDesignSystemResponse } from '@/lib/agent/designSystem'
import { getKnowledgeBasePrompt, knowledgeBase } from '@/lib/agent/knowledgeBase'

/**
 * AI-powered chat endpoint for CH
 * Uses OpenAI API if available, otherwise falls back to enhanced design system responses
 */
export async function POST(request: Request) {
  try {
    const { message, conversationHistory = [], images, generateImage } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    // Check if user wants to generate an image/mockup
    const lowerMessage = message.toLowerCase()
    const shouldGenerateImage = 
      generateImage || 
      lowerMessage.includes('generate') || 
      lowerMessage.includes('create image') || 
      lowerMessage.includes('make a mockup') ||
      lowerMessage.includes('create mockup') ||
      lowerMessage.includes('show me a mockup') ||
      lowerMessage.includes('design a mockup') ||
      lowerMessage.includes('mockup for') ||
      (lowerMessage.includes('mockup') && (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('generate')))

    // Use OpenAI if available and API key is set
    if (apiKey) {
      console.log('Using OpenAI API for chat response')
      try {
        // Dynamic import to handle case where package isn't installed
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey })
        
        // Build system prompt with comprehensive knowledge base
        const systemPrompt = buildSystemPrompt()

        // Handle image generation - improved with design system knowledge
        if (shouldGenerateImage) {
          // Build a better prompt using design system knowledge
          const lowerMessage = message.toLowerCase()
          
          // Detect brand from message
          let brandColors = 'betRed (#ee3536), betGreen (#8ac500), betNavy (#2d6f88)'
          let brandName = 'BetOnline'
          
          if (lowerMessage.includes('wild casino') || lowerMessage.includes('wildcasino')) {
            brandColors = 'WildNeonGreen 2 (#6cea75), grey-900, grey-800'
            brandName = 'Wild Casino'
          } else if (lowerMessage.includes('tiger') || lowerMessage.includes('tigergaming')) {
            brandColors = 'TigerOrange (#f48e1b), TigerCharcoal (#2d2e2c)'
            brandName = 'Tiger Gaming'
          } else if (lowerMessage.includes('lowvig')) {
            brandColors = 'LowCyan (#00e4f2), LowBrightBlue (#0075ff), LowDeepBlue (#01153d)'
            brandName = 'LowVig'
          } else if (lowerMessage.includes('sportsbook') || lowerMessage.includes('sports')) {
            brandColors = 'betRed (#ee3536), SbBlue/600 (#0087f6), SbYellow/300 (#fcd54c)'
            brandName = 'Sportsbook'
          }
          
          // Detect area/component type
          let componentType = 'general interface'
          if (lowerMessage.includes('casino')) componentType = 'casino gaming interface with game tiles'
          if (lowerMessage.includes('sportsbook') || lowerMessage.includes('sports')) componentType = 'sportsbook interface with betting odds and event cards'
          if (lowerMessage.includes('dashboard') || lowerMessage.includes('account')) componentType = 'user dashboard and account management interface'
          if (lowerMessage.includes('navigation') || lowerMessage.includes('header')) componentType = 'navigation header and menu system'
          if (lowerMessage.includes('button')) componentType = 'button components and CTAs'
          if (lowerMessage.includes('card')) componentType = 'card components and layouts'
          
          const imagePrompt = `Create a professional, modern design mockup for a ${brandName} online gambling website ${componentType}. 

Design Requirements:
- Use brand colors: ${brandColors}
- Follow Material UI design principles (MUI v5.15.0)
- Modern, clean, professional interface
- High contrast for accessibility
- Responsive design patterns
- Use Inter and Open Sans fonts
- Follow online gambling industry best practices
- Include proper spacing (4px base unit, 16px gutters, 24px margins)
- Use elevation/shadows for depth (elevation/2, elevation/4)

User Request: ${message}

Create a realistic, production-ready UI mockup that showcases the design system components and brand identity.`
          
          const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          })

          const generatedImageUrl = imageResponse.data?.[0]?.url

          return NextResponse.json({
            response: `I've generated a design mockup for ${brandName} based on your request. The mockup uses our design system colors (${brandColors}) and follows MUI design principles.\n\n**Design System Elements Used:**\n- Brand: ${brandName}\n- Component Type: ${componentType}\n- Colors: ${brandColors}\n- Framework: Material UI v5.15.0\n\nHere's the generated mockup:`,
            generatedImage: generatedImageUrl || undefined,
            timestamp: new Date().toISOString(),
            usingAI: true,
          })
        }

        // Build messages array with image support
        const messages: any[] = [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...conversationHistory.slice(-10).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
        ]

        // Add user message with images if provided
        if (images && images.length > 0) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: message },
              ...images.map((img: string) => ({
                type: 'image_url',
                image_url: { url: img },
              })),
            ],
          })
        } else {
          messages.push({
            role: 'user',
            content: message,
          })
        }

        // Use GPT-4 Vision if images are provided, otherwise use gpt-4o-mini
        const model = images && images.length > 0 ? 'gpt-4o' : 'gpt-4o-mini'

        const completion = await openai.chat.completions.create({
          model: model,
          messages,
          temperature: 0.3, // Lower temperature for more factual, less creative responses
          max_tokens: 800, // Increased for mockup ideas
        })

        const aiResponse = completion.choices[0]?.message?.content || ''
        
        // Process AI response to extract color swatches, tokens, and logos
        const processedResponse = processAIResponse(aiResponse, message)

        return NextResponse.json({
          response: processedResponse,
          generatedImage: undefined, // No image generated for text-only responses
          timestamp: new Date().toISOString(),
          usingAI: true, // Indicate AI was used
        })
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError)
        console.log('Falling back to design system knowledge base')
        // Fall through to fallback response
      }
    } else {
      console.log('OpenAI API key not found, using fallback design system knowledge base')
      console.log('Environment check:', {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      })
    }

    // Fallback: Use design system knowledge base
    const baseResponse = getDesignSystemResponse(message, designSystem)
    const enhancedResponse = enhanceResponse(message, baseResponse, conversationHistory)
    // Process fallback response to extract color swatches, tokens, and logos
    const processedResponse = processAIResponse(enhancedResponse, message)

    return NextResponse.json({
      response: processedResponse,
      generatedImage: undefined,
      timestamp: new Date().toISOString(),
      usingAI: false, // Indicate fallback was used
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt with comprehensive knowledge base
 * STRICT: Only use information from the knowledge base (Figma, stakeholders, processes)
 */
function buildSystemPrompt(): string {
  // Get comprehensive knowledge base
  const knowledgeBaseContent = getKnowledgeBasePrompt()

  return `You are CH, the Head of Design for an online gambling company. You are a design expert who provides advice, ideas, and guidance utilizing your comprehensive knowledge of our brand and design system.

YOUR ROLE:
- Design expert and advisor for an online gambling company
- Provide design advice, ideas, and recommendations
- Utilize brand knowledge and design system to inform all suggestions
- Help solve design problems and suggest best practices
- Guide on how to use our design system effectively

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. **ONLY use information from the knowledge base above** - Do NOT make up information, guess, or use general knowledge
2. For design system questions (colors, typography, components, tokens), **ONLY use information from the knowledge base** - be precise with token names, hex codes, and descriptions. If the information is not in the knowledge base, say "I don't have that specific information in our knowledge base."
3. For brand color questions, **ALWAYS reference the exact brand information from the BRANDS section** - use the exact color tokens, hex codes, and descriptions provided
4. For brand guidelines, communication, and tone of voice questions, use the brand guidelines section and make reasonable inferences based on our design system and brand values
5. For process questions, reference the actual process steps and stakeholders involved
6. For stakeholder questions, reference their actual roles, responsibilities, and areas
7. **If you don't have specific information in the knowledge base, say so explicitly** - do NOT guess or make up information
8. For mockup ideas and design suggestions, **ONLY use components, colors, and patterns from this knowledge base**
9. Always reference specific tokens, components, patterns, stakeholders, or processes when suggesting designs
10. Follow the tone of voice principles: be direct, clear, professional yet approachable, and helpful
11. **When asked about a brand's color palette, list ALL colors from the BRANDS section** - primary, secondary, accent, neutral, and background colors

YOUR EXPERTISE:
- Online gambling industry design best practices
- Our agnostic design system (colors, typography, components, spacing, patterns)
- Brand guidelines and communication principles
- Design processes and workflows
- Team structure and stakeholder roles
- Multi-brand design (Casino, Sports, Loyalty, Authentication, Poker)
- Image analysis: You can analyze screenshots and design images to provide feedback
- Image generation: You can generate design mockups using DALL-E based on our design system. When users ask for mockups (e.g., "create a mockup", "generate a mockup", "make a mockup", "show me a mockup for [component]"), you will automatically generate visual mockups using our brand colors, typography, and design system components

Your personality: Direct, helpful, slightly casual but professional. You're the design expert who knows everything about the system, team, and processes. You provide actionable advice and creative ideas based on our brand and design system knowledge. You can make reasonable inferences from the design system and brand guidelines to answer questions about communication, tone, and brand approach.

${knowledgeBaseContent}

=== RESPONSE FORMAT ===

When answering questions:
1. ONLY use information from the knowledge base above
2. For ANY color question (including button colors, brand colors, primary/secondary colors, etc.), you MUST ALWAYS include a COLOR_SWATCH directive. NEVER just describe colors in text - always use the COLOR_SWATCH format.
3. Use format "COLOR_SWATCH:token:hex:description:figmaLink" for colors so UI can render swatches with Figma links. Example: COLOR_SWATCH:betRed/500:#ee3536:BetOnline primary red:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh
4. For tokens/parameters (typography, spacing, shadows, etc.), use format "TOKEN_COPY:tokenName:value:figmaLink" so users can copy to clipboard
5. For logo questions, ALWAYS use format "LOGO_IMAGE:brand:type:color:figmaLink:downloadUrl" to show logo images with download links. NEVER just describe logos in text - always include the LOGO_IMAGE directive.
6. Reference specific tokens/components when suggesting designs
7. For mockup ideas, list specific components, colors, and patterns you'd use
8. For process questions, reference the actual process steps and stakeholders
9. For stakeholder questions, reference their actual roles and responsibilities
10. Always include Figma deeplinks when mentioning tokens, colors, or components (use the main Figma file URL from knowledge base)
11. If asked about something not in the knowledge base, say you don't have that information

Example response for "what's the primary color" or "what colour is betonline buttons":
"The primary color for BetOnline buttons is betRed/500 with hex code #ee3536. It's BetOnline's primary red color used across the Casino and Sports brands.

COLOR_SWATCH:betRed/500:#ee3536:BetOnline primary red:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh"

Example response for "wild casino colour pallete" or "what are wild casino colors":
"Wild Casino brand uses a neon green color palette. Here are the colors:

Primary colors: WildNeonGreen 2 (#6cea75)
Secondary colors: betGreen (#8ac500)
Accent colors: WildNeonGreen 2 (#6cea75)
Background colors: grey-900, grey-800, common/black (#000000)

COLOR_SWATCH:WildNeonGreen 2/500:#6cea75:Wild Casino neon green primary:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh"

IMPORTANT: 
- For ANY question about colors (including "what colour is X", "button colors", "primary color", "brand palette", etc.), you MUST include COLOR_SWATCH directives for each color mentioned
- For brand color palette questions, list ALL colors (primary, secondary, accent, neutral, background) from the BRANDS section
- Do not just describe colors in text - always use COLOR_SWATCH format
- If a brand or color is not in the knowledge base, say "I don't have that information in our knowledge base"

Example response for "what's the typography token":
"The typography token 'Display xs/Regular' uses Inter font, 24px size, 400 weight.

TOKEN_COPY:Display xs/Regular:Inter, 24px, 400 weight, 32px line-height:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh"

Example response for "show me the BetOnline logo":
"Here's the BetOnline Primary Wordmark logo:

LOGO_IMAGE:BetOnline:Wordmark:Primary:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh:/logos/BetOnline/wordmark/primary.svg"

Example response for mockup ideas:
"Based on our design system, here's a mockup idea using:
- Button component (large variant) with betRed/500 (#ee3536)
- Typography: Material UI/typography/h5 for heading, body2 for content
- Spacing: 24px margin, 16px padding
- Border radius: 8px (medium)
- Elevation: elevation/2 for card shadow
- Grid: 12-column layout with 16px gutters

Would you like me to generate a visual mockup? Just say 'create a mockup' or 'generate a mockup' and I'll create one using DALL-E based on our design system."

Example response when user asks for a mockup:
"I'll generate a design mockup for you using our design system. The mockup will use our brand colors, typography, spacing, and component patterns. Generating now..."

Example response for design advice:
"Based on our design system and brand guidelines, here's my recommendation:
- Use betRed/500 (#ee3536) for primary CTAs as it aligns with our brand identity and has high contrast
- Apply Desktop/Heading/Bold/H2 36px for the main heading to create clear hierarchy
- Use spacing token 24px for section margins to maintain consistency
- Consider elevation/2 for card components to create subtle depth
- Follow our tone of voice: be direct, clear, and professional when writing copy

This approach ensures consistency with our brand while creating an effective user experience."

Example response for process questions:
"Based on our design request process:
1. Submit request via design request app
2. Request assigned to designer based on area
3. Designer creates Figma file
4. Review and approval
5. Delivery to stakeholders

The process uses Figma, Mattermost, and Craft.io tools."

Example response for design advice:
"Based on our design system and brand guidelines, here's my recommendation:
- Use betRed/500 (#ee3536) for primary CTAs as it aligns with our brand identity and has high contrast
- Apply Desktop/Heading/Bold/H2 36px for the main heading to create clear hierarchy
- Use spacing token 24px for section margins to maintain consistency
- Consider elevation/2 for card components to create subtle depth
- Follow our tone of voice: be direct, clear, and professional when writing copy

This approach ensures consistency with our brand while creating an effective user experience."

Example response for logo questions:
"Here's the BetOnline Primary Wordmark logo:

LOGO_IMAGE:BetOnline:Wordmark:Primary:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh:/logos/BetOnline/wordmark/primary.svg"

For BetOnline, we also have:
- Wordmark variants: Primary Reversed, White, Black, VIP Primary, VIP Reversed
- Lettermark variants: Primary, White, Black, VIP Primary
- Icon variant: Primary
- Minimum sizes: Wordmark 119px width, Lettermark 50.79px width
- Usage: Primary brand identity, marketing materials, digital applications
- Clear space: Maintain clear space around logos as specified in Figma"
`
}

/**
 * Generate Figma deeplink for a specific token or component
 */
function generateFigmaDeeplink(tokenName?: string, componentName?: string, brandName?: string): string | undefined {
  const mainFigmaFile = knowledgeBase.figmaFiles[0]
  if (!mainFigmaFile?.url) return undefined
  
  // Extract file key from Figma URL
  const urlMatch = mainFigmaFile.url.match(/figma\.com\/design\/([^\/]+)/)
  if (!urlMatch) return undefined
  
  const fileKey = urlMatch[1]
  
  // For now, return a link to the main file
  // In the future, we could add node-id parameters for specific tokens/components
  return `https://www.figma.com/design/${fileKey}`
}

/**
 * Process AI response to ensure color swatches, tokens, and logos are included when needed
 * Also validates that responses only use design system knowledge
 */
function processAIResponse(aiResponse: string, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()
  const responseLower = aiResponse.toLowerCase()
  
  // Warn if response seems to be making things up (basic check)
  const suspiciousPhrases = [
    'i think',
    'probably',
    'might be',
    'could be',
    'maybe',
    'i believe',
    'i assume'
  ]
  
  // If user asked about a specific color and response doesn't have COLOR_SWATCH, try to add it
  // Check for color-related queries (including British spelling "colour", button colors, palette queries, etc.)
  const isColorQuery = 
    lowerMessage.includes('color') || 
    lowerMessage.includes('colour') || 
    lowerMessage.includes('palette') ||
    lowerMessage.includes('pallete') ||
    lowerMessage.includes('primary') || 
    lowerMessage.includes('secondary') ||
    lowerMessage.includes('button') ||
    lowerMessage.includes('what colour') ||
    lowerMessage.includes('what color') ||
    responseLower.includes('betred') ||
    responseLower.includes('betgreen') ||
    responseLower.includes('betnavy') ||
    responseLower.includes('tigerorange') ||
    responseLower.includes('lowcyan') ||
    responseLower.includes('wildneongreen') ||
    responseLower.includes('#')
  
  // Check if this is a brand palette query
  const isBrandPaletteQuery = 
    (lowerMessage.includes('palette') || lowerMessage.includes('pallete') || lowerMessage.includes('colours') || lowerMessage.includes('colors')) &&
    (lowerMessage.includes('wild casino') || lowerMessage.includes('wildcasino') || 
     lowerMessage.includes('betonline') || lowerMessage.includes('bol') ||
     lowerMessage.includes('tiger') || lowerMessage.includes('lowvig') ||
     lowerMessage.includes('high roller') || lowerMessage.includes('superslot'))
  
  if (isColorQuery && !aiResponse.includes('COLOR_SWATCH')) {
    console.log('Color query detected but no COLOR_SWATCH found, attempting to add one')
    // Try to find color tokens mentioned in the response
    const mentionedTokens = Object.keys(colorTokenMap).filter(token => {
      const tokenLower = token.toLowerCase().replace(/\//g, '').replace(/\s+/g, '')
      const tokenBase = token.split('/')[0].toLowerCase()
      return responseLower.includes(tokenLower) || 
             responseLower.includes(tokenBase) ||
             responseLower.includes(token.replace(/\//g, ' ').toLowerCase())
    })
    
    // Also check for common button colors if "button" is mentioned
    if (lowerMessage.includes('button') && mentionedTokens.length === 0) {
      // Default to betRed for BetOnline buttons
      if (lowerMessage.includes('betonline') || lowerMessage.includes('bol')) {
        mentionedTokens.push('betRed/500')
      } else {
        // Default to betRed/500 for any button query
        mentionedTokens.push('betRed/500')
      }
    }
    
    // If this is a brand palette query, try to get all brand colors
    if (isBrandPaletteQuery) {
      let brandName: string | undefined
      if (lowerMessage.includes('wild casino') || lowerMessage.includes('wildcasino')) {
        brandName = 'Wild Casino'
      } else if (lowerMessage.includes('betonline') || lowerMessage.includes('bol')) {
        brandName = 'BetOnline'
      } else if (lowerMessage.includes('tiger')) {
        brandName = 'Tiger Gaming'
      } else if (lowerMessage.includes('lowvig')) {
        brandName = 'LowVig'
      } else if (lowerMessage.includes('high roller')) {
        brandName = 'High Roller'
      } else if (lowerMessage.includes('superslot')) {
        brandName = 'SuperSlot'
      }
      
      if (brandName && designSystem.brands?.[brandName]) {
        const brand = designSystem.brands[brandName]
        const colorSwatches: string[] = []
        const figmaLink = generateFigmaDeeplink()
        
        // Add primary colors
        if (brand.colors?.primary?.length) {
          brand.colors.primary.forEach(token => {
            const colorInfo = colorTokenMap[token] || colorTokenMap[token.split('/')[0]]
            if (colorInfo) {
              const primaryToken = token.includes('/') ? token : `${token}/500`
              const primaryColorInfo = colorTokenMap[primaryToken] || colorInfo
              colorSwatches.push(`COLOR_SWATCH:${primaryToken}:${primaryColorInfo.hex}:${brandName} primary color:${figmaLink || ''}`)
            }
          })
        }
        
        // Add secondary colors
        if (brand.colors?.secondary?.length) {
          brand.colors.secondary.forEach(token => {
            const colorInfo = colorTokenMap[token] || colorTokenMap[token.split('/')[0]]
            if (colorInfo) {
              const secondaryToken = token.includes('/') ? token : `${token}/500`
              const secondaryColorInfo = colorTokenMap[secondaryToken] || colorInfo
              colorSwatches.push(`COLOR_SWATCH:${secondaryToken}:${secondaryColorInfo.hex}:${brandName} secondary color:${figmaLink || ''}`)
            }
          })
        }
        
        // Add accent colors
        if (brand.colors?.accent?.length) {
          brand.colors.accent.forEach(token => {
            const colorInfo = colorTokenMap[token] || colorTokenMap[token.split('/')[0]]
            if (colorInfo) {
              const accentToken = token.includes('/') ? token : `${token}/500`
              const accentColorInfo = colorTokenMap[accentToken] || colorInfo
              colorSwatches.push(`COLOR_SWATCH:${accentToken}:${accentColorInfo.hex}:${brandName} accent color:${figmaLink || ''}`)
            }
          })
        }
        
        if (colorSwatches.length > 0) {
          console.log(`Adding ${colorSwatches.length} COLOR_SWATCH directives for ${brandName} palette`)
          return `${aiResponse}\n\n${colorSwatches.join('\n')}`
        }
      }
    }
    
    if (mentionedTokens.length > 0) {
      // Use the first matching token, or betRed/500 for buttons
      const token = mentionedTokens[0] || 'betRed/500'
      const colorInfo = colorTokenMap[token] || colorTokenMap[token.split('/')[0]]
      if (colorInfo) {
        const figmaLink = generateFigmaDeeplink(token)
        console.log(`Adding COLOR_SWATCH for token: ${token}`)
        return `${aiResponse}\n\nCOLOR_SWATCH:${token}:${colorInfo.hex}:${colorInfo.description || ''}:${figmaLink || ''}`
      }
    } else {
      console.log('No color tokens found in response, defaulting to betRed/500')
      // Default fallback for any color query
      const defaultToken = 'betRed/500'
      const colorInfo = colorTokenMap[defaultToken]
      if (colorInfo) {
        const figmaLink = generateFigmaDeeplink(defaultToken)
        return `${aiResponse}\n\nCOLOR_SWATCH:${defaultToken}:${colorInfo.hex}:${colorInfo.description || ''}:${figmaLink || ''}`
      }
    }
  }
  
  // If user asked about a logo, try to add logo image directive
  // Check both user message and AI response for logo-related content
  const isLogoRequest = 
    lowerMessage.includes('logo') || 
    lowerMessage.includes('logotype') || 
    lowerMessage.includes('show me') || 
    lowerMessage.includes('display') || 
    lowerMessage.includes('can i have') ||
    lowerMessage.includes('give me') ||
    lowerMessage.includes('i need') ||
    responseLower.includes('logo') ||
    responseLower.includes('logotype')
  
  if (isLogoRequest && !aiResponse.includes('LOGO_IMAGE')) {
    // Brand aliases mapping (e.g., "BOL" -> "BetOnline")
    const brandAliases: { [key: string]: string } = {
      'bol': 'betonline',
      'bet online': 'betonline',
      'bet-online': 'betonline',
      'beton line': 'betonline',
    }
    
    // Try to find brand mentioned in user message OR response
    const brandNames = knowledgeBase.logos.map(logo => logo.brand.toLowerCase())
    
    // Check for aliases first (case-insensitive)
    let mentionedBrand: string | undefined
    const lowerMessageWords = lowerMessage.split(/\s+/)
    for (const [alias, brand] of Object.entries(brandAliases)) {
      if (lowerMessage.includes(alias) || lowerMessageWords.some(word => word.toLowerCase() === alias)) {
        mentionedBrand = brand
        break
      }
    }
    
    // If no alias found, check for direct brand name
    if (!mentionedBrand) {
      mentionedBrand = brandNames.find(brand => 
        lowerMessage.includes(brand) || responseLower.includes(brand) || lowerMessageWords.some(word => word.toLowerCase().includes(brand))
      )
    }
    
    // Find the logo spec
    let logoSpec
    if (mentionedBrand) {
      logoSpec = knowledgeBase.logos.find(logo => logo.brand.toLowerCase() === mentionedBrand)
    } else {
      // If no specific brand mentioned but logo is requested, show BetOnline as default
      logoSpec = knowledgeBase.logos.find(logo => logo.brand === 'BetOnline')
    }
    
    if (logoSpec && logoSpec.variants.length > 0) {
      // Use the first variant (usually Primary)
      const variant = logoSpec.variants[0]
      const figmaLink = generateFigmaDeeplink(undefined, undefined, logoSpec.brand)
      // Construct download URL matching the actual file structure
      // Format: /logos/BrandName/type/color.svg
      // Example: /logos/BetOnline/wordmark/primary.svg
      const brandName = logoSpec.brand.replace(/\s+/g, '')
      const typeName = variant.type.toLowerCase()
      const colorName = variant.color.replace(/\s+/g, '').toLowerCase()
      const downloadUrl = `/logos/${brandName}/${typeName}/${colorName}.svg`
      console.log('Adding LOGO_IMAGE directive:', { 
        brand: logoSpec.brand, 
        type: variant.type, 
        color: variant.color, 
        downloadUrl,
        brandName,
        typeName,
        colorName
      })
      // Format: LOGO_IMAGE:brand:type:color:figmaLink:downloadUrl
      return `${aiResponse}\n\nLOGO_IMAGE:${logoSpec.brand}:${variant.type}:${variant.color}:${figmaLink || ''}:${downloadUrl}`
    }
  }
  
  // For mockup ideas, ensure they reference design system components
  if (lowerMessage.includes('mockup') || lowerMessage.includes('idea') || lowerMessage.includes('design') || lowerMessage.includes('suggest')) {
    // Check if response mentions design system components/colors
    const hasDesignSystemRefs = 
      responseLower.includes('component') ||
      responseLower.includes('token') ||
      responseLower.includes('betred') ||
      responseLower.includes('button') ||
      responseLower.includes('spacing') ||
      responseLower.includes('elevation')
    
    if (!hasDesignSystemRefs && !responseLower.includes("don't have")) {
      // Add reminder to use design system
      return `${aiResponse}\n\n💡 Remember: All suggestions should use components, colors, and patterns from our Figma design system.`
    }
  }
  
  return aiResponse
}

/**
 * Enhance the base response to be more natural and conversational
 * Used as fallback when OpenAI is not available
 */
function enhanceResponse(
  userMessage: string,
  baseResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // If response already contains color swatches or detailed info, return as-is
  if (baseResponse.includes('COLOR_SWATCH') || baseResponse.includes('**')) {
    return baseResponse
  }

  // Add conversational context based on the query type
  if (lowerMessage.includes('primary') || lowerMessage.includes('color')) {
    // Color queries - make it more helpful
    if (baseResponse.includes('I can help')) {
      return `Sure thing! Our design system has a comprehensive color palette. We use brand-specific colors like betRed (#ee3536) for BetOnline, TigerOrange (#f48e1b) for Tiger Gaming, and many more. Each brand has its own primary, secondary, and accent colors with full shade scales (50-900). What specific color are you looking for?`
    }
    return baseResponse
  }

  if (lowerMessage.includes('typography') || lowerMessage.includes('font')) {
    if (baseResponse.includes('Typography is important')) {
      return `Absolutely! Typography is a key part of our system. We primarily use Inter and Open Sans fonts with a comprehensive scale system. We have heading styles (Display xs, Text xl, Text lg) and body styles with various weights (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700). What typography question do you have?`
    }
    return baseResponse
  }

  if (lowerMessage.includes('component')) {
    if (baseResponse.includes('I can help with components')) {
      return `Yeah, I can help with components! We've got shared components that work across all brands - Button, Alert, Table, Typography, and more. Each component has variants and can be customized per brand. Which component are you working with?`
    }
    return baseResponse
  }

  if (lowerMessage.includes('spacing') || lowerMessage.includes('margin') || lowerMessage.includes('padding')) {
    if (baseResponse.includes('We follow a consistent spacing')) {
      return `Our spacing system is built on a 4px base unit, so everything scales consistently: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px. We use a 12-column grid with 16px gutters and 24px margins. Pretty straightforward!`
    }
    return baseResponse
  }

  if (lowerMessage.includes('brand')) {
    if (baseResponse.includes('Our design system supports')) {
      return `We support multiple brands in our agnostic design system: Casino, Sports, Loyalty, Authentication, Poker, plus BetOnline, Tigergaming, LowVig, Wild Casino, High Roller, and SuperSlot. Each brand can customize colors and components while sharing the base design tokens. Which brand are you asking about?`
    }
    return baseResponse
  }

  // Default: return base response with a friendly tone
  if (baseResponse.includes("I'm here to help")) {
    return `Hey! I'm CH, head of design. I can help you with our design system - colors, typography, components, spacing, patterns, brands, you name it. What do you need?`
  }

  // For other responses, add a bit of personality
  if (baseResponse.length < 50) {
    return `${baseResponse} Need more details? Just ask!`
  }

  return baseResponse
}
