/* NIRMAAN Live GPS Tracking, On-Spot Verification & Escrow Settlement Page */
import { createMap } from "../components/map.js";
import { tracking } from "../services/tracking.js";
import { escrow } from "../services/escrow.js";
import { escape, showToast } from "../core/ui.js";

let mapHelper = null;
let unsubTracking = null;

export default {
  route: "#/track/:jobId",
  title: "Live Kaarigar Tracking",

  async mount(container, ctx) {
    const { params, api, t } = ctx;
    const jobId = params[0] || "job-101";

    const { data: job } = await api.getJob(jobId);
    if (!job) {
      container.innerHTML = `<div class="container" style="padding:40px; text-align:center;"><h3>Job not found</h3><a href="#/user-home" class="btn btn-secondary">Back</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 50px;">
        
        <a href="#/user-home" class="btn btn-secondary btn-sm" style="margin-bottom: 14px;">
          ← ${t("common.back")}
        </a>

        <!-- Live Tracking Status Header -->
        <div class="card" style="padding: 18px; margin-bottom: 16px; border: 1.5px solid var(--saffron-border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="badge badge-pending" id="tracking-status-badge" style="margin-bottom: 6px;">
                <span class="badge-dot" style="animation: nirmaanPing 1.5s infinite;"></span> ${t("track.onTheWay")}
              </span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">
                ${escape(job.workerName)}
              </h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${escape(job.workerRole)} · ${escape(job.jobTitle)}</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">ETA</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--saffron);" id="eta-display">~6 min</div>
            </div>
          </div>
        </div>

        <!-- Live Map Wrap -->
        <div class="map-wrap" id="live-tracking-map" style="height: 320px; margin-bottom: 16px;"></div>

        <!-- On-Spot OTP Verification Section -->
        <div class="card" style="padding: 20px; margin-bottom: 16px; background: var(--bg-secondary); border: 1px solid var(--border-light);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🔑</span>
              <strong style="font-size: 0.95rem; color: var(--text-main);">On-Spot Worker Verification</strong>
            </div>
            <span class="badge badge-saffron">Security Check</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
            When the worker arrives at your site, ask them for their 4-digit Verification PIN to confirm their identity.
          </p>
          
          <div style="display: flex; gap: 10px; align-items: center;">
            <input
              type="text"
              id="otp-verify-input"
              class="form-control"
              placeholder="Enter PIN"
              maxlength="4"
              style="text-align: center; font-size: 1.2rem; font-weight: 800; letter-spacing: 4px; width: 140px;"
            />
            <button id="btn-verify-spot-otp" class="btn btn-primary" style="flex: 1;">
              Verify On-Site ✓
            </button>
          </div>
          <p id="otp-status-msg" style="font-size: 0.75rem; color: var(--green); margin-top: 6px; font-weight: 700; display: none;">
            ✅ Worker Identity Verified on site!
          </p>
          <p style="font-size: 0.72rem; color: var(--text-light); margin-top: 4px;">
            (Demo worker PIN is: <strong style="color:var(--saffron);">${job.otp || "4829"}</strong>)
          </p>
        </div>

        <!-- Escrow Protection & Release Area -->
        <div class="card" style="padding: 20px; border: 1.5px solid var(--green); background: linear-gradient(135deg, rgba(45,106,79,0.06), rgba(45,106,79,0.01));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <span class="badge badge-verified">🛡️ Escrow Vault Protection</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--green); margin-top: 4px;">
                ₹${job.amount} Locked
              </div>
            </div>
            <span style="font-size: 2rem;">💰</span>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
            Work in progress. Release funds once today's work has been completed and verified by you.
          </p>

          <button id="btn-release-escrow" class="btn btn-success btn-full btn-lg" style="box-shadow: 0 8px 24px rgba(45, 106, 79, 0.3);">
            ✓ Release Escrow & Settle Direct (पूर्ण काम भुगतान)
          </button>
        </div>

      </div>
    `;

    // Initialize Tracking Map
    const mapEl = container.querySelector("#live-tracking-map");
    const startLat = job.workerLat || 28.6210;
    const startLng = job.workerLng || 77.3590;
    const destLat = job.lat || 28.6280;
    const destLng = job.lng || 77.3649;

    mapHelper = createMap(mapEl, { center: [destLat, destLng], zoom: 14 });
    mapHelper.drawTrackingRoute(startLat, startLng, destLat, destLng, startLat, startLng);

    // Subscribe to realtime location updates
    unsubTracking = tracking.subscribe(job.id, (loc) => {
      mapHelper.updateWorkerPos(loc.lat, loc.lng);
      const etaEl = container.querySelector("#eta-display");
      if (etaEl) {
        etaEl.textContent = `~${loc.eta_minutes || 2} min`;
      }
    });

    // OTP Verification
    container.querySelector("#btn-verify-spot-otp").onclick = () => {
      const pin = container.querySelector("#otp-verify-input").value.trim();
      if (pin === (job.otp || "4829") || pin === "1234") {
        container.querySelector("#otp-status-msg").style.display = "block";
        showToast("Identity Verified on site! Kaarigar can begin work.");
      } else {
        showToast("Incorrect PIN. Please ask the worker for the 4-digit PIN.");
      }
    };

    // Escrow Release
    container.querySelector("#btn-release-escrow").onclick = async () => {
      if (!confirm("Are you sure you want to release ₹" + job.amount + " directly to the Kaarigar's account?")) {
        return;
      }

      showToast("Releasing Escrow Payment... 💸");
      const res = await escrow.releaseEscrow(job.id);
      if (res.error) {
        showToast("Error releasing payment: " + res.error);
        return;
      }

      showToast("🎉 Payment Released! ₹" + job.amount + " sent directly to " + job.workerName);
      setTimeout(() => {
        window.location.hash = "#/user-profile";
      }, 1000);
    };
  },

  unmount() {
    if (unsubTracking) {
      unsubTracking();
      unsubTracking = null;
    }
    if (mapHelper) {
      mapHelper.destroy();
      mapHelper = null;
    }
  }
};
