import { NextResponse } from 'next/server'
import { chatbotFAQ } from '@/config/chatbot'

/**
 * Chat API Route
 * Integrates with OpenRouter / LLM to provide real AI responses.
 * 
 * Uses the pre-defined FAQ as system context to keep the AI focused 
 * on Tatva Dynamics specific information.
 */

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey || apiKey === 'your_openrouter_key_here') {
      return NextResponse.json(
        { error: 'API Key not configured. Please add OPENROUTER_API_KEY to .env.local' },
        { status: 500 }
      )
    }

    // Construct the System Prompt using our local Knowledge Base
    const kbText = chatbotFAQ.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
    
    const systemPrompt = `
      You are the official Tatva Dynamics AI Assistant. You are professional, precise, and helpful.
      Tatva Dynamics is a premier precision manufacturing firm (Tandon Group company).
      
      CORE KNOWLEDGE:
      ${kbText}
      
      RULES:
      1. Always be professional and technically accurate.
      2. If asked about contact info: Phone is +91 9545 450 786, Email info@tatvadynamics.com.
      3. If asked about a quote, suggest clicking the "Request A Quote" button.
      4. Keep responses concise (under 3-4 sentences).
      5. If you don't know the answer based on the knowledge provided, politely ask them to contact our engineering team directly.
      6. Do NOT mention you are an AI model unless specifically asked. You represent Tatva Dynamics.
    `

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tatvadynamics-webapp.vercel.app'

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "Tatva Dynamics AI",
      },
      body: JSON.stringify({
        "model": "openai/gpt-oss-120b:free",
        "messages": [
          { "role": "system", "content": systemPrompt },
          ...messages
        ],
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('OpenRouter Error:', data.error)
      return NextResponse.json(
        { error: `AI Provider Error: ${data.error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const botReply = data.choices[0].message.content

    return NextResponse.json({ reply: botReply })

  } catch (error: any) {
    console.error('Chatbot API Error:', error)
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    )
  }
}
