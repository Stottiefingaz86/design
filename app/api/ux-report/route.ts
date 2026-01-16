import { NextResponse } from 'next/server'
import { addUXReport, UXReport } from '@/lib/agent/knowledgeBase'
import { scrapeJurniiReport, parseReportWithAI } from '@/lib/utils/jurniiScraper'

/**
 * API endpoint to add UX reports to the knowledge base
 * Can accept manual reports or attempt to scrape from URLs
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, reportData, manual } = body

    // If manual report data is provided, add it directly
    if (manual && reportData) {
      const report: UXReport = {
        id: reportData.id || `ux-${Date.now()}`,
        source: reportData.source || 'Manual',
        sourceUrl: reportData.sourceUrl || url,
        title: reportData.title || 'UX Report',
        date: reportData.date || new Date().toISOString().split('T')[0],
        findings: reportData.findings || [],
        summary: reportData.summary,
        priority: reportData.priority,
      }

      addUXReport(report)

      return NextResponse.json({
        success: true,
        message: 'UX report added to knowledge base',
        reportId: report.id,
      })
    }

    // If URL is provided, attempt to extract data
    if (url) {
      // Check if Jurnii credentials are available
      const jurniiEmail = process.env.JURNII_EMAIL
      const jurniiPassword = process.env.JURNII_PASSWORD
      const openaiApiKey = process.env.OPENAI_API_KEY

      // If it's a Jurnii URL and credentials are available, try to scrape
      if (url.includes('jurnii.io') && jurniiEmail && jurniiPassword) {
        try {
          console.log('Attempting to scrape Jurnii report with authentication...')
          
          // Attempt to scrape the report
          const scrapedData = await scrapeJurniiReport(url, {
            email: jurniiEmail,
            password: jurniiPassword,
          })

          // Always try AI parsing if OpenAI key is available (more reliable)
          if (openaiApiKey) {
            try {
              // Fetch the HTML and parse with AI
              const response = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; DesignRequestApp/1.0)',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              
              if (response.ok) {
                const html = await response.text()
                const aiParsed = await parseReportWithAI(html, openaiApiKey)
            
                if (aiParsed && aiParsed.findings && aiParsed.findings.length > 0) {
                  const report: UXReport = {
                    id: `jurnii-${Date.now()}`,
                    source: 'Jurnii',
                    sourceUrl: url,
                    title: aiParsed.title || 'UX Report from Jurnii',
                    date: aiParsed.date || new Date().toISOString().split('T')[0],
                    findings: aiParsed.findings.map(f => ({
                      issue: f.issue,
                      severity: f.severity,
                      description: f.description,
                      recommendation: f.recommendation,
                      affectedArea: f.affectedArea,
                    })),
                    summary: aiParsed.summary,
                    priority: 'high', // Default, can be adjusted
                  }

                  addUXReport(report)

                  return NextResponse.json({
                    success: true,
                    message: 'UX report extracted and added to knowledge base using AI parsing',
                    reportId: report.id,
                    findingsCount: report.findings.length,
                  })
                }
              }
            } catch (aiError: any) {
              console.error('AI parsing failed:', aiError)
              // Fall through to try scraped data
            }
          }

          // Fallback: Use scraped data if available
          if (scrapedData && scrapedData.findings && scrapedData.findings.length > 0) {
            const report: UXReport = {
              id: `jurnii-${Date.now()}`,
              source: 'Jurnii',
              sourceUrl: url,
              title: scrapedData.title || 'UX Report from Jurnii',
              date: scrapedData.date || new Date().toISOString().split('T')[0],
              findings: scrapedData.findings,
              summary: scrapedData.summary,
              priority: 'high',
            }

            addUXReport(report)

            return NextResponse.json({
              success: true,
              message: 'UX report extracted and added to knowledge base',
              reportId: report.id,
              findingsCount: report.findings.length,
            })
          }
        } catch (error: any) {
          console.error('Jurnii scraping failed:', error)
          // Fall through to manual instructions
        }
      }

      // If scraping failed or credentials not available, return instructions
      return NextResponse.json({
        success: false,
        message: url.includes('jurnii.io') 
          ? 'Jurnii extraction requires credentials. Set JURNII_EMAIL and JURNII_PASSWORD environment variables, or use manual input.'
          : 'Automatic extraction not available for this URL. Please use manual input.',
        instructions: {
          step1: 'Visit the report URL',
          step2: 'Copy the report findings',
          step3: 'Use the manual input format below',
          manualFormat: {
            id: 'jurnii-001',
            source: 'Jurnii',
            sourceUrl: url,
            title: 'UX Report - Site Improvements',
            date: '2024-01-15',
            findings: [
              {
                issue: 'Issue title',
                severity: 'high',
                description: 'Detailed description',
                recommendation: 'Recommended solution',
                affectedArea: 'Navigation',
              },
            ],
            summary: 'Overall summary',
            priority: 'high',
          },
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Either url or manual reportData must be provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('UX Report API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process UX report' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve all UX reports
 */
export async function GET() {
  try {
    const { knowledgeBase } = await import('@/lib/agent/knowledgeBase')
    return NextResponse.json({
      success: true,
      reports: knowledgeBase.uxReports,
      count: knowledgeBase.uxReports.length,
    })
  } catch (error) {
    console.error('UX Report GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve UX reports' },
      { status: 500 }
    )
  }
}
