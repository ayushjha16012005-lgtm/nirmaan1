/* NIRMAAN User Profile & Escrow Receipts Page */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape, formatCurrency, formatDateIST, renderEmptyState } from "../core/ui.js";
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

    const jobsList = jobs || [];

    container.innerHTML = `
      <div class="container" style="padding-top: 10px; padding-bottom: 80px;">
        
        <!-- Profile Header -->
        <div class="card" style="padding: 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--saffron-glow); color: var(--saffron); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; border: 2px solid var(--saffron);">
              ${escape(user.avatarInitials || "AS")}
            </div>
            <div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${escape(user.name || "Aman Sharma")}</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">${escape(user.phone || "+91 98•••• ••27")} · ${escape(user.area || "Noida Sector 62")}</p>
              <span class="badge badge-verified" style="margin-top: 4px;"><span class="badge-dot"></span> Customer / Builder Account</span>
            </div>
          </div>
          <a href="#/projects" class="btn btn-primary btn-sm">🏗️ Command Centre</a>
        </div>

        <!-- Active & Past Bookings -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 14px;">Your Bookings & Escrow Receipts</h3>
          
          ${jobsList.length === 0 ? `
            ${renderEmptyState({
              icon: "📋",
              title: "No Bookings Yet",
              description: "You haven't booked any Kaarigars yet. Browse verified local tradesmen and hire with escrow wage protection.",
              actionText: "🔍 Find Nearby Kaarigars",
              actionHref: "#/user-home"
            })}
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${jobsList.map(j => `
                <div class="card" style="padding: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                      <span class="badge ${j.status === "on_the_way" || j.status === "accepted" ? "badge-pending" : "badge-verified"}" style="margin-bottom: 4px;">
                        ${j.status === "on_the_way" ? "🛵 On The Way" : j.status === "approved" || j.status === "settled" || j.status === "signed_off" ? "✓ Settled & Paid" : escape(j.status)}
                      </span>
                      <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${escape(j.jobTitle)}</h4>
                      <p style="font-size: 0.82rem; color: var(--text-muted);">Kaarigar: <strong>${escape(j.workerName || "Ramesh Yadav")}</strong> (${escape(j.workerRole || "Senior Raj Mistri")})</p>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Amount</span>
                      <div style="font-size: 1.3rem; font-weight: 800; color: var(--saffron);">${formatCurrency(j.amount)}</div>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">
                      Booking Ref: ${escape(j.id.slice(0, 8))} · ${formatDateIST(j.createdAt || j.created_at)}
                    </span>
                    <a href="#/track/${escape(j.id)}" class="btn btn-secondary btn-sm">
                      ${j.status === "approved" || j.status === "settled" ? "View Receipt" : "📍 Track & Verify"}
                    </a>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Account Controls -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btn-switch-kaarigar" class="btn btn-primary btn-full">
            👷 ${t("profile.switchToKaarigar") || "Switch to Kaarigar View"}
          </button>
          <button id="btn-user-logout" class="btn btn-secondary btn-full" style="color: var(--danger); border-color: var(--border-light);">
            🚪 ${t("profile.logout") || "Sign Out"}
          </button>
          <button id="btn-user-delete-data" class="btn btn-secondary btn-full btn-sm" style="color: var(--danger); border: 1px dashed var(--danger); margin-top: 6px;">
            🗑️ ${t("profile.deleteData") || "Request Account & Data Deletion"}
          </button>
        </div>

        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 20px;">
          <a href="#/privacy" style="color: var(--text-muted); text-decoration: underline;">Privacy Policy</a> · 
          <a href="#/terms" style="color: var(--text-muted); text-decoration: underline;">Terms of Service</a>
        </p>

      </div>
    `;

    container.querySelector("#btn-switch-kaarigar").onclick = () => {
      store.switchRole("kaarigar");
    };

    container.querySelector("#btn-user-logout").onclick = () => {
      store.signOut();
    };

    container.querySelector("#btn-user-delete-data").onclick = async () => {
      if (confirm("Are you sure you want to permanently delete your account profile and all data? This cannot be undone.")) {
        const { supabase, isLive } = await import("../services/supabase.js");
        if (isLive() && user?.id) {
          try {
            await supabase.from("profiles").delete().eq("id", user.id);
          } catch (e) {
            console.warn("Delete profile err:", e);
          }
        }
        await store.signOut();
      }
    };
  },

  unmount() {}
};
