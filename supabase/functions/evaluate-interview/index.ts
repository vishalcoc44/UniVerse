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
  score: number
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
      const systemPrompt = `You are an expert career coach evaluating mock interview answers.
Evaluate the following ${category || 'general'} interview answer on a scale of 1-100.
Return a JSON object with:
- score: number (0-100)
- strengths: string[] (2-3 bullet points of what was done well)
- improvements: string[] (2-3 bullet points of what could be improved)
- summary: string (1-2 sentence overall assessment)
Be constructive and specific. Only return valid JSON.`

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
          max_tokens: 500,
        }),
      })

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content ?? ''
      try {
        evaluation = JSON.parse(content)
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI evaluation' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      const words = answer.trim().split(/\s+/).length
      const score = Math.min(100, Math.max(20, 40 + words * 0.5))
      evaluation = {
        score: Math.round(score),
        strengths: [
          'Provided a structured response',
          words > 50 ? 'Good level of detail' : 'Concise answer',
        ],
        improvements: [
          words < 50 ? 'Consider expanding with specific examples' : 'Could be more concise',
          'Add quantifiable outcomes where possible',
        ],
        summary: `Your answer covered the key points. ${score >= 70 ? 'Strong response overall.' : 'Consider adding more specifics.'}`,
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
