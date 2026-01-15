import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { requestArea, userRequest, deadline, assignedDesigner } = body

  try {
    // TODO: Integrate with Mattermost and Craft.io APIs
    // For now, this is a mock implementation
    
    // Mock Mattermost notification
    const mattermostPayload = {
      text: `🎨 New Design Request`,
      attachments: [
        {
          color: '#7B68EE',
          fields: [
            { title: 'Area', value: requestArea, short: true },
            { title: 'Deadline', value: deadline, short: true },
            { title: 'Assigned To', value: assignedDesigner || 'CH (Head of Design)', short: true },
            { title: 'What', value: userRequest.what, short: false },
            { title: 'Why', value: userRequest.why, short: false },
            ...(userRequest.context ? [{ title: 'Context', value: userRequest.context, short: false }] : []),
            ...(userRequest.goals ? [{ title: 'Goals', value: userRequest.goals, short: false }] : []),
            ...(userRequest.useCases ? [{ title: 'Use Cases', value: userRequest.useCases, short: false }] : []),
          ],
        },
      ],
    }

    // Mock Craft.io integration
    const craftPayload = {
      title: `Design Request: ${requestArea}`,
      description: `
**What:** ${userRequest.what}

**Why:** ${userRequest.why}

${userRequest.context ? `**Context:** ${userRequest.context}\n` : ''}
${userRequest.goals ? `**Goals:** ${userRequest.goals}\n` : ''}
${userRequest.useCases ? `**Use Cases:** ${userRequest.useCases}\n` : ''}

**Deadline:** ${deadline}
**Assigned Designer:** ${assignedDesigner || 'CH (Head of Design)'}
      `.trim(),
      priority: deadline === 'ASAP' ? 'high' : 'normal',
      assignee: assignedDesigner || 'CH',
    }

    // Simulate API calls (replace with actual API calls)
    // await fetch(MATTERMOST_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(mattermostPayload) })
    // await fetch(CRAFT_IO_API_URL, { method: 'POST', body: JSON.stringify(craftPayload) })

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      mattermost: { sent: true },
      craft: { sent: true },
    })
  } catch (error) {
    console.error('Delivery failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}
