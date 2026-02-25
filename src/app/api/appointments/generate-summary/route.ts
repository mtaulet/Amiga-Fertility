import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { communicationsText, transcriptText } = await request.json()

    const contextParts: string[] = []
    if (communicationsText?.trim()) {
      contextParts.push(`Communications notes:\n${communicationsText}`)
    }
    if (transcriptText?.trim()) {
      contextParts.push(`Appointment transcript:\n${transcriptText}`)
    }

    if (contextParts.length === 0) {
      return NextResponse.json(
        { error: 'No content provided to summarize' },
        { status: 400 }
      )
    }

    const prompt = `You are a clinical assistant helping summarize fertility appointment information. Based on the following information, write a concise one-paragraph clinical-style summary suitable for a patient portal. Be professional, accurate, and empathetic. Do not include any personally identifying information beyond what is provided.

${contextParts.join('\n\n')}

Write a one-paragraph summary:`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ summary })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
