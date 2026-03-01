import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { question, answer, category, sessionId, questionIndex }: EvaluateRequest = await req.json()

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'question and answer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY')

    let evaluation: Evaluation

    if (openAIKey) {
      const systemPrompt = `You are an expert career coach evaluating mock interview answers.
Evaluate the following ${category} interview answer on a scale of 1-100.
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
            { role: 'user', content: `Question: ${question}\n\nAnswer: ${answer}` },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content ?? ''
      evaluation = JSON.parse(content)
    } else {
      // Fallback mock evaluation
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

    // Optionally update session with feedback for this question
    if (sessionId && questionIndex !== undefined) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data: session } = await supabase
          .from('InterviewSession')
          .select('feedback')
          .eq('id', sessionId)
          .single()

        const existingFeedback = (session?.feedback as Record<string, unknown>) ?? {}
        await supabase.from('InterviewSession').update({
          feedback: {
            ...existingFeedback,
            [`q${questionIndex}`]: evaluation,
          },
        }).eq('id', sessionId)
      }
    }

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
