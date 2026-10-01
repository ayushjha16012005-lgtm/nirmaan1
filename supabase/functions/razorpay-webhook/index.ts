// Supabase Edge Function: razorpay-webhook (Deno / TypeScript)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

    if (webhookSecret && signature) {
      // Verify HMAC SHA-256 signature
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== signature) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (eventType === "payment.authorized" && orderId) {
      await supabase
        .from("payments")
        .update({
          provider_payment_id: paymentEntity.id,
          status: "authorized",
          updated_at: new Date().toISOString()
        })
        .eq("provider_order_id", orderId);

      const { data: payment } = await supabase
        .from("payments")
        .select("job_id")
        .eq("provider_order_id", orderId)
        .single();

      if (payment?.job_id) {
        await supabase
          .from("jobs")
          .update({ escrow_status: "locked" })
          .eq("id", payment.job_id);
      }
    } else if (eventType === "payment.captured" && orderId) {
      await supabase
        .from("payments")
        .update({
          provider_payment_id: paymentEntity.id,
          status: "captured",
          updated_at: new Date().toISOString()
        })
        .eq("provider_order_id", orderId);
    }

    return new Response(JSON.stringify({ status: "success", received: eventType }), {
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
