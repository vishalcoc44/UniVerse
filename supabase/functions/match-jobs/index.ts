import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile: embedding, skills, preferred roles, preferred locations
    const { data: profile } = await supabaseAdmin
      .from('Profile')
      .select('embedding, skills, preferredRoles, preferredLocations')
      .eq('userId', user.id)
      .single()

    const openAIKey = Deno.env.get('OPENAI_API_KEY')

    let matchedJobs: Array<{ id: string; matchScore: number }> = []

    if (profile?.embedding && openAIKey) {
      // Use pgvector cosine similarity via RPC
      const { data: vectorJobs } = await supabaseAdmin.rpc('match_jobs_by_embedding', {
        query_embedding: profile.embedding,
        match_threshold: 0.5,
        match_count: 20,
      })
      matchedJobs = (vectorJobs ?? []).map((j: { id: string; similarity: number }) => ({
        id: j.id,
        matchScore: Math.round(j.similarity * 100),
      }))
    } else {
      // Fallback: skill + role keyword matching
      const userSkills: string[] = profile?.skills ?? []
      const preferredRoles: string[] = profile?.preferredRoles ?? []
      const preferredLocations: string[] = profile?.preferredLocations ?? []

      const { data: allJobs } = await supabaseAdmin
        .from('Job')
        .select('id, title, skills, location, jobType')
        .eq('status', 'OPEN')
        .limit(50)

      matchedJobs = (allJobs ?? []).map((job: Record<string, unknown>) => {
        let score = 0
        const jobSkills: string[] = (job.skills as string[]) ?? []
        const title = ((job.title as string) ?? '').toLowerCase()
        const location = ((job.location as string) ?? '').toLowerCase()

        // Skill overlap
        const skillOverlap = jobSkills.filter(s =>
          userSkills.some(us => us.toLowerCase() === s.toLowerCase())
        ).length
        score += Math.min(60, skillOverlap * 12)

        // Role preference
        if (preferredRoles.some(r => title.includes(r.toLowerCase()))) score += 25
        // Location preference
        if (preferredLocations.some(l => location.includes(l.toLowerCase()) || l.toLowerCase() === 'remote' && location.includes('remote'))) score += 15

        return { id: job.id as string, matchScore: Math.min(100, score) }
      }).filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 15)
    }

    return new Response(JSON.stringify({ jobs: matchedJobs }), {
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
