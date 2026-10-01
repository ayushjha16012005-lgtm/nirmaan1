/* NIRMAAN Admin Dashboard Page — Real Data & Verification Queue */
import { api } from "../services/api.js";
import { store } from "../core/store.js";
import { escape, showToast } from "../core/ui.js";

export default {
  route: "#/admin",
  title: "Admin Command Portal",

  async mount(container, ctx) {
    const user = store.get("user");
    if (!user || !user.isAdmin) {
      container.innerHTML = `
        <div class="container" style="padding: 60px 16px; text-align: center;">
          <h2 style="color: var(--danger); font-weight: 800;">⛔ Access Denied</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 10px 0 20px;">
            This command portal is restricted to authorized platform administrators.
          </p>
          <a href="#/user-home" class="btn btn-secondary btn-sm">Return to Home</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="container" style="padding-top: 10px; padding-bottom: 60px;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Loading admin metrics from database...
        </div>
      </div>
    `;

    const { data: adminData, error: adminErr } = await api.getAdminData();
    if (adminErr) {
      container.innerHTML = `
        <div class="container" style="padding: 40px 16px; text-align: center;">
          <h3 style="color: var(--danger);">Error loading admin data</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin: 8px 0 16px;">${escape(adminErr)}</p>
          <button id="btn-retry-admin" class="btn btn-primary btn-sm">Retry</button>
        </div>
      `;
      container.querySelector("#btn-retry-admin").onclick = () => this.mount(container, ctx);
      return;
    }

    const { profiles, workers, jobs, events, totalWorkers, totalEscrowVolume } = adminData;

    container.innerHTML = `
      <div class="container" style="padding-top: 10px; padding-bottom: 60px;">
        
        <div style="margin-bottom: 20px;">
          <span class="badge badge-saffron" style="margin-bottom: 4px;">Nirmaan Operations</span>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">Admin & Verification Portal</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Manage Kaarigar KYC verification, view real escrow volume, and monitor security audit logs.
          </p>
        </div>

        <!-- Metrics Strip (Real Database Counts) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Registered Kaarigars</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin-top: 4px;">${totalWorkers.toLocaleString()}</div>
          </div>
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Escrow Volume</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--green); margin-top: 4px;">₹${totalEscrowVolume.toLocaleString()}</div>
          </div>
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Active / Recent Jobs</span>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--saffron); margin-top: 4px;">${jobs.length}</div>
          </div>
        </div>

        <!-- 1. Kaarigar Verification Management Queue -->
        <div class="card" style="padding: 24px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 800; margin: 0;">Kaarigar Verification Queue</h3>
            <span class="badge badge-saffron">${workers.filter(w => !w.verified).length} Pending Approval</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${workers.slice(0, 10).map(w => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-light); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <span style="font-size: 1.6rem;">${w.avatar || "👨‍🔧"}</span>
                  <div>
                    <strong style="color: var(--text-main);">${escape(w.name || w.profiles?.full_name || "Kaarigar")}</strong>
                    <p style="font-size: 0.78rem; color: var(--text-muted);">${escape(w.trade_label || w.trade)} · ${escape(w.locality || "Noida")}</p>
                  </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="badge ${w.verified ? "badge-verified" : "badge-pending"}">
                    ${w.verified ? "Verified ✓" : "Pending Review"}
                  </span>
                  <button 
                    class="btn ${w.verified ? "btn-secondary" : "btn-primary"} btn-sm btn-toggle-verify" 
                    data-id="${w.id}" 
                    data-status="${w.verified}"
                    style="font-size: 0.75rem;"
                  >
                    ${w.verified ? "Revoke" : "Approve KYC"}
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 2. Recent Jobs Ledger -->
        <div class="card" style="padding: 24px; margin-bottom: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;">Recent Bookings & Escrows</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${jobs.length === 0 ? `
              <div style="text-align: center; color: var(--text-muted); padding: 16px;">No bookings recorded yet.</div>
            ` : jobs.slice(0, 6).map(j => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-light); font-size: 0.85rem;">
                <div>
                  <strong style="color: var(--text-main);">${escape(j.title)}</strong>
                  <div style="font-size: 0.72rem; color: var(--text-light); margin-top: 2px;">ID: ${j.id}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 800; color: var(--saffron);">₹${j.amount}</div>
                  <span class="badge badge-verified" style="font-size: 0.65rem;">${j.status}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 3. Security Audit Trail (job_events) -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;">Audit Log (job_events)</h3>
          <div style="display: flex; flex-direction: column; gap: 8px; font-family: monospace; font-size: 0.75rem;">
            ${events.length === 0 ? `
              <div style="color: var(--text-muted);">No audit events recorded yet.</div>
            ` : events.slice(0, 10).map(e => `
              <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 3px solid var(--saffron);">
                <div style="display: flex; justify-content: space-between; color: var(--text-main); font-weight: 700;">
                  <span>${escape(e.event)}</span>
                  <span>${new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
                <div style="color: var(--text-muted); margin-top: 2px;">Job: ${e.job_id} · Actor: ${escape(e.actor_id)}</div>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    `;

    // Bind verification actions
    container.querySelectorAll(".btn-toggle-verify").forEach(btn => {
      btn.onclick = async () => {
        const workerId = btn.dataset.id;
        const currentVerified = btn.dataset.status === "true";
        btn.disabled = true;
        const nextStatus = !currentVerified;

        const { error } = await api.verifyWorker(workerId, nextStatus);
        if (error) {
          showToast("Failed to update status: " + error);
          btn.disabled = false;
        } else {
          showToast(`Worker status updated to: ${nextStatus ? "Verified" : "Unverified"}`);
          await this.mount(container, ctx);
        }
      };
    });
  },

  unmount() {}
};
