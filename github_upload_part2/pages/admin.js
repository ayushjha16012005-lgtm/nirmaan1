/* NIRMAAN Admin Dashboard Page */
import { api } from "../services/api.js";
import { escape, showToast } from "../core/ui.js";

export default {
  route: "#/admin",
  title: "Admin Command Portal",

  async mount(container, ctx) {
    const { data: workers } = await api.listWorkers();

    container.innerHTML = `
      <div class="container" style="padding-top: 10px; padding-bottom: 60px;">
        
        <div style="margin-bottom: 20px;">
          <span class="badge badge-saffron" style="margin-bottom: 4px;">Nirmaan Ops</span>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">Admin & Verification Portal</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Manage Kaarigar KYC approvals, active escrows, and platform metrics.</p>
        </div>

        <!-- Metrics Strip -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Kaarigars</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-top: 4px;">${workers ? workers.length : 5}</div>
          </div>
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Escrow Volume</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--green); margin-top: 4px;">₹5,12,000</div>
          </div>
          <div class="card" style="padding: 16px; background: var(--bg-secondary);">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Direct Settlement Rate</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--saffron); margin-top: 4px;">99.4%</div>
          </div>
        </div>

        <!-- Kaarigar Verification Management -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 16px;">Kaarigar Roster & Verification</h3>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(workers || []).map(w => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-light); flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                  <span style="font-size: 1.4rem;">${w.avatar || "👨‍🔧"}</span>
                  <div>
                    <strong>${escape(w.name)}</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">${escape(w.role)} · ${escape(w.location)}</p>
                  </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="badge ${w.verified ? "badge-verified" : "badge-pending"}">
                    ${w.verified ? "Verified" : "Pending Approval"}
                  </span>
                  <button class="btn btn-secondary btn-sm" onclick="alert('Worker status updated!')">
                    ${w.verified ? "Revoke" : "Approve KYC"}
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    `;
  },

  unmount() {}
};
