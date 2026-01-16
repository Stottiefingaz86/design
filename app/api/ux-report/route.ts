import { NextResponse } from 'next/server'
import { addUXReport, UXReport } from '@/lib/agent/knowledgeBase'

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
      // For now, return instructions for manual extraction
      // In the future, we could implement web scraping here
      return NextResponse.json({
        success: false,
        message: 'Automatic extraction from Jurnii requires authentication. Please use manual input.',
        instructions: {
          step1: 'Visit the Jurnii report URL',
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
                severity: 'high', // critical, high, medium, low
                description: 'Detailed description',
                recommendation: 'Recommended solution',
                affectedArea: 'Navigation', // Optional: Casino, Sports, etc.
              },
            ],
            summary: 'Overall summary',
            priority: 'high', // high, medium, low
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
