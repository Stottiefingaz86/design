/**
 * Google Reviews & Feedback Crawler
 * 
 * Crawls Google for user reviews and feedback about websites
 * Analyzes reviews as UX insights
 */

interface GoogleReview {
  author: string
  rating: number
  date?: string
  text: string
  helpful?: number
}

interface ReviewAnalysis {
  url: string
  title: string
  findings: Array<{
    issue: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    description: string
    recommendation?: string
    affectedArea?: string
    reviewCount?: number // How many reviews mentioned this
    sentiment?: 'positive' | 'negative' | 'mixed'
  }>
  summary: string
  overallRating?: number
  totalReviews?: number
  commonThemes: string[]
  date: string
}

/**
 * Search Google for reviews about a website
 * Uses Google search to find review sites, Trustpilot, etc.
 */
export async function searchGoogleReviews(
  websiteUrl: string,
  openaiApiKey?: string
): Promise<ReviewAnalysis | null> {
  if (!openaiApiKey) {
    console.log('OpenAI API key not provided, cannot analyze reviews')
    return null
  }

  try {
    // Extract domain from URL
    const domain = new URL(websiteUrl).hostname.replace('www.', '')
    const siteName = domain.split('.')[0] // e.g., "betonline" from "betonline.ag"
    
    // Search Google for reviews
    const searchQuery = `${siteName} reviews OR ${domain} reviews OR ${siteName} user feedback`
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    
    console.log(`Searching Google for reviews: ${searchQuery}`)
    
    // Fetch Google search results
    const response = await fetch(googleSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoogleReviewsCrawler/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Google search: ${response.status}`)
    }

    const html = await response.text()
    console.log(`Fetched ${html.length} characters from Google search`)

    // Extract text content
    const textContent = extractTextContent(html)
    const limitedContent = textContent.substring(0, 15000) // More content for reviews

    // Use AI to analyze reviews and extract UX insights
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const prompt = `You are analyzing Google search results for user reviews and feedback about a gambling/casino website.

Website: ${websiteUrl}
Domain: ${domain}

Search Results Content:
${limitedContent}

Analyze the reviews and feedback to identify:
1. **Common Complaints**: What do users complain about most? (Navigation, payments, support, etc.)
2. **Common Praises**: What do users like?
3. **Recurring Issues**: Issues mentioned by multiple reviewers
4. **UX Problems**: User experience issues mentioned in reviews
5. **Overall Sentiment**: Is feedback generally positive, negative, or mixed?

For each finding, provide:
- Issue title (clear and specific)
- Severity: critical (blocks core functionality), high (major UX issue), medium (moderate issue), low (minor)
- Description (what users are saying)
- Recommendation (how to address it)
- Affected Area: Navigation, Casino, Sports, Payment, Support, Authentication, General, etc.
- Review Count: How many reviews mentioned this (estimate)
- Sentiment: positive, negative, or mixed

Also provide:
- Overall rating estimate (if mentioned)
- Total reviews mentioned (if available)
- Common themes (list of 5-10 key themes)

Return the data in this JSON format:
{
  "title": "User Reviews Analysis: [Website Name]",
  "findings": [
    {
      "issue": "Clear issue title",
      "severity": "high",
      "description": "What users are saying about this issue",
      "recommendation": "How to address it",
      "affectedArea": "Payment",
      "reviewCount": 15,
      "sentiment": "negative"
    }
  ],
  "summary": "Overall summary of user feedback",
  "overallRating": 3.5,
  "totalReviews": 150,
  "commonThemes": ["Theme 1", "Theme 2"],
  "date": "2024-12-13"
}

Be thorough and extract at least 8-12 findings from the reviews. Focus on actionable UX insights.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UX analyst specializing in analyzing user reviews and feedback. You extract actionable UX insights from review data. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)
    
    return {
      url: websiteUrl,
      title: parsed.title || `User Reviews Analysis: ${domain}`,
      findings: parsed.findings || [],
      summary: parsed.summary || 'Review analysis completed',
      overallRating: parsed.overallRating,
      totalReviews: parsed.totalReviews,
      commonThemes: parsed.commonThemes || [],
      date: parsed.date || new Date().toISOString().split('T')[0],
    }
  } catch (error: any) {
    console.error('Google reviews analysis error:', error)
    return null
  }
}

/**
 * Extract readable text content from HTML
 */
function extractTextContent(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Extract text from common elements
  const textMatches = text.match(/<[^>]+>([^<]+)<\/[^>]+>/g) || []
  const extractedText = textMatches
    .map(match => {
      const textMatch = match.match(/<[^>]+>([^<]+)<\/[^>]+>/)
      return textMatch ? textMatch[1].trim() : ''
    })
    .filter(t => t.length > 10)
    .join(' ')
  
  // Get meta descriptions, titles, etc.
  const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''
  
  return `${title}\n${metaDescription}\n${extractedText}`.trim()
}
