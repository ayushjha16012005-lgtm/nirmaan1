/* NIRMAAN Escrow & Payment Gateway Service (Razorpay Test Mode + Test Ledger) */
import { supabase, isLive } from "./supabase.js";
import { api } from "./api.js";

let razorpayLoaded = false;

function loadRazorpayCheckout() {
  if (razorpayLoaded || window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      razorpayLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      console.warn("Could not load external Razorpay Checkout script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export const escrow = {
  // 1. Lock Escrow (Razorpay Test Order or Test Ledger in Database)
  async lockEscrow(jobId, amount, customerDetails = {}) {
    if (isLive()) {
      // 1. Try invoking create-order Edge Function
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("create-order", {
          body: { jobId, amount }
        });

        if (!edgeErr && edgeData?.orderId && edgeData?.keyId) {
          // Launch Razorpay Checkout in Test Mode
          const loaded = await loadRazorpayCheckout();
          if (loaded && window.Razorpay) {
            return new Promise((resolve) => {
              const options = {
                key: edgeData.keyId,
                amount: Math.round(amount * 100),
                currency: "INR",
                name: "NIRMAAN Escrow",
                description: `Payment held securely for Job #${jobId.slice(0, 8)}`,
                order_id: edgeData.orderId,
                prefill: {
                  name: customerDetails.name || "Customer",
                  contact: customerDetails.phone || ""
                },
                theme: { color: "#E8621A" },
                handler: async function (response) {
                  // Verify payment on server or mark authorized
                  await supabase
                    .from("payments")
                    .update({
                      provider_payment_id: response.razorpay_payment_id,
                      status: "authorized"
                    })
                    .eq("provider_order_id", response.razorpay_order_id);

                  await supabase
                    .from("jobs")
                    .update({ escrow_status: "locked" })
                    .eq("id", jobId);

                  resolve({
                    data: {
                      jobId,
                      amount,
                      mode: "test",
                      status: "locked",
                      paymentId: response.razorpay_payment_id,
                      orderId: response.razorpay_order_id
                    },
                    error: null
                  });
                },
                modal: {
                  ondismiss: function () {
                    resolve({ data: null, error: "Payment window closed" });
                  }
                }
              };

              const rzp = new window.Razorpay(options);
              rzp.open();
            });
          }
        }
      } catch (err) {
        console.warn("Edge function create-order not available; utilizing database test ledger:", err);
      }

      // 2. Database Test Ledger Fallback (when Razorpay secrets are not configured)
      const orderId = `order_test_${Date.now()}`;
      const { data: paymentRow, error: pErr } = await supabase
        .from("payments")
        .insert([{
          job_id: jobId,
          provider: "razorpay_test_ledger",
          provider_order_id: orderId,
          amount: amount,
          status: "authorized",
          mode: "test"
        }])
        .select()
        .single();

      await supabase
        .from("jobs")
        .update({ escrow_status: "locked" })
        .eq("id", jobId);

      return {
        data: {
          jobId,
          amount,
          status: "locked",
          mode: "test",
          orderId: orderId,
          ledgerId: paymentRow?.id,
          notice: "Test Ledger: Payment held until work approval"
        },
        error: pErr ? pErr.message : null
      };
    }

    // Offline Demo Mode
    await api.advanceJob(jobId, "accepted");
    return {
      data: {
        jobId,
        amount,
        status: "locked",
        mode: "test",
        vaultId: "TEST-VAULT-" + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toISOString()
      },
      error: null
    };
  },

  // 2. Release Escrow & Settle Payout
  async releaseEscrow(jobId) {
    if (isLive()) {
      // 1. Attempt capture-payment Edge Function
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("capture-payment", {
          body: { jobId }
        });

        if (!edgeErr && edgeData?.success) {
          await api.advanceJob(jobId, "approved");
          return { data: edgeData, error: null };
        }
      } catch (err) {
        console.warn("capture-payment function not reached, settling test ledger in database:", err);
      }

      // 2. Database Settlement
      await supabase
        .from("payments")
        .update({ status: "captured", updated_at: new Date().toISOString() })
        .eq("job_id", jobId);

      const res = await api.advanceJob(jobId, "approved");
      return {
        data: {
          jobId,
          status: "released",
          mode: "test",
          settled_at: new Date().toISOString(),
          receipt_id: `RCPT-${jobId.slice(0, 8).toUpperCase()}`
        },
        error: res.error
      };
    }

    // Offline Demo Mode
    const res = await api.advanceJob(jobId, "approved");
    return {
      data: {
        jobId,
        status: "released",
        mode: "test",
        settled_at: new Date().toISOString(),
        receipt_id: `RCPT-DEMO-${Date.now().toString().slice(-6)}`
      },
      error: res.error
    };
  }
};
