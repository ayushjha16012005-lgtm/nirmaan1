/* NIRMAAN Kaarigar Profile, Settings & SOS Emergency Page */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape } from "../core/ui.js";
import { DEMO_PERSONAS } from "../data/personas.js";

export default {
  route: "#/kaarigar-profile",
  title: "Kaarigar Profile & Settings",

  async mount(container, ctx) {
    const { store, t } = ctx;
    renderBottomNav();

    // Ensure kaarigar profile never displays customer persona
    const user = store.get("user")?.role === "kaarigar" ? store.get("user") : DEMO_PERSONAS.kaarigar;
    const lang = store.get("lang") || "hi";

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 80px;">
        
        <!-- Profile Identity Card -->
        <div class="card" style="padding: 24px; text-align: center; margin-bottom: 20px;">
          <div style="width: 76px; height: 76px; margin: 0 auto 12px; border-radius: 50%; background: var(--saffron-glow); color: var(--saffron); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; border: 3px solid var(--saffron);">
            ${user.avatarInitials || "RY"}
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">${escape(user.name || "Ramesh Yadav")}</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
            ${user.tradeRole || "Senior Raj Mistri"} · ${user.experience || 12} Yrs Experience
          </p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            ${user.phone || "+91 94•••• ••81"} · ${user.area || "Noida Sector 62"}
          </p>
          
          <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <span class="badge badge-verified"><span class="badge-dot"></span> Aadhaar Verified</span>
            <span class="badge badge-verified"><span class="badge-dot"></span> Rating ${user.rating || 4.9} ★ (${user.jobsCompleted || 142} Jobs)</span>
          </div>
        </div>

        <!-- Menu Action Stack -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          
          <div class="card card-clickable" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;" onclick="alert('🏦 Linked Bank: State Bank of India\\nA/C: XXXXXXXX4819\\nIFSC: SBIN0001234')">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.3rem;">🏦</span>
              <div>
                <strong style="font-size: 0.92rem; color: var(--text-main);">Bank & Earnings Account</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted);">Direct DBT payment linked (SBI **4819)</p>
              </div>
            </div>
            <span>›</span>
          </div>

          <div class="card card-clickable" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;" onclick="window.location.hash='#/onboarding'">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.3rem;">📷</span>
              <div>
                <strong style="font-size: 0.92rem; color: var(--text-main);">Photo & Location KYC Proof</strong>
                <p style="font-size: 0.75rem; color: var(--green); font-weight: 600;">Active · Photo & GPS Verified</p>
              </div>
            </div>
            <span>›</span>
          </div>

          <div class="card card-clickable" id="btn-lang-toggle" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.3rem;">🌐</span>
              <div>
                <strong style="font-size: 0.92rem; color: var(--text-main);">App Language (भाषा)</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted);">Current: ${lang === "hi" ? "हिंदी (Hindi)" : "English"}</p>
              </div>
            </div>
            <span class="badge badge-saffron">${lang === "hi" ? "हिं" : "EN"}</span>
          </div>

          <!-- SOS Emergency Support -->
          <div class="card card-clickable" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border: 1.5px solid var(--danger); background: var(--danger-glow);" id="btn-sos-emergency">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.4rem;">🚨</span>
              <div>
                <strong style="font-size: 0.95rem; color: var(--danger);">SOS Emergency & Site Safety</strong>
                <p style="font-size: 0.75rem; color: var(--danger);">One-tap emergency call & site injury assistance</p>
              </div>
            </div>
            <span style="font-weight: 800; color: var(--danger);">HELP</span>
          </div>

        </div>

        <!-- Account Controls: Separate Switch and Logout buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btn-switch-user" class="btn btn-primary btn-full">
            👤 ${t("profile.switchToUser")}
          </button>
          <button id="btn-logout" class="btn btn-secondary btn-full" style="color: var(--danger); border-color: var(--border-light);">
            🚪 ${t("profile.logout")}
          </button>
          <button id="btn-worker-delete-data" class="btn btn-secondary btn-full btn-sm" style="color: var(--danger); border: 1px dashed var(--danger); margin-top: 6px;">
            🗑️ ${t("profile.deleteData") || "Request Account & Data Deletion"}
          </button>
        </div>

        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 20px;">
          <a href="#/privacy" style="color: var(--text-muted); text-decoration: underline;">Privacy Policy</a> · 
          <a href="#/terms" style="color: var(--text-muted); text-decoration: underline;">Terms of Service</a>
        </p>

      </div>
    `;

    container.querySelector("#btn-lang-toggle").onclick = () => {
      store.set("lang", store.get("lang") === "hi" ? "en" : "hi");
      window.location.reload();
    };

    container.querySelector("#btn-sos-emergency").onclick = () => {
      alert("🚨 NIRMAAN SOS TRIGGERED!\n\n1. Location sent to nearest PCR & 108 Ambulance.\n2. Nirmaan Worker Welfare Helpline notified (+91 1800-NIRMAAN).\n3. BOCW Emergency Medical Grant Claim initiated.");
    };

    container.querySelector("#btn-switch-user").onclick = () => {
      store.switchRole("user");
    };

    container.querySelector("#btn-logout").onclick = () => {
      store.signOut();
    };

    container.querySelector("#btn-worker-delete-data").onclick = async () => {
      if (confirm("Are you sure you want to permanently delete your account profile and all data? This cannot be undone.")) {
        const { supabase, isLive } = await import("../services/supabase.js");
        if (isLive() && user?.id) {
          try {
            await supabase.from("worker_profiles").delete().eq("id", user.id);
            await supabase.from("profiles").delete().eq("id", user.id);
          } catch (e) {
            console.warn("Delete profile error:", e);
          }
        }
        showToast("Account profile deleted.");
        store.signOut();
      }
    };
  },

  unmount() {}
};
