import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean)

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '')
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

interface EvaluateRequest {
  question: string
  answer: string
  category: string
  sessionId?: string
  questionIndex?: number
}

interface Evaluation {
  clarity: number          // 1-10
  starCompliance: number   // 1-10 (Situation/Task/Action/Result structure)
  confidence: number       // 1-10
  strengths: string[]
  improvements: string[]
  summary: string
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { question, answer, category, sessionId, questionIndex }: EvaluateRequest = await req.json()

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'question and answer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (question.length > 5000 || answer.length > 10000) {
      return new Response(JSON.stringify({ error: 'Input too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY')

    let evaluation: Evaluation

    if (openAIKey) {
      const systemPrompt = `You are an expert career coach evaluating a ${category || 'general'} mock interview answer.
Score on three independent dimensions, each 1-10 (10 = excellent):
- clarity: how well-organized and easy to follow the answer is
- starCompliance: how well it follows the STAR structure (Situation, Task, Action, Result) — for non-behavioral questions, score how complete and structured the response is
- confidence: language assertiveness and lack of hedging/filler

Return ONLY a valid JSON object with exactly these fields:
{
  "clarity": number,
  "starCompliance": number,
  "confidence": number,
  "strengths": string[],     // 2-3 bullets of what was done well
  "improvements": string[],  // 2-3 bullets of what could be improved
  "summary": string          // 1-2 sentences of overall assessment
}
Be specific and constructive. No prose outside the JSON.`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAIKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Question: ${question.slice(0, 2000)}\n\nAnswer: ${answer.slice(0, 5000)}` },
          ],
          temperature: 0.3,
          max_tokens: 600,
          response_format: { type: 'json_object' },
        }),
      })

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content ?? ''
      try {
        const parsed = JSON.parse(content)
        // Defensive: clamp scores to 1-10 and ensure all fields exist so the
        // frontend never has to deal with undefined values.
        const clamp = (n: unknown) => {
          const v = typeof n === 'number' ? n : Number(n)
          return Number.isFinite(v) ? Math.max(1, Math.min(10, Math.round(v))) : 5
        }
        evaluation = {
          clarity: clamp(parsed.clarity),
          starCompliance: clamp(parsed.starCompliance),
          confidence: clamp(parsed.confidence),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
          summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI evaluation' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Heuristic fallback when OPENAI_API_KEY is not configured.
      // Vary scores based on the actual content so users don't see identical
      // results for every answer (which is what made it look "mock").
      const words = answer.trim().split(/\s+/).filter(Boolean).length
      const lower = answer.toLowerCase()
      const hasNumbers = /\d/.test(answer)
      const hasHedging = /(maybe|kind of|sort of|i think|i guess|um|uh)\b/.test(lower)
      const starHits = ['situation', 'task', 'action', 'result', 'because', 'so that', 'led to', 'resulted in']
        .filter(k => lower.includes(k)).length

      const clarity = Math.max(2, Math.min(10, Math.round(3 + Math.log2(words + 1) * 0.9)))
      const starCompliance = Math.max(2, Math.min(10, 3 + starHits + (hasNumbers ? 1 : 0)))
      const confidence = Math.max(2, Math.min(10, 7 - (hasHedging ? 3 : 0) + (words > 80 ? 1 : 0)))

      evaluation = {
        clarity,
        starCompliance,
        confidence,
        strengths: [
          words > 80 ? 'Detailed, well-developed response' : 'Concise and to the point',
          hasNumbers ? 'Quantified impact with concrete numbers' : 'Clear narrative structure',
          starHits >= 2 ? 'Includes situational and outcome context' : 'Stays focused on the question',
        ].slice(0, 3),
        improvements: [
          words < 60 ? 'Expand with a specific example or scenario' : null,
          !hasNumbers ? 'Add quantifiable outcomes (percentages, time saved, scale)' : null,
          starHits < 2 ? 'Use STAR structure: Situation → Task → Action → Result' : null,
          hasHedging ? 'Reduce hedging words ("maybe", "I think") for stronger delivery' : null,
        ].filter((s): s is string => Boolean(s)).slice(0, 3),
        summary: words < 30
          ? 'Answer is too short — interviewers expect a richer narrative with context and outcomes.'
          : `Solid foundation${hasNumbers ? ' with concrete metrics' : ''}. ${
              starHits >= 2 ? 'Good use of structure.' : 'Tighten the structure to highlight cause-and-effect.'
            }`,
      }
    }

    if (sessionId && questionIndex !== undefined && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Verify the session belongs to the authenticated user
      const { data: session } = await supabase
        .from('InterviewSession')
        .select('id, feedback, userId')
        .eq('id', sessionId)
        .single()

      if (session && session.userId === user.id) {
        const existingFeedback = (session.feedback as Record<string, unknown>) ?? {}
        await supabase.from('InterviewSession').update({
          feedback: {
            ...existingFeedback,
            [`q${questionIndex}`]: evaluation,
          },
        }).eq('id', sessionId).eq('userId', user.id)
      }
    }

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('evaluate-interview error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
