// Supabase Edge Function: create-order (Deno / TypeScript)
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
    const { jobId, amount } = await req.json();

    if (!jobId || !amount) {
      return new Response(JSON.stringify({ error: "Missing jobId or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({
        error: "Razorpay secrets not configured",
        fallback: "test_ledger"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
    const amountInPaise = Math.round(Number(amount) * 100);

    // Create manual capture order in Razorpay (Escrow Hold)
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${jobId.slice(0, 10)}`,
        payment_capture: 0 // Manual capture held until work verification
      })
    });

    const orderData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      throw new Error(orderData.error?.description || "Razorpay order creation failed");
    }

    // Persist payment record using service role client in edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("payments").insert([{
      job_id: jobId,
      provider: "razorpay",
      provider_order_id: orderData.id,
      amount: Number(amount),
      status: "created",
      mode: "test"
    }]);

    return new Response(JSON.stringify({
      orderId: orderData.id,
      keyId: keyId,
      amount: orderData.amount,
      currency: "INR"
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
