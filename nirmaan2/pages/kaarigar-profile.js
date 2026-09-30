/* NIRMAAN Kaarigar Profile, Settings & SOS Emergency Page */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape, showToast } from "../core/ui.js";

export default {
  route: "#/kaarigar-profile",
  title: "Kaarigar Profile & Settings",

  async mount(container, ctx) {
    const { store, t } = ctx;
    renderBottomNav();

    const user = store.get("user") || { name: "Ramesh Yadav", role: "kaarigar" };
    const lang = store.get("lang") || "hi";

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 70px;">
        
        <!-- Profile Identity Card -->
        <div class="card" style="padding: 24px; text-align: center; margin-bottom: 20px;">
          <div style="width: 76px; height: 76px; margin: 0 auto 12px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 3px solid var(--saffron);">
            👨‍🔧
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">${escape(user.name || "Ramesh Yadav")}</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Senior Raj Mistri · 12 Yrs Experience</p>
          
          <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
            <span class="badge badge-verified"><span class="badge-dot"></span> Aadhaar KYC Verified</span>
            <span class="badge badge-verified"><span class="badge-dot"></span> Rating 4.9 ★</span>
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
              <span style="font-size: 1.3rem;">📹</span>
              <div>
                <strong style="font-size: 0.92rem; color: var(--text-main);">Live Video KYC Verification</strong>
                <p style="font-size: 0.75rem; color: var(--green); font-weight: 600;">Active · Face Biometric Recorded</p>
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

          <!-- Switch to User / Logout -->
          <button id="btn-logout" class="btn btn-secondary btn-full" style="margin-top: 10px; color: var(--danger); border-color: var(--border-light);">
            🚪 ${t("common.logout")} / Role Change
          </button>

        </div>

      </div>
    `;

    container.querySelector("#btn-lang-toggle").onclick = () => {
      store.set("lang", store.get("lang") === "hi" ? "en" : "hi");
      window.location.reload();
    };

    container.querySelector("#btn-sos-emergency").onclick = () => {
      alert("🚨 NIRMAAN SOS TRIGGERED!\n\n1. Location sent to nearest PCR & 108 Ambulance.\n2. Nirmaan Worker Welfare Helpline notified (+91 1800-NIRMAAN).\n3. BOCW Emergency Medical Grant Claim initiated.");
    };

    container.querySelector("#btn-logout").onclick = () => {
      store.set("introSeen", false);
      window.location.hash = "#/";
    };
  },

  unmount() {}
};
