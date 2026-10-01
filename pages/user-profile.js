/* NIRMAAN User Profile & Escrow Receipts Page */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape } from "../core/ui.js";
import { DEMO_PERSONAS } from "../data/personas.js";

export default {
  route: "#/user-profile",
  title: "Customer Profile & Bookings",

  async mount(container, ctx) {
    const { store, api, t } = ctx;
    renderBottomNav();

    // Ensure customer profile never displays kaarigar persona
    const user = store.get("user")?.role === "user" ? store.get("user") : DEMO_PERSONAS.user;
    const { data: jobs } = await api.getActiveJobs();

    container.innerHTML = `
      <div class="container" style="padding-top: 10px; padding-bottom: 80px;">
        
        <!-- Profile Header -->
        <div class="card" style="padding: 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--saffron-glow); color: var(--saffron); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; border: 2px solid var(--saffron);">
              ${user.avatarInitials || "AS"}
            </div>
            <div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${escape(user.name || "Aman Sharma")}</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">${user.phone || "+91 98•••• ••27"} · ${user.area || "Noida Sector 62"}</p>
              <span class="badge badge-verified" style="margin-top: 4px;"><span class="badge-dot"></span> Customer / Builder Account</span>
            </div>
          </div>
          <a href="#/projects" class="btn btn-primary btn-sm">🏗️ Command Centre</a>
        </div>

        <!-- Active & Past Bookings -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 14px;">Your Bookings & Escrow Receipts</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${(jobs || []).map(j => `
              <div class="card" style="padding: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                  <div>
                    <span class="badge ${j.status === "on_the_way" || j.status === "accepted" ? "badge-pending" : "badge-verified"}" style="margin-bottom: 4px;">
                      ${j.status === "on_the_way" ? "🛵 On The Way" : j.status === "signed_off" ? "✓ Settled & Paid" : j.status}
                    </span>
                    <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${escape(j.jobTitle)}</h4>
                    <p style="font-size: 0.82rem; color: var(--text-muted);">Kaarigar: <strong>${escape(j.workerName || "Ramesh Yadav")}</strong> (${escape(j.workerRole || "Senior Raj Mistri")})</p>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Amount</span>
                    <div style="font-size: 1.3rem; font-weight: 800; color: var(--saffron);">₹${j.amount}</div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Started: ${j.startDate || "2026-09-30"} · ID: ${j.id}</span>
                  <a href="#/track/${j.id}" class="btn btn-secondary btn-sm">
                    ${j.status === "signed_off" ? "View Receipt" : "📍 Track & Verify"}
                  </a>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Account Controls: Separate Switch and Logout buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btn-switch-kaarigar" class="btn btn-primary btn-full">
            👷 ${t("profile.switchToKaarigar")}
          </button>
          <button id="btn-user-logout" class="btn btn-secondary btn-full" style="color: var(--danger); border-color: var(--border-light);">
            🚪 ${t("profile.logout")}
          </button>
        </div>

        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 20px;">
          ℹ️ ${t("switcher.demoNotice")}
        </p>

      </div>
    `;

    container.querySelector("#btn-switch-kaarigar").onclick = () => {
      store.switchRole("kaarigar");
    };

    container.querySelector("#btn-user-logout").onclick = () => {
      store.set("introSeen", false);
      window.location.hash = "#/";
    };
  },

  unmount() {}
};
