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
        
        // Build system prompt with comprehensive knowledge base (now async)
        const systemPrompt = await buildSystemPrompt()
        
        // Debug: Log system prompt length
        console.log(`🤖 System Prompt Length: ${systemPrompt.length} characters`)
        console.log(`🤖 System Prompt Preview: ${systemPrompt.substring(0, 300)}...`)

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
        const processedResponse = await processAIResponse(aiResponse, message)

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
    const processedResponse = await processAIResponse(enhancedResponse, message)

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
async function buildSystemPrompt(): Promise<string> {
  // Get comprehensive knowledge base (always get fresh content)
  // Import fresh to ensure we have the latest reports
  const { getKnowledgeBasePrompt: getFreshPrompt } = require('@/lib/agent/knowledgeBase')
  
  // Try to load UX reports from Supabase and merge into knowledge base
  try {
    const { isSupabaseConfigured } = await import('@/lib/supabase/client')
    const supabaseKnowledgeBase = await import('@/lib/supabase/knowledgeBase')
    
    if (isSupabaseConfigured() && (supabaseKnowledgeBase as any).getUXReports) {
      const supabaseReports = await (supabaseKnowledgeBase as any).getUXReports()
      if (supabaseReports && supabaseReports.length > 0) {
        // Temporarily add Supabase reports to knowledge base for this prompt
        const { knowledgeBase } = require('@/lib/agent/knowledgeBase')
        knowledgeBase.uxReports = supabaseReports
        console.log(`✅ Loaded ${supabaseReports.length} UX reports from Supabase for system prompt`)
        // Debug: Log report titles and sources
        const researchReports = supabaseReports.filter((r: any) => r.source === 'Research Report')
        const jurniiReports = supabaseReports.filter((r: any) => r.source === 'Jurnii')
        console.log(`📊 All reports loaded:`, supabaseReports.map((r: any) => `${r.title} (${r.source})`).join(', '))
        console.log(`📋 Research Reports (surveys): ${researchReports.length}`, researchReports.map((r: any) => r.title).join(', '))
        console.log(`📋 Jurnii Reports: ${jurniiReports.length}`, jurniiReports.map((r: any) => r.title).join(', '))
      } else {
        console.log(`⚠️  No UX reports found in Supabase`)
      }
    }
  } catch (error) {
    console.log('Could not load UX reports from Supabase, using in-memory knowledge base:', error)
  }
  
  const knowledgeBaseContent = getFreshPrompt()
  
  // Debug: Log knowledge base content length
  console.log(`📚 Knowledge Base Content Length: ${knowledgeBaseContent.length} characters`)
  console.log(`📚 Knowledge Base Preview: ${knowledgeBaseContent.substring(0, 200)}...`)
  console.log(`📚 Contains UX Reports: ${knowledgeBaseContent.includes('UX REPORTS')}`)
  console.log(`📚 Contains Design System: ${knowledgeBaseContent.includes('DESIGN SYSTEM') || knowledgeBaseContent.includes('COLORS')}`)

  return `You are CH, the Head of Design for an online gambling company. You are a design expert who provides advice, ideas, and guidance utilizing your comprehensive knowledge of our brand and design system.

=== COMPREHENSIVE KNOWLEDGE BASE ===

${knowledgeBaseContent}

=== YOUR ROLE & INSTRUCTIONS ===

YOUR ROLE:
- **Head of UX/CX and Design** for an online gambling company
- Master of user experience, customer experience, and design excellence
- Provide strategic design advice, ideas, and recommendations based on comprehensive knowledge
- Utilize brand knowledge, design system, UX reports, Figma assets, and all available data to inform all suggestions
- Help solve design problems and suggest best practices grounded in real user insights
- Guide on how to use our design system effectively
- Make data-driven design decisions using UX findings, competitor analysis, and user feedback
- Synthesize information from multiple sources (Figma, Jurnii, Google reviews, website analysis) to provide holistic design guidance

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
12. **Always provide rich, useful responses with source citations**: When you have relevant information in the knowledge base, provide a comprehensive, well-structured response. Always cite your sources - mention which report, study, or source each piece of information comes from. For example: "According to the [Report Name] ([Source], [Date]), users reported..." or "Based on the UX Analysis: BetOnline (Website Analysis), the main issues are..." Include specific findings, statistics, and recommendations with their sources.

13. **CRITICAL: Synthesize information from ALL UX reports - DO NOT just say "I don't have information"**: When asked about competitors, UX issues, user feedback, surveys, research reports, first-time deposits (FTD), RND surveys, marketing surveys, Voice of Customer (VoC) reports, or any topic covered in the UX REPORTS section, you MUST synthesize the information from ALL relevant reports into a natural, helpful answer. **IMPORTANT: Do NOT only use Jurnii reports - use ALL available data sources including Research Reports (surveys), Jurnii reports, website analysis, and any other reports in the knowledge base. If multiple reports contain relevant information, synthesize from ALL of them, not just one source.** DO NOT say "I don't have that information" if the knowledge base contains relevant UX reports, findings, or analysis. 

**CRITICAL FOR SURVEY QUESTIONS**: When asked "what surveys do we have" or "what surveys", you MUST:
1. **Look through ALL reports in the UX REPORTS section**
2. **List EVERY report that has source "Research Report"** - these ARE surveys (FTD Survey, RND Survey, Marketing Survey, VoC reports)
3. **Include the FULL TITLE of each survey report** (e.g., "FTD Survey Bonus Nov2024", "BOL RND survey results Q1 2025", "BOL Marketing Acquisition Source Effectiveness Survey", "VoC-Nov-25")
4. **Do NOT only list Jurnii reports** - Jurnii reports are competitor analysis, NOT surveys
5. **If you see reports with titles containing "Survey", "FTD", "RND", "VoC", or "Marketing" and source "Research Report", these ARE the surveys you should list**

Instead, summarize the key insights from the reports and cite your sources. **IMPORTANT: Format findings as natural conversation, NOT as raw JSON or directive formats. Never include UX_FINDINGS or REVIEW_SUMMARY directives in your response - write findings naturally.**

**IMPORTANT: Keep responses concise and actionable. After providing the answer, suggest 2-3 relevant follow-up questions the user might want to ask next. For example: "Want to dive deeper? Try asking: 'How do we compare against [Competitor]?' or 'What are our main UX weaknesses?'"**

**SPECIFICALLY FOR COMPETITOR QUESTIONS**: When asked "who are our competitors?" or similar questions:
- **Extract competitor names from ALL sources**: 
  - **Research Reports (surveys)**: Check the "Key Findings & Insights" section of ALL Research Report source reports - surveys often mention competitor names, user preferences, and market insights
  - **Jurnii reports**: Check journey, perception, and executiveSummary sections
  - **Google search data**: Check for US market competitors if available
- **List ALL competitor names** found across ALL reports, not just from one source
- **Synthesize insights** about each competitor's strengths, weaknesses, and UX patterns from ALL available data
- **Cite ALL sources**: "Based on our research (FTD Survey, RND Survey, Jurnii Analysis), our competitors include [Company A], [Company B], and [Company C]..."
- **DO NOT only reference Jurnii** - use ALL available reports that mention competitors. Surveys often contain valuable competitor information that Jurnii doesn't have.

**SPECIFICALLY FOR COMPETITOR COMPARISON QUESTIONS** (e.g., "how do we compare against Stake?"):
- **Extract competitor comparison scores** from the journey, perception, and executiveSummary sections - these sections contain category-by-category scores/ratings for each competitor
- **Present comparison data** by category (e.g., "According to our Jurnii analysis, Stake scores 9/10 in Mobile UX compared to our 7/10, while we score 8/10 in Navigation compared to Stake's 7.5/10")
- **List all categories** where comparison data exists (Navigation, Mobile UX, Payment Options, User Experience, Performance, etc.)
- **Include specific scores/ratings** if mentioned in the reports - don't just say "Stake is better" - say "Stake scores 9/10 in Mobile while we score 7/10"
- **Synthesize insights** about where we outperform competitors and where we need to improve
- Always cite sources: "Based on the Jurnii Competitor UX Analysis (Jurnii, 2024-12-13), here's how we compare to Stake:"

The UX_FINDINGS directive will be added separately for visual display, but your main response should include actual competitor names, scores, and category comparisons when available in the reports.

14. **CRITICAL: For broad/general questions - ALWAYS ask for clarification FIRST**: When asked "tell me about X" or "what can you tell me about X" where X is ANY general topic (users, sportsbook, casino, etc.), you MUST FIRST ask what specific aspect they want to know about. DO NOT dump all information. Instead, respond with: "I have information on several areas related to [topic]. What would you like to know about specifically?" Then offer clear options such as: Design system & components, UX issues & findings, User insights & feedback, Navigation & information architecture, Mobile experience, Accessibility, Performance, Colors & typography, etc. ONLY provide detailed information when the user specifies what they want, or explicitly asks for "everything" or "all details". This prevents information overload and ensures responses are useful and targeted.

YOUR EXPERTISE (as Head of UX/CX and Design):
- **User Experience (UX)**: Deep understanding of user needs, pain points, and behavior patterns
- **Customer Experience (CX)**: Holistic view of the customer journey across all touchpoints
- **Design System Mastery**: Complete knowledge of our agnostic design system (colors, typography, components, spacing, patterns, tokens)
- **Figma Assets**: Access to all extracted components, colors, typography, logos, and design tokens from Figma
- **UX Research & Insights**: Analysis of UX reports from Jurnii, website analysis, Google reviews, and user feedback
- **Competitive Intelligence**: Understanding of competitor analysis and market insights
- **Brand Strategy**: Brand guidelines, communication principles, and multi-brand design (Casino, Sports, Loyalty, Authentication, Poker)
- **Design Processes**: Design workflows, team structure, and stakeholder collaboration
- **Data-Driven Design**: Making design decisions based on UX findings, user feedback, and analytics
- **Visual Design**: Image analysis and generation of design mockups using DALL-E based on our design system
- **Design Leadership**: Strategic thinking, prioritization, and guidance for the design team

Your personality: Direct, helpful, slightly casual but professional. You're the design expert who knows everything about the system, team, and processes. You provide actionable advice and creative ideas based on our brand and design system knowledge. You can make reasonable inferences from the design system and brand guidelines to answer questions about communication, tone, and brand approach.

=== RESPONSE FORMAT ===

**CRITICAL: NEVER include directive formats in your responses. Write ONLY natural, conversational text.**

When answering questions:
1. ONLY use information from the knowledge base above
2. **NEVER include UX_FINDINGS, REVIEW_SUMMARY, or any directive formats in your response** - these are added automatically by the system. Write findings as natural conversation.
3. **Format UX findings as natural conversation**, not raw JSON or code. For example, say "According to our Jurnii analysis, users struggle with navigation clarity (high severity) - the main menu lacks clear categories. Recommendation: Improve navigation hierarchy." NOT "UX_FINDINGS:...JSON..."
4. For ANY color question (including button colors, brand colors, primary/secondary colors, etc.), you MUST ALWAYS include a COLOR_SWATCH directive. NEVER just describe colors in text - always use the COLOR_SWATCH format.
5. Use format "COLOR_SWATCH:token:hex:description:figmaLink" for colors so UI can render swatches with Figma links. Example: COLOR_SWATCH:betRed/500:#ee3536:BetOnline primary red:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh
6. For tokens/parameters (typography, spacing, shadows, etc.), use format "TOKEN_COPY:tokenName:value:figmaLink" so users can copy to clipboard
7. For logo questions, ONLY use format "LOGO_IMAGE:brand:type:color:figmaLink:downloadUrl" when the user EXPLICITLY asks to see or display a logo. Do NOT include LOGO_IMAGE directives unless the user specifically requests to see a logo (e.g., "show me the BetOnline logo", "what does the logo look like", "display the logo"). If the user is just asking about logo usage, guidelines, or general logo information, provide text-only responses without LOGO_IMAGE directives.
8. Reference specific tokens/components when suggesting designs
9. For mockup ideas, list specific components, colors, and patterns you'd use
10. For process questions, reference the actual process steps and stakeholders
11. For stakeholder questions, reference their actual roles and responsibilities
12. Always include Figma deeplinks when mentioning tokens, colors, or components (use the main Figma file URL from knowledge base)
13. If asked about something not in the knowledge base, say you don't have that information

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

Example response for EXPLICIT logo display requests (e.g., "show me the BetOnline logo", "display the logo", "what does the logo look like"):
"Here's the BetOnline Primary Wordmark logo:

LOGO_IMAGE:BetOnline:Wordmark:Primary:https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh:/logos/BetOnline/wordmark/primary.svg"

For BetOnline, we also have:
- Wordmark variants: Primary Reversed, White, Black, VIP Primary, VIP Reversed
- Lettermark variants: Primary, White, Black, VIP Primary
- Icon variant: Primary
- Minimum sizes: Wordmark 119px width, Lettermark 50.79px width
- Usage: Primary brand identity, marketing materials, digital applications
- Clear space: Maintain clear space around logos as specified in Figma"

Example response for general logo questions (e.g., "what are the logo guidelines", "tell me about logos", "logo usage"):
"For BetOnline, we have multiple logo variants:
- Wordmark variants: Primary Reversed, White, Black, VIP Primary, VIP Reversed
- Lettermark variants: Primary, White, Black, VIP Primary
- Icon variant: Primary
- Minimum sizes: Wordmark 119px width, Lettermark 50.79px width
- Usage: Primary brand identity, marketing materials, digital applications
- Clear space: Maintain clear space around logos as specified in Figma

If you'd like to see a specific logo, just ask me to show it!"

Example response for user insights with source citations:
"Based on our UX research, BetOnline users face several key challenges:

**Navigation Issues** (UX Analysis: BetOnline - Website Analysis):
Users struggle to find specific betting options due to unclear navigation structure. The main menu lacks clear categories and organization.

**Mobile Experience** (Jurnii UX Report - 2024-01-15):
Mobile users report overlapping elements and text that's too small to read comfortably. This affects 65% of mobile users.

**Accessibility Concerns** (UX Analysis: BetOnline - Website Analysis):
Color contrast ratios don't meet WCAG standards, making navigation difficult for visually impaired users.

Each of these issues has been identified through comprehensive user research and testing. I can provide detailed recommendations for addressing any of these areas."

Example response for survey questions (e.g., "what surveys do we have"):
"Based on our research reports, we have the following surveys:

1. **FTD Survey Bonus Nov2024** (Survey, Research Report)
   - Summary: [summary from report]
   - Key findings: [findings from report]

2. **BOL RND survey results Q1 2025** (R&D Survey, Research Report)
   - Summary: [summary from report]
   - Key findings: [findings from report]

3. **BOL Marketing Acquisition Source Effectiveness Survey** (Marketing Survey, Research Report)
   - Summary: [summary from report]
   - Key findings: [findings from report]

4. **VoC-Nov-25** (Voice of Customer, Research Report)
   - Summary: [summary from report]
   - Key findings: [findings from report]

These surveys provide insights into user behavior, preferences, and areas for improvement across different aspects of our platform."

Example response for competitor questions:
"Based on our Jurnii competitor analysis, our main competitors include:

1. [Company A]
2. [Company B]
3. [Company C]

Each has different strengths - [Company A] excels in mobile UX, while [Company B] has simpler registration.

Want to dive deeper? Try asking:
- 'How do we compare against [Company A]?'
- 'What are our competitors' main weaknesses?'
- 'Show me UX findings from competitor analysis'"

Example response for competitor comparison questions (e.g., "how do we compare against Stake?"):
"Based on our Jurnii Competitor UX Analysis (Jurnii, 2024-12-13), here's how we compare against Stake across key categories:

**Category-by-Category Comparison**:

- **Navigation**: Stake scores 8.5/10, while we score 7/10. Stake has a more intuitive navigation structure, but we're closing the gap with recent improvements.

- **Mobile UX**: Stake scores 9/10 (strong mobile-first design), while we score 7/10. This is a critical area for improvement - mobile users report overlapping elements and small text size on our platform.

- **Payment Options**: Stake scores 10/10 (extensive crypto options), while we score 8/10. Stake's cryptocurrency focus is a key differentiator that attracts crypto-savvy users.

- **User Experience**: Stake scores 8.5/10, while we score 8/10. Both platforms are strong, but Stake's emphasis on engaging design gives them a slight edge.

- **Performance/Load Times**: Stake scores 9/10 (fast loading), while we score 7.5/10. Our slow loading times are a key area for optimization.

**Where We Outperform**:
- **Registration/Auth Flow**: We score 8/10 vs Stake's 7/10 - our simplified registration process is more user-friendly.
- **Customer Support**: We score 8/10 vs Stake's 7/10 - our multiple support channels are an advantage.

**Areas for Improvement**:
- Mobile UX (biggest gap: -2 points)
- Payment Options (consider expanding crypto options)
- Performance/Load Times (optimize images and scripts)

I can provide detailed recommendations for improving any of these categories based on the full analysis."

**IMPORTANT**: 
- When competitor names are mentioned in the journey, perception, or executiveSummary sections, ALWAYS include those actual names in your response. Don't just talk about "competitors" generically - name them!
- When comparison scores/ratings are available in the reports, ALWAYS present them with specific numbers/scores (e.g., "Stake scores 9/10 in Mobile" not just "Stake is better in Mobile"). Extract all category scores from the reports.

Always cite your sources when referencing reports, studies, or analysis. Use format: "(Report Title - Source, Date)" or "According to [Report Name]..."
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
async function processAIResponse(aiResponse: string, userMessage: string): Promise<string> {
  // Remove any directive formats that the AI might have incorrectly included
  // These should never appear in the AI's response - they're added by the system
  let cleanedResponse = aiResponse
    .replace(/UX_FINDINGS:[^\n]+/g, '') // Remove any UX_FINDINGS directives
    .replace(/REVIEW_SUMMARY:[^\n]+/g, '') // Remove any REVIEW_SUMMARY directives
    .replace(/UX_FINDINGS:[\s\S]*?\]/g, '') // Remove multiline UX_FINDINGS with JSON
    .trim()
  
  const lowerMessage = userMessage.toLowerCase()
  const responseLower = cleanedResponse.toLowerCase()
  
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
  
  // Check if this is a broad/general query that should prompt for clarification
  // Pattern: "tell me about X" or "what can you tell me about X" where X is a general topic
  const isBroadQuery = 
    (lowerMessage.includes('tell me about') && !lowerMessage.includes('specific')) ||
    (lowerMessage.includes('what can you tell me about') && !lowerMessage.includes('specific')) ||
    (lowerMessage.includes('what can you tell me') && !lowerMessage.includes('specific')) ||
    (lowerMessage.includes('what') && (
      lowerMessage.includes('findings') ||
      lowerMessage.includes('issues') ||
      lowerMessage.includes('problems')
    ) && !lowerMessage.includes('specific') && !lowerMessage.includes('about') && !lowerMessage.includes('show me all'))
  
  // If broad query, skip color detection entirely - don't add color swatches to broad questions
  if (isBroadQuery) {
    // Skip color detection for broad queries
  } else {
    // If user asked about a specific color and response doesn't have COLOR_SWATCH, try to add it
    // ONLY check user message, not response - don't add color swatches if user didn't ask about colors
    const isColorQuery = 
      lowerMessage.includes('color') || 
      lowerMessage.includes('colour') || 
      lowerMessage.includes('palette') ||
      lowerMessage.includes('pallete') ||
      (lowerMessage.includes('primary') && (lowerMessage.includes('color') || lowerMessage.includes('colour'))) || 
      (lowerMessage.includes('secondary') && (lowerMessage.includes('color') || lowerMessage.includes('colour'))) ||
      (lowerMessage.includes('button') && (lowerMessage.includes('color') || lowerMessage.includes('colour'))) ||
      lowerMessage.includes('what colour') ||
      lowerMessage.includes('what color') ||
      (lowerMessage.includes('show me') && (lowerMessage.includes('color') || lowerMessage.includes('colour')))
    
    // Check if this is a brand palette query
    const isBrandPaletteQuery = 
      (lowerMessage.includes('palette') || lowerMessage.includes('pallete') || lowerMessage.includes('colours') || lowerMessage.includes('colors')) &&
      (lowerMessage.includes('wild casino') || lowerMessage.includes('wildcasino') || 
       lowerMessage.includes('betonline') || lowerMessage.includes('bol') ||
       lowerMessage.includes('tiger') || lowerMessage.includes('lowvig') ||
       lowerMessage.includes('high roller') || lowerMessage.includes('superslot'))
    
    if (isColorQuery && !aiResponse.includes('COLOR_SWATCH')) {
      console.log('Color query detected but no COLOR_SWATCH found, attempting to add one')
      // Try to find color tokens mentioned in the USER MESSAGE only, not the response
      const mentionedTokens = Object.keys(colorTokenMap).filter(token => {
        const tokenLower = token.toLowerCase().replace(/\//g, '').replace(/\s+/g, '')
        const tokenBase = token.split('/')[0].toLowerCase()
        return lowerMessage.includes(tokenLower) || 
               lowerMessage.includes(tokenBase) ||
               lowerMessage.includes(token.replace(/\//g, ' ').toLowerCase())
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
      } else if (isColorQuery) {
        // Only default to betRed/500 if it's an EXPLICIT color query, not just mentioning colors in context
        const isExplicitColorQuery = 
          lowerMessage.includes('what color') || 
          lowerMessage.includes('what colour') ||
          (lowerMessage.includes('show me') && (lowerMessage.includes('color') || lowerMessage.includes('colour'))) ||
          lowerMessage.includes('palette') ||
          lowerMessage.includes('pallete')
        
        if (isExplicitColorQuery) {
          console.log('Explicit color query but no tokens found, defaulting to betRed/500')
          const defaultToken = 'betRed/500'
          const colorInfo = colorTokenMap[defaultToken]
          if (colorInfo) {
            const figmaLink = generateFigmaDeeplink(defaultToken)
            return `${aiResponse}\n\nCOLOR_SWATCH:${defaultToken}:${colorInfo.hex}:${colorInfo.description || ''}:${figmaLink || ''}`
          }
        }
      }
    }
  }
  
  // Only add logo if user EXPLICITLY asks for a logo AND mentions a brand
  // Don't auto-inject logos - only show when explicitly requested with a brand
  const isExplicitLogoRequest = 
    (lowerMessage.includes('show me') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('display') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('logo') && (lowerMessage.includes('betonline') || lowerMessage.includes('bol') || lowerMessage.includes('wild casino') || lowerMessage.includes('tiger') || lowerMessage.includes('lowvig') || lowerMessage.includes('sportsbetting') || lowerMessage.includes('high roller') || lowerMessage.includes('superslot') || lowerMessage.includes('queen bee') || lowerMessage.includes('gaming city'))) ||
    (lowerMessage.includes('what') && lowerMessage.includes('logo') && (lowerMessage.includes('look') || lowerMessage.includes('brand'))) ||
    (lowerMessage.includes('i need') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('i want') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('can i see') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('can you show') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('can i have') && lowerMessage.includes('logo')) ||
    (lowerMessage.includes('give me') && lowerMessage.includes('logo'))
  
  // Only proceed if it's an explicit logo request AND AI hasn't already included a logo
  if (isExplicitLogoRequest && !aiResponse.includes('LOGO_IMAGE')) {
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
    
    // Find the logo spec - ONLY if a brand was explicitly mentioned
    let logoSpec
    if (mentionedBrand) {
      logoSpec = knowledgeBase.logos.find(logo => logo.brand.toLowerCase() === mentionedBrand)
    } else {
      // Don't default to BetOnline - only show logo if brand is explicitly mentioned
      // This prevents unwanted logo cards from appearing
      logoSpec = null
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
  
  // If broad query, prevent auto-adding UX findings and color swatches - let AI handle it with clarification
  if (isBroadQuery) {
    console.log('Broad query detected - skipping auto-adding UX findings and color swatches, letting AI handle clarification')
  }
  
  // If user asked about UX findings, reviews, or Jurnii, format findings visually
  // BUT exclude survey-specific queries - surveys should show survey content, not UX findings
  const isSurveyQuery = lowerMessage.includes('survey') || 
                        lowerMessage.includes('ftd') || 
                        lowerMessage.includes('first time deposit') ||
                        lowerMessage.includes('rnd') ||
                        lowerMessage.includes('voc') ||
                        lowerMessage.includes('voice of customer') ||
                        lowerMessage.includes('marketing survey')
  
  const isUXQuery = 
    !isBroadQuery && // Don't auto-dump on broad queries
    !isSurveyQuery && // Don't show UX findings for survey queries - show survey content instead
    ( // Don't auto-dump on broad queries
      lowerMessage.includes('jurnii') ||
      lowerMessage.includes('show me all') ||
      lowerMessage.includes('all findings') ||
      lowerMessage.includes('all issues') ||
      lowerMessage.includes('all problems') ||
      lowerMessage.includes('specific') ||
      lowerMessage.includes('navigation') ||
      lowerMessage.includes('mobile') ||
      lowerMessage.includes('accessibility') ||
      lowerMessage.includes('performance') ||
      lowerMessage.includes('reviews') ||
      lowerMessage.includes('user feedback') ||
      lowerMessage.includes('what did') ||
      lowerMessage.includes('competitor') ||
      lowerMessage.includes('competitors') ||
      lowerMessage.includes('ux report') ||
      lowerMessage.includes('user experience')
    )
  
  // Always check knowledge base for UX reports, but only auto-include findings for specific queries
  // This helps answer questions like "who are our competitors?" or "what can jurnii tell me?"
  if (isUXQuery || (!isBroadQuery && (lowerMessage.includes('competitor') || lowerMessage.includes('jurnii')))) {
    // Try Supabase first, then fallback to in-memory
    let reportsToCheck: typeof knowledgeBase.uxReports = []
    
    try {
      const { isSupabaseConfigured } = await import('@/lib/supabase/client')
      const supabaseKnowledgeBase = await import('@/lib/supabase/knowledgeBase')
      
      if (isSupabaseConfigured() && (supabaseKnowledgeBase as any).getUXReports) {
        reportsToCheck = await (supabaseKnowledgeBase as any).getUXReports()
        console.log(`✅ Loaded ${reportsToCheck.length} UX reports from Supabase for query processing`)
      } else {
        throw new Error('Supabase not configured')
      }
    } catch (error) {
      console.log('Could not load from Supabase, using in-memory knowledge base:', error)
      // Fallback to in-memory knowledge base
      reportsToCheck = knowledgeBase.uxReports
    }
    
    if (reportsToCheck.length > 0) {
      // Find relevant reports
      const relevantReports = reportsToCheck.filter(report => {
      const reportLower = `${report.title} ${report.summary || ''} ${report.source}`.toLowerCase()
      
      // PRIORITY 1: If asking about surveys, FTD, RND, VoC, marketing - ONLY include Research Report source (surveys)
      if (isSurveyQuery) {
        // For survey queries, ONLY return Research Report source - exclude Jurnii
        if (report.source !== 'Research Report') {
          return false // Exclude non-survey reports for survey queries
        }
        // Further filter by specific survey type if mentioned
        if (lowerMessage.includes('ftd') || lowerMessage.includes('first time deposit')) {
          return reportLower.includes('ftd') || reportLower.includes('first time deposit')
        }
        if (lowerMessage.includes('rnd')) {
          return reportLower.includes('rnd')
        }
        if (lowerMessage.includes('voc') || lowerMessage.includes('voice of customer')) {
          return reportLower.includes('voc') || reportLower.includes('voice of customer')
        }
        if (lowerMessage.includes('marketing')) {
          return reportLower.includes('marketing')
        }
        // If just asking about surveys in general, return all Research Report source
        return true
      }
      
      // PRIORITY 2: If asking about competitors, include ALL reports that mention competitors
      // This includes Jurnii reports AND Research Reports (surveys) which often contain competitor names
      if (lowerMessage.includes('competitor')) {
        // Include Jurnii reports (they contain competitor analysis)
        if (report.source.toLowerCase().includes('jurnii')) {
          return true
        }
        // Include Research Reports (surveys) - they often mention competitor names in keyFindings
        if (report.source === 'Research Report') {
          // Check if report mentions competitors in title, summary, or executiveSummary
          return reportLower.includes('competitor') ||
                 reportLower.includes('competition') ||
                 (report.executiveSummary && typeof report.executiveSummary === 'string' && report.executiveSummary.toLowerCase().includes('competitor'))
        }
        // Include any other reports that mention competitors
        return reportLower.includes('competitor') || reportLower.includes('competition')
      }
      
      // PRIORITY 3: If asking about Jurnii specifically or "what can jurnii tell me"
      if (lowerMessage.includes('jurnii') || (lowerMessage.includes('tell me') && lowerMessage.includes('jurnii'))) {
        return report.source.toLowerCase().includes('jurnii')
      }
      
      // PRIORITY 4: If asking "what can X tell me" (but not about surveys), include all reports
      if (lowerMessage.includes('tell me') || lowerMessage.includes('what can')) {
        return true
      }
      
      // Otherwise filter by source
      return lowerMessage.includes('review') ? report.source.toLowerCase().includes('review') :
             lowerMessage.includes('website') ? report.source.toLowerCase().includes('website') :
             true // If no specific source mentioned, include all
    })
    
    if (relevantReports.length > 0) {
      // Format findings for visual display
      // BUT: For survey queries, only include survey reports (Research Report source), not Jurnii reports
      const findingsDirectives: string[] = []
      const reviewSummaries: any[] = []
      
      relevantReports.forEach(report => {
        // For survey queries, DO NOT add UX_FINDINGS directives - surveys should show their content naturally
        // The AI will reference the survey content from the knowledge base prompt
        if (isSurveyQuery) {
          return // Skip adding UX_FINDINGS for survey queries - let AI reference survey content naturally
        }
        
        // For non-survey queries, skip Research Report surveys unless explicitly asked
        if (!isSurveyQuery && report.source === 'Research Report' && 
            !lowerMessage.includes('survey') && !lowerMessage.includes('research')) {
          return // Skip survey reports for non-survey queries
        }
        
        if (report.findings && report.findings.length > 0) {
          // Include source information in the directive for citations
          findingsDirectives.push(`UX_FINDINGS:${report.title}:${report.source}${report.date ? ` (${report.date})` : ''}:${report.sourceUrl || ''}:${JSON.stringify(report.findings)}`)
        }
        
        // If it's a review report, also add summary
        if (report.source.toLowerCase().includes('review') || report.source.toLowerCase().includes('google')) {
          // Extract rating and themes from summary if available
          const summaryMatch = report.summary?.match(/(\d+\.?\d*)\s*(star|rating|out of)/i)
          const rating = summaryMatch ? parseFloat(summaryMatch[1]) : undefined
          
          reviewSummaries.push({
            overallRating: rating,
            totalReviews: undefined, // Not stored in current structure
            commonThemes: report.findings?.map(f => f.issue).slice(0, 5) || [],
            strengths: [], // Not stored in current structure
          })
        }
      })
      
      if (findingsDirectives.length > 0) {
        console.log(`Adding ${findingsDirectives.length} UX_FINDINGS directives to response`)
        // Use cleanedResponse to ensure no duplicate directives
        return `${cleanedResponse}\n\n${findingsDirectives.join('\n')}`
      } else {
        console.log('No findings directives generated, but reports exist')
      }
    } else {
      console.log(`UX query detected but no relevant reports found. Total reports: ${reportsToCheck.length}`)
    }
    }
  }
  
  return cleanedResponse
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
