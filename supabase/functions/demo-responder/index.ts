// Supabase Edge Function: demo-responder (Deno / TypeScript)
// Automatically advances jobs for seed workers on a believable timeline with GPS and proof photos.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const jobId = body.jobId || body.record?.id;
    const stage = body.stage; // Optional explicit target stage

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Verify demo_responder setting
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "demo_responder")
      .maybeSingle();

    if (setting?.value !== "true") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Demo responder is disabled in app_settings" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Fetch Job & Worker Profile
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, worker:worker_id(id, full_name, is_seed)")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Confirm worker is a seed worker
    if (!job.worker?.is_seed) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Worker is a real user, not a seed profile. Demo responder aborted." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Don't advance if cancelled or disputed
    if (["cancelled", "disputed", "approved", "settled"].includes(job.status)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Job already in final state: ${job.status}` 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Advance status
    const targetStatus = stage || getNextStatus(job.status);
    if (!targetStatus) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No progression needed at current status: " + job.status 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Call demo_advance_job RPC
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("demo_advance_job", {
      p_job_id: jobId,
      p_next_status: targetStatus,
      p_actor: "system:demo-responder"
    });

    if (rpcErr) {
      throw rpcErr;
    }

    // 5. If moving to work_submitted or completed, insert sample verified proof photo
    if (targetStatus === "work_submitted" || targetStatus === "completed") {
      await supabase.from("job_proofs").insert([{
        job_id: jobId,
        stage: "completion",
        photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=800&auto=format&fit=crop&q=80",
        photo_hash: "sha256:d3b07384d113edec49eaa6238ad5ff00",
        uploaded_by: job.worker_id,
        geo_lat: job.lat || 28.6280,
        geo_lng: job.lng || 77.3649,
        accuracy_meters: 4.2
      }]);
    }

    return new Response(JSON.stringify({
      success: true,
      jobId,
      prevStatus: job.status,
      newStatus: targetStatus,
      result: rpcRes
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function getNextStatus(current: string): string | null {
  switch (current) {
    case "requested":
    case "offered":
    case "posted":
      return "accepted";
    case "accepted":
      return "on_the_way";
    case "on_the_way":
      return "arrived";
    case "in_progress":
      return "completed";
    default:
      return null;
  }
}
