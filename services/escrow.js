/* NIRMAAN Escrow Protection Service */
import { supabase, isLive } from "./supabase.js";
import { api } from "./api.js";

export const escrow = {
  async lockEscrow(jobId, amount) {
    if (isLive()) {
      const { data, error } = await supabase.functions.invoke("create-escrow", {
        body: { jobId, amount }
      });
      return { data, error };
    }

    // Simulated Escrow Lock in demo mode
    await api.advanceJob(jobId, "accepted");
    return {
      data: {
        jobId,
        amount,
        status: "locked",
        vaultId: "VAULT-" + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toISOString()
      },
      error: null
    };
  },

  async releaseEscrow(jobId) {
    if (isLive()) {
      const { data, error } = await supabase.functions.invoke("release-escrow", {
        body: { jobId }
      });
      return { data, error };
    }

    // Simulated Escrow Release
    const res = await api.advanceJob(jobId, "signed_off");
    return {
      data: {
        jobId,
        status: "released",
        settled_at: new Date().toISOString(),
        payoutDirect: true
      },
      error: res.error
    };
  }
};
