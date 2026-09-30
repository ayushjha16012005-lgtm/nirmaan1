/* NIRMAAN Kaarigar Home — Worker-First Experience */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape, showToast } from "../core/ui.js";

export default {
  route: "#/kaarigar-home",
  title: "Kaarigar Home",

  async mount(container, ctx) {
    const { t, api, store } = ctx;
    renderBottomNav();

    const { data: schemes } = await api.listSchemes();
    const { data: news } = await api.listNews();
    const { data: activeJobs } = await api.getActiveJobs();

    const user = store.get("user") || { name: "Ramesh Yadav", role: "kaarigar" };
    let incomingJob = activeJobs && activeJobs.length > 0 ? activeJobs[0] : {
      id: "job-alert-1",
      workerName: "Ramesh Yadav",
      jobTitle: "Boundary Wall & Tile Fitting",
      customerName: "Aman Sharma",
      distance_km: 2.1,
      rate: 850,
      days: 3,
      amount: 2550,
      location: "Noida Sector 62 (2.1 km away)"
    };

    let hasJobAlert = true;

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="padding-top: 10px; padding-bottom: 60px;">
          
          <!-- Header Greeting -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Kaarigar Partner Home</span>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">
                ${t("kaarigar.greeting")}, ${escape(user.name || "Ramesh")}! 👋
              </h2>
            </div>
            <span class="badge badge-verified">
              <span class="badge-dot"></span> Online
            </span>
          </div>

          <!-- Rapido-Style Job Alert -->
          ${hasJobAlert ? `
            <div class="card pulse-glow" id="job-alert-card" style="border: 2px solid var(--saffron); background: var(--bg-card); margin-bottom: 20px; padding: 20px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="badge badge-saffron">
                  <span class="badge-dot" style="animation: nirmaanPing 1s infinite;"></span> ${t("kaarigar.newRequest")}
                </span>
                <span style="font-size: 0.82rem; font-weight: 700; color: var(--green);">📍 ${incomingJob.distance_km || 2.1} km away</span>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
                ${escape(incomingJob.jobTitle)}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                Customer: <strong>${escape(incomingJob.customerName)}</strong> · Location: ${escape(incomingJob.location)}
              </p>

              <!-- Wage Highlight -->
              <div style="background: linear-gradient(135deg, var(--green), #1b4332); color: white; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; box-shadow: 0 6px 20px rgba(45,106,79,0.25);">
                <div>
                  <span style="font-size: 0.72rem; opacity: 0.85; text-transform: uppercase; font-weight: 700; display: block;">Direct Wage Escrow</span>
                  <div style="font-size: 1.6rem; font-weight: 800;">₹${incomingJob.amount}</div>
                  <span style="font-size: 0.72rem; opacity: 0.85;">(₹${incomingJob.rate}/day · ${incomingJob.days || 3} days work)</span>
                </div>
                <span style="font-size: 2.2rem;">💰</span>
              </div>

              <!-- Action Buttons -->
              <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px;">
                <button class="btn btn-secondary" id="btn-decline-job" style="padding: 12px;">
                  ${t("kaarigar.decline")}
                </button>
                <button class="btn btn-primary" id="btn-accept-job" style="padding: 12px; font-weight: 800; font-size: 1.05rem;">
                  ✓ ${t("kaarigar.accept")}
                </button>
              </div>
            </div>
          ` : `
            <div class="card" style="padding: 18px; text-align: center; margin-bottom: 20px; background: var(--bg-secondary);">
              <span style="font-size: 1.8rem;">🛵</span>
              <h4 style="font-weight: 800; margin-top: 6px;">Active in Noida Sector 62</h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Waiting for nearby job requests in your radius...</p>
            </div>
          `}

          <!-- Monthly Earnings Strip -->
          <div class="card" style="padding: 20px; margin-bottom: 20px; background: var(--bg-secondary); border: 1px solid var(--border-light);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${t("kaarigar.earnings")} (${t("kaarigar.thisMonth")})</span>
                <div style="font-size: 1.8rem; font-weight: 800; color: var(--saffron);">
                  ₹12,450
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="alert('Bank Account: State Bank of India (Ending in **4819)')">
                🏦 ${t("kaarigar.bankDetails")}
              </button>
            </div>
            <p style="font-size: 0.75rem; color: var(--green); font-weight: 700;">
              ✓ 100% Direct Payouts · 0% Thekedar Commission Deducted
            </p>
          </div>

          <!-- Nirmaan AI Assistant Banner -->
          <div class="card" style="padding: 18px; margin-bottom: 20px; background: linear-gradient(135deg, var(--saffron-glow), var(--bg-card)); border: 1.5px solid var(--saffron-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-saffron" style="margin-bottom: 4px;">Voice Assistant</span>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Saarthi AI / Disha AI</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">बोलकर काम, वेतन या योजनाओं की जानकारी पाएं</p>
            </div>
            <a href="#/kaarigar-ai" class="btn btn-primary btn-sm">बात करें 🎙️</a>
          </div>

          <!-- Welfare Schemes Section -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">
              🏛️ ${t("kaarigar.schemes")}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${(schemes || []).map(s => `
                <div class="card card-clickable" style="padding: 14px;" onclick="window.open('${s.link}', '_blank')">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="font-size: 0.9rem; color: var(--text-main);">
                      ${store.get("lang") === "hi" ? s.title_hi : s.title_en}
                    </strong>
                    <span class="badge badge-verified" style="font-size: 0.7rem;">${escape(s.badge)}</span>
                  </div>
                  <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                    ${store.get("lang") === "hi" ? s.desc_hi : s.desc_en}
                  </p>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Nirmaan Samachar -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">
              📰 ${t("kaarigar.samachar")}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(news || []).map(n => `
                <div class="card" style="padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="badge badge-saffron" style="font-size: 0.68rem; margin-bottom: 2px;">${n.tag}</span>
                    <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); line-height: 1.3;">
                      ${store.get("lang") === "hi" ? n.title_hi : n.title_en}
                    </h5>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${n.date}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

        </div>
      `;

      if (hasJobAlert) {
        container.querySelector("#btn-decline-job").onclick = () => {
          hasJobAlert = false;
          showToast("Job request declined.");
          render();
        };

        container.querySelector("#btn-accept-job").onclick = () => {
          showToast("🎉 Job Accepted! Starting navigation to work site 🛵");
          setTimeout(() => {
            window.location.hash = `#/track/${incomingJob.id || "job-101"}`;
          }, 600);
        };
      }
    }

    render();
  },

  unmount() {}
};
