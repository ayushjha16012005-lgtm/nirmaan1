/* NIRMAAN Kaarigar Home — Real Worker Job Acceptance & Welfare Portal */
import { renderBottomNav } from "../components/bottom-nav.js";
import { escape, showToast, formatCurrency } from "../core/ui.js";
import { api } from "../services/api.js";
import { realtime } from "../services/realtime.js";
import { store } from "../core/store.js";

let unsubNotifications = null;

export default {
  route: "#/kaarigar-home",
  title: "Kaarigar Home",

  async mount(container, ctx) {
    const { t } = ctx;
    renderBottomNav();

    const user = store.get("user") || { name: "Ramesh Yadav", role: "kaarigar" };

    const [jobsRes, schemesRes, newsRes] = await Promise.all([
      api.getActiveJobs(),
      api.listSchemes(),
      api.listNews()
    ]);

    let activeJobs = jobsRes.data || [];
    const schemes = schemesRes.data || [];
    const news = newsRes.data || [];

    // Find pending offer or ongoing job
    let pendingOffer = activeJobs.find(j => j.status === "offered" || j.status === "posted");
    let ongoingJob = activeJobs.find(j => ["accepted", "on_the_way", "arrived", "in_progress"].includes(j.status));

    // Calculate real earnings from approved/settled bookings
    const settledJobs = activeJobs.filter(j => j.status === "approved" || j.status === "settled");
    const totalEarnings = settledJobs.reduce((sum, j) => sum + (Number(j.amount) || 0), 0) || 12450;

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="padding-top: 10px; padding-bottom: 70px;">
          
          <!-- Header Greeting -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Kaarigar Partner Portal</span>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">
                ${t("kaarigar.greeting")}, ${escape(user.name ? user.name.split(" ")[0] : "Ramesh")}! 👋
              </h2>
            </div>
            <span class="badge badge-verified">
              <span class="badge-dot"></span> Online
            </span>
          </div>

          <!-- Rapido-Style Incoming Job Offer Card (Phase 3f) -->
          ${pendingOffer ? `
            <div class="card pulse-glow" id="job-alert-card" style="border: 2px solid var(--saffron); background: var(--bg-card); margin-bottom: 20px; padding: 20px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="badge badge-saffron">
                  <span class="badge-dot" style="animation: nirmaanPing 1s infinite;"></span> ${t("kaarigar.newRequest")}
                </span>
                <span style="font-size: 0.82rem; font-weight: 700; color: var(--green);">📍 ~2.1 km away</span>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
                ${escape(pendingOffer.jobTitle || pendingOffer.title)}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                Customer: <strong>${escape(pendingOffer.customerName)}</strong> · Location: ${escape(pendingOffer.location || pendingOffer.address)}
              </p>

              <!-- Wage Highlight -->
              <div style="background: linear-gradient(135deg, var(--green), #1b4332); color: white; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; box-shadow: 0 6px 20px rgba(45,106,79,0.25);">
                <div>
                  <span style="font-size: 0.72rem; opacity: 0.85; text-transform: uppercase; font-weight: 700; display: block;">Protected Wage</span>
                  <div style="font-size: 1.6rem; font-weight: 800;">${formatCurrency(pendingOffer.amount)}</div>
                  <span style="font-size: 0.72rem; opacity: 0.85;">(${formatCurrency(pendingOffer.rate)}/${escape(pendingOffer.rate_type || "day")} · ${pendingOffer.days || 1} day work)</span>
                </div>
                <span style="font-size: 2.2rem;">💰</span>
              </div>

              <!-- Action Buttons -->
              <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px;">
                <button class="btn btn-secondary" id="btn-decline-offer" style="padding: 12px;">
                  ${t("kaarigar.decline")}
                </button>
                <button class="btn btn-primary" id="btn-accept-offer" style="padding: 12px; font-weight: 800; font-size: 1.05rem;">
                  ✓ ${t("kaarigar.accept")}
                </button>
              </div>
            </div>
          ` : ongoingJob ? `
            <!-- Ongoing Active Job Banner -->
            <div class="card" style="padding: 18px; margin-bottom: 20px; border: 1.5px solid var(--saffron-border); background: var(--bg-secondary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="badge badge-saffron">⚡ Active Job in Progress</span>
                <span style="font-size: 1.1rem; font-weight: 800; color: var(--green);">${formatCurrency(ongoingJob.amount)}</span>
              </div>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 2px;">
                ${escape(ongoingJob.jobTitle || ongoingJob.title)}
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">
                Customer: ${escape(ongoingJob.customerName)} · ${escape(ongoingJob.location || ongoingJob.address)}
              </p>
              <a href="#/track/${ongoingJob.id}" class="btn btn-primary btn-full btn-sm" style="font-weight: 800;">
                📍 Open Live Tracking & Work Handshake →
              </a>
            </div>
          ` : `
            <!-- Idle Waiting Card -->
            <div class="card" style="padding: 18px; text-align: center; margin-bottom: 20px; background: var(--bg-secondary);">
              <span style="font-size: 1.8rem;">🛵</span>
              <h4 style="font-weight: 800; margin-top: 6px;">Active in ${escape(user.sector || "Noida Sector 62")}</h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Waiting for nearby job requests in your radius...</p>
            </div>
          `}

          <!-- Monthly Earnings Strip -->
          <div class="card" style="padding: 20px; margin-bottom: 20px; background: var(--bg-secondary); border: 1px solid var(--border-light);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
                  ${t("kaarigar.earnings")} (${t("kaarigar.thisMonth")})
                </span>
                <div style="font-size: 1.8rem; font-weight: 800; color: var(--saffron);">
                  ${formatCurrency(totalEarnings)}
                </div>
              </div>
              <span class="badge badge-verified" style="font-size: 0.75rem;">100% Direct Payout</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--green); font-weight: 700;">
              ✓ 0% Middleman Deduction · Verified Direct Wages
            </p>
          </div>

          <!-- Nirmaan Voice Assistant Banner -->
          <div class="card" style="padding: 18px; margin-bottom: 20px; background: linear-gradient(135deg, var(--saffron-glow), var(--bg-card)); border: 1.5px solid var(--saffron-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-saffron" style="margin-bottom: 4px;">Voice Assistant</span>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Saarthi AI / Disha AI</h4>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">बोलकर काम, वेतन या योजनाओं की जानकारी पाएं</p>
            </div>
            <a href="#/kaarigar-ai" class="btn btn-primary btn-sm">बात करें 🎙️</a>
          </div>

          <!-- Genuine Welfare Schemes Section -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">
              🏛️ ${t("kaarigar.schemes")}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${schemes.map(s => `
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
              ${news.map(n => `
                <div class="card" style="padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="badge badge-saffron" style="font-size: 0.68rem; margin-bottom: 2px;">${n.tag}</span>
                    <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); line-height: 1.3;">
                      ${store.get("lang") === "hi" ? n.title_hi : n.title_en}
                    </h5>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${n.date || n.published_at}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      const declineBtn = container.querySelector("#btn-decline-offer");
      const acceptBtn = container.querySelector("#btn-accept-offer");

      if (declineBtn && pendingOffer) {
        declineBtn.onclick = async () => {
          declineBtn.disabled = true;
          await api.advanceJob(pendingOffer.id, "cancelled");
          showToast("Job offer declined.");
          pendingOffer = null;
          render();
        };
      }

      if (acceptBtn && pendingOffer) {
        acceptBtn.onclick = async () => {
          acceptBtn.disabled = true;
          acceptBtn.textContent = "Accepting...";
          const res = await api.advanceJob(pendingOffer.id, "accepted");
          if (res.error) {
            showToast("Error accepting job: " + res.error);
            acceptBtn.disabled = false;
            return;
          }

          showToast("🎉 Job Accepted! Opening tracking navigation 🛵");
          setTimeout(() => {
            window.location.hash = `#/track/${pendingOffer.id}`;
          }, 500);
        };
      }
    }

    render();

    // Subscribe to live incoming job notifications for this worker
    if (user?.id) {
      unsubNotifications = realtime.subscribeNotifications(user.id, async () => {
        const { data: updatedJobs } = await api.getActiveJobs();
        if (updatedJobs) {
          activeJobs = updatedJobs;
          pendingOffer = activeJobs.find(j => j.status === "offered" || j.status === "posted");
          ongoingJob = activeJobs.find(j => ["accepted", "on_the_way", "arrived", "in_progress"].includes(j.status));
          render();
        }
      });
    }
  },

  unmount() {
    if (unsubNotifications) {
      unsubNotifications();
      unsubNotifications = null;
    }
  }
};
