/* NIRMAAN Photo Proof Capture & Verification Component */
import { supabase, isLive } from "../services/supabase.js";
import { store } from "../core/store.js";
import { showToast, escape } from "../core/ui.js";

async function computeSha256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function renderProofSection(containerEl, job, options = {}) {
  const user = store.get("user");
  const isCustomer = user?.id === job.customerId || store.get("role") === "user";
  const isWorker = user?.id === job.workerId || store.get("role") === "kaarigar";

  let proofs = [];

  if (isLive()) {
    try {
      const { data, error } = await supabase
        .from("job_proofs")
        .select("*")
        .eq("job_id", job.id)
        .order("taken_at", { ascending: false });

      if (!error && data) {
        // Resolve signed URLs (valid 60 seconds)
        proofs = await Promise.all(
          data.map(async p => {
            const { data: signData } = await supabase.storage
              .from("proofs")
              .createSignedUrl(p.storage_path, 60);

            return {
              ...p,
              signedUrl: signData?.signedUrl || null
            };
          })
        );
      }
    } catch (e) {
      console.warn("Error fetching proofs:", e);
    }
  }

  containerEl.innerHTML = `
    <div class="card" style="padding: 20px; margin-bottom: 16px; border: 1.5px solid var(--border-light); background: var(--bg-card);">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.3rem;">📸</span>
          <strong style="font-size: 1rem; color: var(--text-main);">Site Photo Proofs & Quality Checks</strong>
        </div>
        <span class="badge badge-saffron">${proofs.length} Photos</span>
      </div>

      <!-- Proof Photos Gallery -->
      ${proofs.length === 0 ? `
        <div style="text-align: center; padding: 24px 14px; background: var(--bg-secondary); border-radius: var(--radius-md); color: var(--text-muted); font-size: 0.82rem; margin-bottom: 14px;">
          <p style="font-size: 1.4rem; margin-bottom: 4px;">📷</p>
          <p>No site inspection photos uploaded yet.</p>
          <p style="font-size: 0.74rem;">Workers upload arrival and work completion photos to verify milestones.</p>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px;">
          ${proofs.map(p => `
            <div style="border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow: hidden; background: var(--bg-secondary);">
              <img 
                src="${p.signedUrl || "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=400&auto=format&fit=crop&q=80"}" 
                alt="Site proof" 
                style="width: 100%; height: 110px; object-fit: cover; display: block;" 
              />
              <div style="padding: 8px; font-size: 0.72rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-weight: 800; text-transform: capitalize; color: var(--text-main);">${p.kind}</span>
                  <span class="badge ${p.status === "approved" ? "badge-verified" : p.status === "retake" ? "badge-pending" : "badge-saffron"}" style="font-size: 0.65rem;">
                    ${p.status}
                  </span>
                </div>
                <div style="color: var(--text-light); font-size: 0.68rem;">${new Date(p.taken_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>

                ${isCustomer && p.status === "pending" ? `
                  <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <button class="btn btn-success btn-sm btn-approve-proof" data-id="${p.id}" style="padding: 4px 6px; font-size: 0.65rem; flex: 1;">✓ Accept</button>
                    <button class="btn btn-secondary btn-sm btn-retake-proof" data-id="${p.id}" style="padding: 4px 6px; font-size: 0.65rem; flex: 1;">🔄 Retake</button>
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      `}

      <!-- Upload Trigger (Worker / Customer) -->
      <div>
        <input type="file" id="proof-photo-file-input" accept="image/*" capture="environment" style="display: none;" />
        <button id="btn-trigger-proof-upload" class="btn btn-secondary btn-full" style="font-weight: 700; font-size: 0.88rem;">
          📷 Upload Site Photo Proof (साइट फ़ोटो लें)
        </button>
      </div>

    </div>
  `;

  // Bind Upload
  const fileInput = containerEl.querySelector("#proof-photo-file-input");
  const triggerBtn = containerEl.querySelector("#btn-trigger-proof-upload");

  if (triggerBtn && fileInput) {
    triggerBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      triggerBtn.disabled = true;
      triggerBtn.textContent = "Uploading & hashing photo...";

      try {
        const hash = await computeSha256(file);
        let lat = null;
        let lng = null;

        if (navigator.geolocation) {
          try {
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (geoErr) {
            console.warn("Could not capture GPS with photo:", geoErr);
          }
        }

        if (isLive()) {
          const path = `${job.id}/${crypto.randomUUID()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("proofs")
            .upload(path, file);

          if (upErr) throw upErr;

          const kind = (job.status === "on_the_way" || job.status === "arrived") ? "arrival" : 
                       (job.status === "completed" || job.status === "in_progress") ? "completion" : "progress";

          const { error: insErr } = await supabase
            .from("job_proofs")
            .insert([{
              job_id: job.id,
              actor_id: user?.id,
              kind,
              storage_path: path,
              taken_at: new Date().toISOString(),
              lat,
              lng,
              sha256: hash,
              status: "pending"
            }]);

          if (insErr) throw insErr;
        }

        showToast("Site photo uploaded successfully! 📸");
        await renderProofSection(containerEl, job, options);
      } catch (err) {
        console.error("Proof upload error:", err);
        showToast("Upload failed: " + err.message);
        triggerBtn.disabled = false;
        triggerBtn.textContent = "📷 Upload Site Photo Proof";
      }
    };
  }

  // Bind Approval actions
  containerEl.querySelectorAll(".btn-approve-proof").forEach(btn => {
    btn.onclick = async () => {
      const proofId = btn.dataset.id;
      if (isLive()) {
        await supabase.from("job_proofs").update({ status: "approved" }).eq("id", proofId);
      }
      showToast("Proof approved! ✓");
      await renderProofSection(containerEl, job, options);
    };
  });

  containerEl.querySelectorAll(".btn-retake-proof").forEach(btn => {
    btn.onclick = async () => {
      const proofId = btn.dataset.id;
      if (isLive()) {
        await supabase.from("job_proofs").update({ status: "retake" }).eq("id", proofId);
      }
      showToast("Retake requested from worker 🔄");
      await renderProofSection(containerEl, job, options);
    };
  });
}
