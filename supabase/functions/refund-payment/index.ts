// Supabase Edge Function: refund-payment (Deno / TypeScript)
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
    const { jobId, reason } = await req.json();

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("job_id", jobId)
      .in("status", ["authorized", "captured"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment && keyId && keySecret && payment.provider_payment_id) {
      const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
      await fetch(`https://api.razorpay.com/v1/payments/${payment.provider_payment_id}/refund`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notes: { reason: reason || "Job cancelled / escrow refund" }
        })
      });
    }

    if (payment) {
      await supabase
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", payment.id);
    }

    await supabase
      .from("jobs")
      .update({ escrow_status: "refunded", status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    return new Response(JSON.stringify({
      success: true,
      status: "refunded",
      jobId
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
