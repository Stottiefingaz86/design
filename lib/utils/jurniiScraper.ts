/**
 * Jurnii UX Report Scraper
 * 
 * Securely authenticates and extracts UX report data from Jurnii
 * Uses environment variables for credentials
 */

interface JurniiCredentials {
  email: string
  password: string
}

interface JurniiReportData {
  title?: string
  findings: Array<{
    issue: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    description: string
    recommendation?: string
    affectedArea?: string
  }>
  summary?: string
  date?: string
}

/**
 * Authenticate with Jurnii and extract report data
 * 
 * Note: This requires the site to be accessible and may need to be adjusted
 * based on Jurnii's actual authentication flow
 */
export async function scrapeJurniiReport(
  reportUrl: string,
  credentials?: JurniiCredentials
): Promise<JurniiReportData | null> {
  try {
    let cookies = ''
    
    // If credentials are provided, authenticate first
    if (credentials) {
      console.log('Authenticating with Jurnii...')
      
      // Step 1: Get the login page to get any CSRF tokens or session cookies
      const loginPageResponse = await fetch('https://app.jurnii.io/login', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DesignRequestApp/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      
      // Extract cookies from login page response
      const setCookieHeaders = loginPageResponse.headers.getSetCookie?.() || []
      cookies = setCookieHeaders.join('; ')
      
      // Step 2: POST to login endpoint
      const loginResponse = await fetch('https://app.jurnii.io/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; DesignRequestApp/1.0)',
          'Accept': 'application/json',
          ...(cookies ? { 'Cookie': cookies } : {}),
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe: true,
        }),
        redirect: 'follow',
      })
      
      // Extract cookies from login response
      const loginCookies = loginResponse.headers.getSetCookie?.() || []
      if (loginCookies.length > 0) {
        cookies = loginCookies.join('; ')
      }
      
      // Check if login was successful
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text()
        console.error('Jurnii login failed:', loginResponse.status, errorText)
        throw new Error(`Authentication failed: ${loginResponse.status}`)
      }
      
      console.log('Jurnii authentication successful')
    }

    // Step 3: Fetch the report page with authenticated session
    const response = await fetch(reportUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DesignRequestApp/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(cookies ? { 'Cookie': cookies } : {}),
      },
    })

    if (!response.ok) {
      // If we get 401/403, authentication is required
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication required or session expired. Please check Jurnii credentials.')
      }
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    // Return raw HTML for AI parsing (more reliable than manual parsing)
    return {
      title: 'UX Report from Jurnii',
      findings: [],
      summary: 'Report extracted from Jurnii',
      date: new Date().toISOString().split('T')[0],
      _rawHtml: html, // Include raw HTML for AI parsing
    } as any
  } catch (error: any) {
    console.error('Jurnii scraping error:', error)
    return null
  }
}

/**
 * Parse Jurnii HTML to extract structured report data
 */
function parseJurniiHTML(html: string, url: string): JurniiReportData {
  // This is a placeholder - actual parsing will depend on Jurnii's HTML structure
  // You may need to use a library like cheerio or jsdom for better HTML parsing
  
  const findings: JurniiReportData['findings'] = []
  
  // Extract title (adjust selector based on actual HTML)
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                     html.match(/<title[^>]*>(.*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : 'UX Report from Jurnii'
  
  // Extract findings (this will need to be customized)
  // Look for patterns in the HTML that indicate findings/issues
  
  // For now, return a basic structure
  // In production, you'd parse the actual HTML structure
  return {
    title,
    findings,
    summary: 'Extracted from Jurnii report',
    date: new Date().toISOString().split('T')[0],
  }
}

/**
 * Alternative: Use OpenAI to parse report data from HTML/text
 */
export async function parseReportWithAI(
  htmlOrText: string,
  openaiApiKey?: string
): Promise<JurniiReportData | null> {
  if (!openaiApiKey) {
    console.log('OpenAI API key not provided, cannot parse with AI')
    return null
  }

  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Limit HTML to avoid token limits (keep first 8000 chars)
    const limitedContent = htmlOrText.substring(0, 8000)
    
    const prompt = `You are analyzing a UX report from Jurnii. Extract structured data from the following content:

${limitedContent}

Extract:
1. Report title
2. Key findings/issues with:
   - Issue title
   - Severity (critical, high, medium, low)
   - Description
   - Recommendation (if provided)
   - Affected area (if mentioned: Casino, Sports, Navigation, etc.)
3. Overall summary
4. Date (if available)

Return the data in this JSON format:
{
  "title": "Report title",
  "findings": [
    {
      "issue": "Issue title",
      "severity": "high",
      "description": "Detailed description",
      "recommendation": "Recommended solution",
      "affectedArea": "Navigation"
    }
  ],
  "summary": "Overall summary",
  "date": "2024-12-13"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a UX analyst extracting structured data from UX reports. Always return valid JSON.',
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
    
    return parsed as JurniiReportData
  } catch (error) {
    console.error('AI parsing error:', error)
    return null
  }
}
