/**
 * Comprehensive Knowledge Base
 * 
 * This file contains all knowledge about:
 * - Agnostic Design System (from Figma)
 * - Stakeholders
 * - Processes
 * - Additional Figma files
 * 
 * This knowledge is used by CH to answer questions accurately.
 */

import { DesignSystemInfo, designSystem, colorTokenMap } from './designSystem'

export interface Stakeholder {
  name: string
  role: string
  responsibilities?: string[]
  contact?: string
  areas?: string[] // Areas they work on (Casino, Sports, etc.)
}

export interface Process {
  name: string
  description: string
  steps?: string[]
  stakeholders?: string[] // Names of stakeholders involved
  areas?: string[] // Areas this process applies to
  tools?: string[] // Tools used (Figma, Mattermost, Craft.io, etc.)
}

export interface FigmaFile {
  name: string
  url?: string
  description?: string
  contains?: string[] // What it contains (components, colors, patterns, etc.)
  lastUpdated?: string
}

export interface LogoVariant {
  brand: string
  type: 'Wordmark' | 'Lettermark' | 'Icon'
  color: 'Primary' | 'Primary Reversed' | 'White' | 'Black' | 'VIP Primary' | 'VIP Secondary' | 'VIP Reversed' | 'Default'
  mode?: 'Light Mode' | 'Dark Mode' | 'VIP'
  size?: 'small' | 'large'
  style?: 'Full Color' | 'Monochromatic' | 'VIP'
  description?: string
}

export interface LogoSpecs {
  brand: string
  minimumSize?: {
    wordmark?: string
    lettermark?: string
  }
  clearSpace?: string
  usage?: string[]
  variants: LogoVariant[]
}

export interface BrandGuidelines {
  toneOfVoice: {
    principles: string[]
    do: string[]
    dont: string[]
    examples: string[]
  }
  communicationWithCustomers: {
    approach: string
    principles: string[]
    channels: string[]
    whenToEscalate: string[]
  }
  brandValues: string[]
  designPrinciples: string[]
}

export interface KnowledgeBase {
  designSystem: DesignSystemInfo
  colorTokens: typeof colorTokenMap
  stakeholders: Stakeholder[]
  processes: Process[]
  figmaFiles: FigmaFile[]
  logos: LogoSpecs[]
  brandGuidelines: BrandGuidelines
  additionalNotes?: string[]
}

/**
 * Comprehensive Knowledge Base
 * Add information here as you share more Figma files, stakeholder info, and processes
 */
export const knowledgeBase: KnowledgeBase = {
  designSystem,
  colorTokens: colorTokenMap,
  
  // Stakeholders - Add team members, their roles, and responsibilities
  stakeholders: [
    {
      name: 'CH',
      role: 'Head of Design',
      responsibilities: [
        'Design system oversight',
        'Design reviews',
        'Team leadership',
        'Design request assignments',
      ],
      areas: ['All', 'Other area'], // Handles requests for "Other area"
    },
    {
      name: 'Lilly',
      role: 'Designer',
      responsibilities: [
        'Casino designs',
        'Loyalty designs',
        'VIP tier designs',
      ],
      areas: ['Casino', 'Loyalty'],
    },
    {
      name: 'Sam',
      role: 'Designer',
      responsibilities: [
        'Sports betting designs',
      ],
      areas: ['Sports'],
    },
    {
      name: 'Nek',
      role: 'Designer',
      responsibilities: [
        'Authentication designs',
        'Account management designs',
      ],
      areas: ['Authentication'],
    },
    {
      name: 'Victor',
      role: 'Designer',
      responsibilities: [
        'Poker designs',
        'Poker table designs',
      ],
      areas: ['Poker'],
    },
  ],
  
  // Processes - Add design processes, workflows, and procedures
  processes: [
    {
      name: 'Design Request Process',
      description: 'How design requests are submitted and processed through the design request app',
      steps: [
        'User submits design request via design request app',
        'User selects area (Sports, Casino, Loyalty, Authentication, Poker, Other)',
        'User provides PRD-style details (What, Why, Context, Goals, Use Cases)',
        'User selects deadline (ASAP, This week, Next week, etc.)',
        'Request automatically assigned to designer based on area',
        'Request submitted to Mattermost and Craft.io',
        'Designer creates Figma file using agnostic design system',
        'Design delivered as Figma file',
      ],
      stakeholders: ['CH', 'Lilly', 'Sam', 'Nek', 'Victor'],
      areas: ['All'],
      tools: ['Figma', 'Mattermost', 'Craft.io', 'Design Request App'],
    },
    {
      name: 'Designer Assignment',
      description: 'How designers are assigned to design requests based on area',
      steps: [
        'Sports area → Assigned to Sam',
        'Casino area → Assigned to Lilly',
        'Loyalty area → Assigned to Lilly',
        'Authentication area → Assigned to Nek',
        'Poker area → Assigned to Victor',
        'Other area → Assigned to CH (Head of Design)',
      ],
      stakeholders: ['CH', 'Lilly', 'Sam', 'Nek', 'Victor'],
      areas: ['All'],
    },
  ],
  
  // Figma Files - Track all Figma files in the design system
  figmaFiles: [
    {
      name: 'Agnostic Design System | MUI v5.15.0 - v5.14.12',
      url: 'https://www.figma.com/design/8Nmyws2RW2VovSvCbTd3Oh/%F0%9F%94%98.-Agnostic-Design-System-%7C-MUI-v5.15.0---v5.14.12',
      description: 'Main agnostic design system file with tokens, colors, typography, components, patterns, and logos',
      contains: ['Color tokens', 'Typography', 'Spacing', 'Components', 'Design patterns', 'Brand configurations', 'Logos'],
    },
    {
      name: 'My Account / Dashboard - MUI ADS',
      url: 'https://www.figma.com/design/jkFY1lvE3eWzXZJvMVYMFe/1.-My-Account--Dashboard----MUI-ADS',
      description: 'My Account and Dashboard designs using the MUI Agnostic Design System',
      contains: ['Dashboard components', 'Account management UI', 'User interface patterns', 'MUI ADS components'],
    },
    {
      name: 'Casino-26 - LightMode | MUI-ADS',
      url: 'https://www.figma.com/design/dsg9EC3QiVp7h80BNy47EA/Casino-26--LightMode-%7C-MUI-ADS',
      description: 'Casino area designs in light mode using the MUI Agnostic Design System, including navigation components',
      contains: ['Casino components', 'Light mode designs', 'Game tiles', 'Casino UI patterns', 'Navigation components', 'Header navigation', 'Side menu navigation', 'MUI ADS components'],
    },
    {
      name: 'BetOnline BrandBook - Toolkit',
      url: 'https://www.figma.com/design/X4KXaJZSN23sQJHYhZlT7N/BetOnline_BrandBook---Toolkit',
      description: 'BetOnline brand book toolkit with comprehensive brand guidelines, colors, typography, spacing, and product-focused design tokens',
      contains: [
        'BetOnline brand colors',
        'BetOnline typography (Desktop & Mobile headings H1-H7, Body styles)',
        'BetOnline spacing tokens (1-12 scale)',
        'BetOnline text colors',
        'BetOnline background colors',
        'BetOnline component colors (buttons, tables, navigation, chips, etc.)',
        'BetOnline product colors (HomePage, VIP/Loyalty, Sportsbook, Cashier)',
        'BetOnline interaction states (hover, focus, disabled)',
        'BetOnline shadow/elevation tokens',
        'BetOnline brand guidelines',
      ],
    },
    // Add more Figma files here as you share them
  ],
  
  // Logos - Comprehensive logo system from Figma
  logos: [
    {
      brand: 'BetOnline',
      minimumSize: {
        wordmark: '119px width',
        lettermark: '50.79px width',
      },
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Primary brand identity', 'Marketing materials', 'Digital applications'],
      variants: [
        { brand: 'BetOnline', type: 'Wordmark', color: 'Primary', description: 'Primary wordmark logo' },
        { brand: 'BetOnline', type: 'Wordmark', color: 'Primary Reversed', description: 'Primary reversed wordmark' },
        { brand: 'BetOnline', type: 'Wordmark', color: 'White', description: 'White wordmark for dark backgrounds' },
        { brand: 'BetOnline', type: 'Wordmark', color: 'Black', description: 'Black wordmark for light backgrounds' },
        { brand: 'BetOnline', type: 'Wordmark', color: 'VIP Primary', description: 'VIP primary wordmark' },
        { brand: 'BetOnline', type: 'Wordmark', color: 'VIP Reversed', description: 'VIP reversed wordmark' },
        { brand: 'BetOnline', type: 'Lettermark', color: 'Primary', description: 'Primary lettermark (B icon)' },
        { brand: 'BetOnline', type: 'Lettermark', color: 'White', description: 'White lettermark' },
        { brand: 'BetOnline', type: 'Lettermark', color: 'Black', description: 'Black lettermark' },
        { brand: 'BetOnline', type: 'Lettermark', color: 'VIP Primary', description: 'VIP primary lettermark' },
        { brand: 'BetOnline', type: 'Icon', color: 'Primary', description: 'BetOnline icon' },
      ],
    },
    {
      brand: 'SportsBetting',
      minimumSize: {
        wordmark: '59.53px width',
        lettermark: '26.27px width',
      },
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Sports betting area', 'Sports-related marketing'],
      variants: [
        { brand: 'SportsBetting', type: 'Wordmark', color: 'Primary', description: 'Primary wordmark logo' },
        { brand: 'SportsBetting', type: 'Wordmark', color: 'White', description: 'White wordmark' },
        { brand: 'SportsBetting', type: 'Wordmark', color: 'Black', description: 'Black wordmark' },
        { brand: 'SportsBetting', type: 'Lettermark', color: 'Primary', description: 'Primary lettermark' },
        { brand: 'SportsBetting', type: 'Lettermark', color: 'White', description: 'White lettermark' },
        { brand: 'SportsBetting', type: 'Lettermark', color: 'Black', description: 'Black lettermark' },
      ],
    },
    {
      brand: 'LowVig',
      minimumSize: {
        wordmark: '119px width',
        lettermark: '32px width',
      },
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['LowVig brand applications', 'Marketing materials'],
      variants: [
        { brand: 'LowVig', type: 'Wordmark', color: 'Primary', description: 'Primary wordmark logo' },
        { brand: 'LowVig', type: 'Wordmark', color: 'Primary Reversed', description: 'Primary reversed wordmark' },
        { brand: 'LowVig', type: 'Wordmark', color: 'White', description: 'White wordmark' },
        { brand: 'LowVig', type: 'Wordmark', color: 'Black', description: 'Black wordmark' },
        { brand: 'LowVig', type: 'Lettermark', color: 'Primary', description: 'Primary lettermark' },
        { brand: 'LowVig', type: 'Lettermark', color: 'Primary Reversed', description: 'Primary reversed lettermark' },
        { brand: 'LowVig', type: 'Lettermark', color: 'White', description: 'White lettermark' },
        { brand: 'LowVig', type: 'Lettermark', color: 'Black', description: 'Black lettermark' },
      ],
    },
    {
      brand: 'TigerGaming',
      minimumSize: {
        wordmark: '85.4px width',
        lettermark: '19.53px width',
      },
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Tiger Gaming brand applications', 'Marketing materials'],
      variants: [
        { brand: 'TigerGaming', type: 'Wordmark', color: 'Primary', description: 'Primary wordmark with tagline' },
        { brand: 'TigerGaming', type: 'Wordmark', color: 'Primary Reversed', description: 'Primary reversed wordmark' },
        { brand: 'TigerGaming', type: 'Wordmark', color: 'White', description: 'White wordmark' },
        { brand: 'TigerGaming', type: 'Wordmark', color: 'Black', description: 'Black wordmark' },
        { brand: 'TigerGaming', type: 'Wordmark', color: 'Primary', style: 'Full Color', description: 'Wordmark without tagline' },
        { brand: 'TigerGaming', type: 'Lettermark', color: 'Primary', description: 'Primary lettermark (T icon)' },
        { brand: 'TigerGaming', type: 'Lettermark', color: 'Primary Reversed', description: 'Primary reversed lettermark' },
        { brand: 'TigerGaming', type: 'Lettermark', color: 'White', description: 'White lettermark' },
        { brand: 'TigerGaming', type: 'Lettermark', color: 'Black', description: 'Black lettermark' },
      ],
    },
    {
      brand: 'WildCasino',
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Wild Casino brand applications'],
      variants: [
        { brand: 'WildCasino', type: 'Wordmark', color: 'Default', mode: 'Light Mode', style: 'Full Color', description: 'Default wordmark' },
        { brand: 'WildCasino', type: 'Wordmark', color: 'White', mode: 'Light Mode', description: 'White wordmark' },
        { brand: 'WildCasino', type: 'Wordmark', color: 'Black', mode: 'Light Mode', description: 'Black wordmark' },
        { brand: 'WildCasino', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Full Color', description: 'Dark mode wordmark' },
        { brand: 'WildCasino', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Monochromatic', description: 'Dark mode monochromatic' },
        { brand: 'WildCasino', type: 'Wordmark', color: 'VIP Primary', mode: 'VIP', style: 'VIP', description: 'VIP wordmark' },
        { brand: 'WildCasino', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Full Color', description: 'Small icon' },
        { brand: 'WildCasino', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Full Color', description: 'Dark mode small icon' },
        { brand: 'WildCasino', type: 'Icon', color: 'VIP Primary', mode: 'VIP', size: 'small', style: 'VIP', description: 'VIP small icon' },
      ],
    },
    {
      brand: 'HighRoller',
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['High Roller brand applications'],
      variants: [
        { brand: 'HighRoller', type: 'Wordmark', color: 'Default', mode: 'Light Mode', style: 'Full Color', description: 'Default wordmark' },
        { brand: 'HighRoller', type: 'Wordmark', color: 'White', mode: 'Light Mode', description: 'White wordmark' },
        { brand: 'HighRoller', type: 'Wordmark', color: 'Black', mode: 'Light Mode', description: 'Black wordmark' },
        { brand: 'HighRoller', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Full Color', description: 'Dark mode wordmark' },
        { brand: 'HighRoller', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Monochromatic', description: 'Dark mode monochromatic' },
        { brand: 'HighRoller', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Full Color', description: 'Small icon' },
        { brand: 'HighRoller', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Full Color', description: 'Dark mode small icon' },
      ],
    },
    {
      brand: 'GamingCity',
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Gaming City brand applications'],
      variants: [
        { brand: 'GamingCity', type: 'Wordmark', color: 'Default', mode: 'Light Mode', style: 'Full Color', description: 'Default wordmark' },
        { brand: 'GamingCity', type: 'Wordmark', color: 'White', mode: 'Light Mode', description: 'White wordmark' },
        { brand: 'GamingCity', type: 'Wordmark', color: 'Black', mode: 'Light Mode', description: 'Black wordmark' },
        { brand: 'GamingCity', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Full Color', description: 'Dark mode wordmark' },
        { brand: 'GamingCity', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Monochromatic', description: 'Dark mode monochromatic' },
        { brand: 'GamingCity', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Full Color', description: 'Small icon' },
        { brand: 'GamingCity', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Full Color', description: 'Dark mode small icon' },
      ],
    },
    {
      brand: 'QueenBee',
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['Queen Bee brand applications'],
      variants: [
        { brand: 'QueenBee', type: 'Wordmark', color: 'Default', mode: 'Light Mode', style: 'Full Color', description: 'Default wordmark' },
        { brand: 'QueenBee', type: 'Wordmark', color: 'White', mode: 'Light Mode', description: 'White wordmark' },
        { brand: 'QueenBee', type: 'Wordmark', color: 'Black', mode: 'Light Mode', description: 'Black wordmark' },
        { brand: 'QueenBee', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Full Color', description: 'Dark mode wordmark' },
        { brand: 'QueenBee', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', style: 'Monochromatic', description: 'Dark mode monochromatic' },
        { brand: 'QueenBee', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Full Color', description: 'Small icon' },
        { brand: 'QueenBee', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Full Color', description: 'Dark mode small icon' },
      ],
    },
    {
      brand: 'SuperSlots',
      clearSpace: 'Maintain clear space around logos as specified in Figma',
      usage: ['SuperSlots brand applications'],
      variants: [
        { brand: 'SuperSlots', type: 'Wordmark', color: 'Default', mode: 'Light Mode', size: 'large', style: 'Full Color', description: 'Large full color wordmark' },
        { brand: 'SuperSlots', type: 'Wordmark', color: 'Default', mode: 'Light Mode', size: 'large', style: 'Monochromatic', description: 'Large monochromatic wordmark' },
        { brand: 'SuperSlots', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', size: 'large', style: 'Full Color', description: 'Dark mode large wordmark' },
        { brand: 'SuperSlots', type: 'Wordmark', color: 'Default', mode: 'Dark Mode', size: 'large', style: 'Monochromatic', description: 'Dark mode large monochromatic' },
        { brand: 'SuperSlots', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Full Color', description: 'Small icon (SS)' },
        { brand: 'SuperSlots', type: 'Icon', color: 'Default', mode: 'Light Mode', size: 'small', style: 'Monochromatic', description: 'Small monochromatic icon' },
        { brand: 'SuperSlots', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Full Color', description: 'Dark mode small icon' },
        { brand: 'SuperSlots', type: 'Icon', color: 'Default', mode: 'Dark Mode', size: 'small', style: 'Monochromatic', description: 'Dark mode small monochromatic' },
      ],
    },
  ],
  
  // Brand Guidelines - Communication principles, tone of voice, brand values
  brandGuidelines: {
    toneOfVoice: {
      principles: [
        'Direct and clear communication',
        'Professional yet approachable',
        'Helpful and solution-oriented',
        'Confident but not arrogant',
        'Respectful of user time and needs',
      ],
      do: [
        'Use clear, concise language',
        'Be specific and actionable',
        'Show expertise without being condescending',
        'Acknowledge limitations honestly',
        'Provide context when helpful',
        'Use design system terminology accurately',
      ],
      dont: [
        'Use jargon without explanation',
        'Be vague or ambiguous',
        'Make up information',
        'Overpromise or oversell',
        'Ignore user questions',
        'Use overly casual or unprofessional language',
      ],
      examples: [
        'Instead of "That color is nice", say "The primary color betRed (#ee3536) works well for CTAs because it has high contrast and aligns with our brand identity"',
        'Instead of "I think...", say "Based on our design system, the recommended spacing is 16px for this component"',
        'Instead of "I don\'t know", say "I don\'t have that specific information in our knowledge base. Can you check the Figma file or share more details?"',
      ],
    },
    communicationWithCustomers: {
      approach: 'Professional, helpful, and design-focused',
      principles: [
        'Always reference the design system when discussing design decisions',
        'Explain design choices using specific tokens, components, and patterns',
        'Be transparent about what information is available and what isn\'t',
        'Guide users to the right resources (Figma files, designers, processes)',
        'Use design system terminology consistently',
      ],
      channels: [
        'Design Request App - Primary channel for design requests',
        'Figma - Design files and collaboration',
        'Mattermost - Team communication and updates',
        'Craft.io - Project management and tracking',
      ],
      whenToEscalate: [
        'Questions about brand strategy or high-level decisions → CH (Head of Design)',
        'Questions about specific areas → Area designer (Lilly, Sam, Nek, Victor)',
        'Questions about processes → Reference process documentation',
        'Questions about design system → Use knowledge base and Figma files',
      ],
    },
    brandValues: [
      'Consistency - Using shared design tokens and components across all brands',
      'Quality - Professional, polished design that meets user needs',
      'Efficiency - Streamlined processes and clear communication',
      'Collaboration - Working together with stakeholders and designers',
      'Innovation - Building on a solid design system foundation',
    ],
    designPrinciples: [
      'Use the agnostic design system as the foundation',
      'Maintain brand consistency while allowing customization',
      'Prioritize user experience and accessibility',
      'Follow established patterns and components',
      'Document design decisions and rationale',
    ],
  },
  
  // Additional notes - Any other important information
  additionalNotes: [
    // Add any additional notes, guidelines, or important information here
  ],
}

/**
 * Get all knowledge as a formatted string for AI prompts
 */
export function getKnowledgeBasePrompt(): string {
  const { designSystem, colorTokens, stakeholders, processes, figmaFiles, logos, brandGuidelines, additionalNotes } = knowledgeBase
  
  // Format color tokens
  const colorTokensList = Object.entries(colorTokens)
    .map(([token, info]) => `  - ${token}: ${info.hex}${info.description ? ` (${info.description})` : ''}`)
    .join('\n')
  
  // Format stakeholders
  const stakeholdersList = stakeholders.length > 0
    ? stakeholders.map(s => {
        let desc = `  - ${s.name}: ${s.role}`
        if (s.responsibilities?.length) desc += `\n    Responsibilities: ${s.responsibilities.join(', ')}`
        if (s.areas?.length) desc += `\n    Areas: ${s.areas.join(', ')}`
        if (s.contact) desc += `\n    Contact: ${s.contact}`
        return desc
      }).join('\n\n')
    : '  (No stakeholders added yet)'
  
  // Format processes
  const processesList = processes.length > 0
    ? processes.map(p => {
        let desc = `  - ${p.name}: ${p.description}`
        if (p.steps?.length) {
          desc += `\n    Steps:\n${p.steps.map((step, i) => `      ${i + 1}. ${step}`).join('\n')}`
        }
        if (p.stakeholders?.length) desc += `\n    Stakeholders: ${p.stakeholders.join(', ')}`
        if (p.areas?.length) desc += `\n    Areas: ${p.areas.join(', ')}`
        if (p.tools?.length) desc += `\n    Tools: ${p.tools.join(', ')}`
        return desc
      }).join('\n\n')
    : '  (No processes added yet)'
  
  // Format Figma files
  const figmaFilesList = figmaFiles.map(f => {
    let desc = `  - ${f.name}`
    if (f.description) desc += `\n    Description: ${f.description}`
    if (f.contains?.length) desc += `\n    Contains: ${f.contains.join(', ')}`
    if (f.url) desc += `\n    URL: ${f.url}`
    return desc
  }).join('\n\n')
  
  // Format components
  const components = designSystem.components || {}
  const componentList = Object.entries(components)
    .map(([name, comp]) => {
      let desc = `  - ${name}: ${comp.description || 'Component'}`
      if (comp.usage) desc += `\n    Usage: ${comp.usage}`
      if (comp.variants?.length) desc += `\n    Variants: ${comp.variants.join(', ')}`
      if (comp.props?.length) desc += `\n    Props: ${comp.props.join(', ')}`
      return desc
    })
    .join('\n\n')
  
  // Format patterns
  const patterns = designSystem.patterns || {}
  const patternList = Object.entries(patterns)
    .map(([name, pattern]) => {
      let desc = `  - ${name}: ${pattern.description || 'Pattern'}`
      if (pattern.whenToUse) desc += `\n    When to use: ${pattern.whenToUse}`
      if (pattern.examples?.length) desc += `\n    Examples: ${pattern.examples.join(', ')}`
      return desc
    })
    .join('\n\n')
  
  // Format brands with comprehensive color information
  const brands = designSystem.brands || {}
  const brandList = Object.entries(brands)
    .map(([name, brand]) => {
      let desc = `  - ${name}: ${brand.description || 'Brand'}`
      if (brand.colors?.primary?.length) {
        const primaryColors = brand.colors.primary.map(c => {
          const colorInfo = colorTokens[c] || colorTokens[c.split('/')[0]]
          return colorInfo ? `${c} (${colorInfo.hex})` : c
        }).join(', ')
        desc += `\n    Primary colors: ${primaryColors}`
      }
      if (brand.colors?.secondary?.length) {
        const secondaryColors = brand.colors.secondary.map(c => {
          const colorInfo = colorTokens[c] || colorTokens[c.split('/')[0]]
          return colorInfo ? `${c} (${colorInfo.hex})` : c
        }).join(', ')
        desc += `\n    Secondary colors: ${secondaryColors}`
      }
      if (brand.colors?.accent?.length) {
        const accentColors = brand.colors.accent.map(c => {
          const colorInfo = colorTokens[c] || colorTokens[c.split('/')[0]]
          return colorInfo ? `${c} (${colorInfo.hex})` : c
        }).join(', ')
        desc += `\n    Accent colors: ${accentColors}`
      }
      if (brand.colors?.neutral?.length) {
        const neutralColors = brand.colors.neutral.map(c => {
          const colorInfo = colorTokens[c] || colorTokens[c.split('/')[0]]
          return colorInfo ? `${c} (${colorInfo.hex})` : c
        }).join(', ')
        desc += `\n    Neutral colors: ${neutralColors}`
      }
      if (brand.colors?.background?.length) {
        const backgroundColors = brand.colors.background.map(c => {
          const colorInfo = colorTokens[c] || colorTokens[c.split('/')[0]]
          return colorInfo ? `${c} (${colorInfo.hex})` : c
        }).join(', ')
        desc += `\n    Background colors: ${backgroundColors}`
      }
      return desc
    })
    .join('\n\n')
  
  return `=== COMPREHENSIVE KNOWLEDGE BASE ===

**FIGMA FILES:**
${figmaFilesList}

**COLORS (All tokens from Figma):**
${colorTokensList}

**TYPOGRAPHY (From Figma):**
- Primary font: Inter
- Secondary font: Open Sans
- Font weights: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700)
- Heading styles: 
  - Display xs (24px, Regular/Medium)
  - Text xl (20px, Regular)
  - Text lg (18px, Medium)
  - Special Headings/Display 5 (110px, Bold, Inter, -3px letter spacing) - BetOnline brand book
  - Desktop/Heading/Bold/H1-H7 (40px, 36px, 32px, 24px, 20px, 18px, 16px) - BetOnline toolkit
  - Desktop/Heading/SemiBold/H1-H7 (40px, 36px, 32px, 24px, 20px, 18px, 16px) - BetOnline toolkit
  - Desktop/Heading/Regular/H1-H2 (40px, 36px) - BetOnline toolkit
  - Desktop/Heading/ItalicRegular/H1-H6 (40px, 36px, 32px, 24px, 20px, 18px) - BetOnline toolkit
  - Mobile/Heading/Bold/H1-H7 (32px, 28px, 24px, 20px, 18px, 16px, 14px) - BetOnline toolkit
  - Mobile/Heading/SemiBold/H1-H2, H6-H7 (32px, 28px, 16px, 14px) - BetOnline toolkit
  - Mobile/Heading/Regular/H1-H7 (30px, 28px, 24px, 20px, 18px, 16px, 14px) - BetOnline toolkit
  - Mobile/Heading/Italic Regular/H1-H6 (32px, 28px, 24px, 20px, 18px, 16px) - BetOnline toolkit
- Body styles: 
  - Body/Bold/Body 4 (12px, SemiBold, Open Sans)
  - Material UI/typography/body2 (14px, Regular, Open Sans)
  - Material UI/typography/caption (12px, Regular, Open Sans)
  - Material UI/typography/h5 (24px, Light, Open Sans)
  - Text Single/100/Regular (16px, Regular, Inter, 18px line height) - BetOnline brand book
  - Text Single/100/Bold (16px, Bold, Inter, 18px line height) - BetOnline brand book
  - Desktop/Body/SemiBold/B1-B4 (18px, 16px, 14px, 12px) - BetOnline toolkit
  - Desktop/Body/Regular/B1-B4 (18px, 16px, 14px, 12px) - BetOnline toolkit
  - Desktop/Body/LightItalic/B1-B4 (18px, 16px, 14px, 12px) - BetOnline toolkit
  - Mobile/Body/SemiBold/B1-B4 (18px, 16px, 14px, 12px) - BetOnline toolkit
  - Mobile/Body/Regular/B1-B4 (18px, 16px, 14px, 12px) - BetOnline toolkit
  - Mobile/Body/Italic Regular/B1-B3 (18px, 16px, 14px) - BetOnline toolkit
- Button styles:
  - Material UI/button/large (15px, SemiBold, Open Sans)
  - Material UI/button/medium (14px, SemiBold, Open Sans)
  - Material UI/button/small (13px, SemiBold, Open Sans)
- Alert styles:
  - Material UI/alert/title (16px, SemiBold, Open Sans) - BetOnline toolkit
  - Material UI/alert/description (14px, SemiBold, Open Sans) - BetOnline toolkit
- Table styles:
  - Material UI/table/header (14px, SemiBold, Open Sans)
- Date Picker:
  - Material UI/datePicker/currentMonth (16px, SemiBold, Open Sans) - BetOnline toolkit

**SPACING (From Figma):**
- Base unit: 4px (token: "0,5" = 4)
- Spacing scale: 2px, 4px, 7px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px, 64px, 72px, 80px, 96px (includes BetOnline brand book and toolkit tokens)
- Grid system: 12 columns, 16px gutter, 24px margin
- BetOnline brand book spacing tokens: 2px, 4px, 7px, 12px, 16px, 32px, 56px, 96px
- BetOnline toolkit spacing tokens: 1 (8px), 2 (16px), 3 (24px), 4 (32px), 5 (40px), 6 (48px), 7 (56px), 8 (64px), 9 (72px), 10 (80px), 12 (96px)

**BORDER RADIUS (From Figma):**
- borderRadius-1: 4px
- borderRadius-2: 8px (BetOnline brand book)
- Small: 4px
- Medium: 8px
- Large: 12px
- Extra Large: 16px
- Full: 9999px

**SHADOWS/ELEVATION (From Figma):**
- Elevation levels: elevation/1 through elevation/24
- Material UI shadows: --joy-shadow-xs, --joy-shadow-sm, --joy-shadow-md, --joy-shadow-lg, --joy-shadow-xl

**COMPONENTS (From Figma):**
${componentList}

**DESIGN PATTERNS (From Figma):**
${patternList}

**BRANDS (From Figma):**
${brandList}

**AREAS/PRODUCTS:**
- Sports: Sports betting area, uses Sports brand
- Casino: Casino gaming area, uses Casino brand
- Loyalty: Loyalty and rewards area, uses Loyalty brand (includes VIP tiers)
- Authentication: Authentication and account management, uses Authentication brand
- Poker: Poker gaming area, uses Poker brand

**VIP TIERS (Loyalty brand):**
- black vip, bronze vip, diamond vip, elite vip, gold vip, platinum vip, silver vip

**STAKEHOLDERS:**
${stakeholdersList}

**PROCESSES:**
${processesList}

**BRAND GUIDELINES & COMMUNICATION:**
- Tone of Voice Principles: ${brandGuidelines.toneOfVoice.principles.join(', ')}
- Communication Approach: ${brandGuidelines.communicationWithCustomers.approach}
- Communication Principles: ${brandGuidelines.communicationWithCustomers.principles.join('; ')}
- Communication Channels: ${brandGuidelines.communicationWithCustomers.channels.join(', ')}
- When to Escalate: ${brandGuidelines.communicationWithCustomers.whenToEscalate.join('; ')}
- Brand Values: ${brandGuidelines.brandValues.join(', ')}
- Design Principles: ${brandGuidelines.designPrinciples.join(', ')}
- Tone of Voice - Do: ${brandGuidelines.toneOfVoice.do.join('; ')}
- Tone of Voice - Don't: ${brandGuidelines.toneOfVoice.dont.join('; ')}
- Tone of Voice Examples: ${brandGuidelines.toneOfVoice.examples.join(' | ')}

**LOGOS (From Figma):**
${logos.length > 0
    ? logos.map(logo => {
        let desc = `  - ${logo.brand}:`
        if (logo.minimumSize) {
          if (logo.minimumSize.wordmark) desc += `\n    Minimum wordmark size: ${logo.minimumSize.wordmark}`
          if (logo.minimumSize.lettermark) desc += `\n    Minimum lettermark size: ${logo.minimumSize.lettermark}`
        }
        if (logo.clearSpace) desc += `\n    Clear space: ${logo.clearSpace}`
        if (logo.usage?.length) desc += `\n    Usage: ${logo.usage.join(', ')}`
        if (logo.variants?.length) {
          desc += `\n    Available variants:`
          logo.variants.forEach(variant => {
            let variantDesc = `      - ${variant.type}`
            if (variant.color) variantDesc += ` (${variant.color})`
            if (variant.mode) variantDesc += ` - ${variant.mode}`
            if (variant.size) variantDesc += ` - ${variant.size}`
            if (variant.style) variantDesc += ` - ${variant.style}`
            if (variant.description) variantDesc += `: ${variant.description}`
            desc += `\n${variantDesc}`
          })
        }
        return desc
      }).join('\n\n')
    : '  (No logos added yet)'}

${additionalNotes && additionalNotes.length > 0 ? `**ADDITIONAL NOTES:**\n${additionalNotes.map(note => `  - ${note}`).join('\n')}` : ''}
`
}

/**
 * Add a new Figma file to the knowledge base
 */
export function addFigmaFile(file: FigmaFile): void {
  knowledgeBase.figmaFiles.push(file)
}

/**
 * Add a stakeholder to the knowledge base
 */
export function addStakeholder(stakeholder: Stakeholder): void {
  knowledgeBase.stakeholders.push(stakeholder)
}

/**
 * Add a process to the knowledge base
 */
export function addProcess(process: Process): void {
  knowledgeBase.processes.push(process)
}

/**
 * Add additional notes
 */
export function addNote(note: string): void {
  if (!knowledgeBase.additionalNotes) {
    knowledgeBase.additionalNotes = []
  }
  knowledgeBase.additionalNotes.push(note)
}
