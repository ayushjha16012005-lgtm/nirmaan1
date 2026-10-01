/* NIRMAAN Live Tracking, Site Verification, Photo Proofs & Escrow Settlement Page */
import { createMap } from "../components/map.js";
import { tracking } from "../services/tracking.js";
import { escrow } from "../services/escrow.js";
import { api } from "../services/api.js";
import { realtime } from "../services/realtime.js";
import { store } from "../core/store.js";
import { escape, showToast } from "../core/ui.js";
import { openChatModal } from "../components/chat-modal.js";
import { renderProofSection } from "../components/proof-capture.js";
import { demoResponder } from "../services/demo-responder.js";

let mapHelper = null;
let unsubTracking = null;
let unsubJobRealtime = null;

export default {
  route: "#/track/:jobId",
  title: "Live Job Tracking",

  async mount(container, ctx) {
    const { params, t } = ctx;
    const jobId = params[0] || "job-101";

    const { data: job, error: jobErr } = await api.getJob(jobId);
    if (!job || jobErr) {
      container.innerHTML = `
        <div class="container" style="padding:40px 16px; text-align:center;">
          <h3 style="color:var(--text-main); font-weight:800;">Job not found</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:8px 0 16px;">This booking does not exist or has been removed.</p>
          <a href="#/user-home" class="btn btn-secondary btn-sm">← Back to Home</a>
        </div>
      `;
      return;
    }

    const user = store.get("user");
    const isWorker = user?.id === job.workerId || store.get("role") === "kaarigar";
    const isCustomer = !isWorker;
    const counterPartyName = isWorker ? job.customerName : job.workerName;
    const isSeedWorker = Boolean(job.is_seed || job.worker?.is_seed);

    let isSharingGps = false;
    let hasRated = false;

    // Start Demo Responder if worker is a seed worker and user is customer
    if (isCustomer && isSeedWorker && ["requested", "offered", "posted", "accepted", "on_the_way", "in_progress"].includes(job.status)) {
      demoResponder.watchJob(job, (newStatus) => {
        job.status = newStatus;
        render();
      });
    }

    function getStatusBadge(status) {
      switch (status) {
        case "requested":
        case "offered":
        case "posted":
          return `<span class="badge badge-pending"><span class="badge-dot" style="animation: nirmaanPing 1.5s infinite;"></span> Waiting for Kaarigar Acceptance...</span>`;
        case "accepted":
          return `<span class="badge badge-verified">✓ Accepted (Preparing for Site)</span>`;
        case "on_the_way":
          return `<span class="badge badge-pending"><span class="badge-dot" style="animation: nirmaanPing 1.5s infinite;"></span> 🛵 ${t("track.onTheWay")}</span>`;
        case "arrived":
          return `<span class="badge badge-verified">📍 ${t("track.arrived")} (Verify On-Site PIN)</span>`;
        case "in_progress":
          return `<span class="badge badge-saffron">⚡ Work in Progress (काम जारी है)</span>`;
        case "work_submitted":
        case "completed":
          return `<span class="badge badge-verified">🎉 Work Completed (Review & Settle)</span>`;
        case "approved":
        case "settled":
          return `<span class="badge badge-verified">✓ Settled & Paid (काम पूर्ण व भुगतान सफल)</span>`;
        case "cancelled":
          return `<span class="badge" style="background:#fee2e2; color:#b91c1c;">✕ Cancelled</span>`;
        default:
          return `<span class="badge badge-saffron">${status}</span>`;
      }
    }

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="padding-top: 10px; padding-bottom: 70px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <a href="${isWorker ? "#/kaarigar-home" : "#/user-home"}" class="btn btn-secondary btn-sm">
              ← ${t("common.back")}
            </a>
            
            <!-- In-App Realtime Chat Button (Phase 3d) -->
            <button id="btn-open-chat" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px; font-weight: 700;">
              💬 Chat with ${escape(counterPartyName.split(" ")[0])}
            </button>
          </div>

          <!-- Status & ETA Card -->
          <div class="card" style="padding: 18px; margin-bottom: 16px; border: 1.5px solid var(--saffron-border); background: var(--bg-card);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
              <div>
                <div id="status-badge-container" style="margin-bottom: 8px;">
                  ${getStatusBadge(job.status)}
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">
                  ${escape(job.jobTitle)}
                </h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                  ${isWorker ? `Customer: <strong>${escape(job.customerName)}</strong>` : `Kaarigar: <strong>${escape(job.workerName)}</strong> (${escape(job.workerRole)})`}
                </p>
                <p style="font-size: 0.78rem; color: var(--text-light); margin-top: 2px;">
                  📍 ${escape(job.location)} · Booking ID: <strong style="font-family:monospace;">${job.id.slice(0, 8)}</strong>
                </p>
              </div>

              ${(job.status === "on_the_way" || job.status === "arrived") ? `
                <div style="text-align: right; background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                  <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">ETA</span>
                  <div style="font-size: 1.35rem; font-weight: 800; color: var(--saffron);" id="eta-display">~5 min</div>
                </div>
              ` : ""}
            </div>

            <!-- Worker Location Sharing Controls (Phase 3e) -->
            ${isWorker && (job.status === "accepted" || job.status === "on_the_way" || job.status === "arrived") ? `
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">
                  ${isSharingGps ? "🟢 Sharing GPS with Customer" : "📡 GPS Broadcast Offline"}
                </span>
                <button id="btn-toggle-gps" class="btn ${isSharingGps ? "btn-secondary" : "btn-primary"} btn-sm" style="font-weight: 700;">
                  ${isSharingGps ? "Stop Sharing" : "📡 Share Live GPS"}
                </button>
              </div>
            ` : ""}
          </div>

          <!-- Live GPS Map View -->
          <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 16px; border: 1px solid var(--border-light);">
            <div id="live-tracking-map" style="width: 100%; height: 280px; background: #e5e3df;"></div>
          </div>

          <!-- On-Spot Verification Handshake (Phase 3f) -->
          ${job.status !== "settled" && job.status !== "approved" && job.status !== "cancelled" ? `
            <div class="card" style="padding: 18px; margin-bottom: 16px; background: var(--bg-secondary); border: 1.5px solid var(--saffron-border);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.3rem;">🔑</span>
                  <strong style="font-size: 0.95rem; color: var(--text-main);">On-Spot Security Verification</strong>
                </div>
                <span class="badge badge-saffron">Site Safety Handshake</span>
              </div>

              ${isCustomer ? `
                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px;">
                  When the worker arrives at your site, share this 4-digit code to begin the work:
                </p>
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; background: var(--bg-card); border-radius: var(--radius-md); border: 1.5px dashed var(--saffron);">
                  <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">VERIFICATION CODE:</span>
                  <span style="font-size: 1.8rem; font-weight: 900; letter-spacing: 6px; color: var(--saffron);">
                    ${job.otp || "4829"}
                  </span>
                </div>
                ${isSeedWorker && (job.status === "arrived" || job.status === "accepted" || job.status === "on_the_way") ? `
                  <button id="btn-simulate-otp" class="btn btn-secondary btn-sm btn-full" style="margin-top: 10px; font-weight: 700; border: 1px dashed var(--saffron);">
                    ⚡ Simulate Kaarigar Entering PIN (Demo)
                  </button>
                ` : ""}
              ` : `
                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px;">
                  Ask the customer for the 4-digit verification code upon reaching the site to begin work:
                </p>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input 
                    type="text" 
                    id="otp-verify-input" 
                    class="form-control" 
                    placeholder="• • • •" 
                    maxlength="4"
                    inputmode="numeric"
                    style="text-align: center; font-size: 1.3rem; font-weight: 800; letter-spacing: 6px; width: 130px;"
                  />
                  <button id="btn-verify-spot-otp" class="btn btn-primary" style="flex: 1; font-weight: 800;">
                    Verify & Start Work ✓
                  </button>
                </div>
              `}
            </div>
          ` : ""}

          <!-- Photo Proofs Section (Phase 5a) -->
          <div id="proof-photos-section-container"></div>

          <!-- Escrow Protection & Settlement Area (Phase 4) -->
          <div class="card" style="padding: 20px; border: 1.5px solid var(--green); background: linear-gradient(135deg, rgba(45,106,79,0.06), rgba(45,106,79,0.01)); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="badge badge-verified">🛡️ Protected Wage</span>
                  <span class="badge" style="background: rgba(232,98,26,0.12); color: var(--saffron); font-size: 0.68rem; font-weight: 800;">Test Mode</span>
                </div>
                <div style="font-size: 1.6rem; font-weight: 800; color: var(--green); margin-top: 4px;">
                  ₹${job.amount} ${job.escrowLocked ? "Secured" : "Estimated"}
                </div>
              </div>
              <span style="font-size: 2.2rem;">💰</span>
            </div>

            <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px;">
              Payment is held securely in the ledger until you inspect and approve the completed work.
            </p>

            ${isCustomer && (job.status === "in_progress" || job.status === "work_submitted" || job.status === "completed" || job.status === "arrived") ? `
              <button id="btn-release-escrow" class="btn btn-success btn-full btn-lg" style="box-shadow: 0 8px 24px rgba(45, 106, 79, 0.3); font-weight: 800;">
                ✓ Approve Work & Release Payment (भुगतान जारी करें)
              </button>
            ` : isWorker && job.status === "in_progress" ? `
              <button id="btn-worker-complete-job" class="btn btn-primary btn-full btn-lg" style="font-weight: 800;">
                ✓ Mark Work Completed (काम पूरा हुआ)
              </button>
            ` : job.status === "approved" || job.status === "settled" ? `
              <div style="display: flex; gap: 8px;">
                <button id="btn-view-receipt" class="btn btn-secondary btn-full btn-sm">
                  🧾 View & Print Receipt
                </button>
              </div>
            ` : ""}

            ${isCustomer && ["requested", "offered", "posted", "accepted", "on_the_way"].includes(job.status) ? `
              <button id="btn-cancel-booking" class="btn btn-secondary btn-full btn-sm" style="margin-top: 10px; color: var(--red); border-color: rgba(220, 38, 38, 0.3);">
                ✕ Cancel Booking
              </button>
            ` : ""}
          </div>

          <!-- Review & Rating Section (Phase 3g) -->
          ${(job.status === "approved" || job.status === "settled") && !hasRated ? `
            <div class="card" style="padding: 20px; border: 1.5px solid var(--saffron); background: var(--bg-card); margin-bottom: 16px;">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
                ⭐ Rate Your Experience
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">
                Your honest rating updates ${escape(counterPartyName)}'s verified trust score in the database.
              </p>

              <div id="star-rating-select" style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 1.8rem; cursor: pointer;">
                <span class="star-btn" data-star="1">⭐</span>
                <span class="star-btn" data-star="2">⭐</span>
                <span class="star-btn" data-star="3">⭐</span>
                <span class="star-btn" data-star="4">⭐</span>
                <span class="star-btn" data-star="5">⭐</span>
              </div>

              <input 
                type="text" 
                id="review-comment-input" 
                class="form-control" 
                placeholder="Optional feedback (e.g. Excellent masonry work, on time)" 
                style="margin-bottom: 10px; font-size: 0.85rem;"
              />

              <button id="btn-submit-review" class="btn btn-primary btn-full btn-sm" style="font-weight: 700;">
                Submit Verified Rating
              </button>
            </div>
          ` : ""}

        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      // 1. Map Initialization
      const mapEl = container.querySelector("#live-tracking-map");
      const startLat = job.workerLat || 28.6210;
      const startLng = job.workerLng || 77.3590;
      const destLat = job.lat || 28.6280;
      const destLng = job.lng || 77.3649;

      if (mapHelper) mapHelper.destroy();
      mapHelper = createMap(mapEl, { center: [destLat, destLng], zoom: 14 });
      mapHelper.drawTrackingRoute(startLat, startLng, destLat, destLng, startLat, startLng);

      // 2. Proof Photos Section
      const proofContainer = container.querySelector("#proof-photos-section-container");
      if (proofContainer) {
        renderProofSection(proofContainer, job);
      }

      // 3. Chat Modal Button
      const chatBtn = container.querySelector("#btn-open-chat");
      if (chatBtn) {
        chatBtn.onclick = () => openChatModal(job.id, counterPartyName);
      }

      // 4. GPS Sharing Toggle for Worker
      const gpsBtn = container.querySelector("#btn-toggle-gps");
      if (gpsBtn) {
        gpsBtn.onclick = () => {
          if (!isSharingGps) {
            isSharingGps = true;
            tracking.startPublishing(
              job.id,
              (coords) => {
                mapHelper.updateWorkerPos(coords.lat, coords.lng);
              },
              (denialMsg) => {
                showToast("Location sharing denied: " + denialMsg);
                isSharingGps = false;
                render();
              }
            );
            showToast("📡 Live GPS sharing started! Customer can now see your location.");
          } else {
            isSharingGps = false;
            tracking.stopPublishing();
            showToast("GPS sharing stopped.");
          }
          render();
        };
      }

      // 5. On-Spot OTP Verification (Worker submits PIN)
      const verifyOtpBtn = container.querySelector("#btn-verify-spot-otp");
      if (verifyOtpBtn) {
        verifyOtpBtn.onclick = async () => {
          const pin = container.querySelector("#otp-verify-input")?.value.trim();
          if (!pin || pin.length < 4) {
            showToast("Please enter the complete 4-digit PIN provided by customer");
            return;
          }

          verifyOtpBtn.disabled = true;
          const res = await api.verifyJobOtp(job.id, pin);
          if (res.success) {
            showToast("Site PIN verified! Work has commenced.");
            job.status = "in_progress";
            render();
          } else {
            showToast("Invalid PIN. Please check with customer.");
            verifyOtpBtn.disabled = false;
          }
        };
      }

      // 5b. Simulate Kaarigar entering PIN (for Seed workers in demo mode)
      const simOtpBtn = container.querySelector("#btn-simulate-otp");
      if (simOtpBtn) {
        simOtpBtn.onclick = async () => {
          simOtpBtn.disabled = true;
          simOtpBtn.innerText = "Verifying PIN...";
          const res = await api.verifyJobOtp(job.id, job.otp || "4829");
          if (res?.error) {
            showToast("PIN error: " + res.error);
            simOtpBtn.disabled = false;
            simOtpBtn.innerText = "⚡ Simulate Kaarigar Entering PIN (Demo)";
          } else {
            job.status = "in_progress";
            showToast("PIN verified! Kaarigar has commenced work on site.");
            render();
            // Start the in_progress stage in demo responder
            demoResponder.watchJob(job, (newStatus) => {
              job.status = newStatus;
              render();
            });
          }
        };
      }

      // 6. Worker Marks Completed
      const workerCompleteBtn = container.querySelector("#btn-worker-complete-job");
      if (workerCompleteBtn) {
        workerCompleteBtn.onclick = async () => {
          workerCompleteBtn.disabled = true;
          await api.advanceJob(job.id, "completed");
          showToast("Work marked complete! Customer has been notified to inspect and release payment.");
          job.status = "completed";
          render();
        };
      }

      // 7. Customer Approves Work & Releases Escrow
      const releaseBtn = container.querySelector("#btn-release-escrow");
      if (releaseBtn) {
        releaseBtn.onclick = async () => {
          if (!confirm(`Are you satisfied with the work and ready to release ₹${job.amount} to ${job.workerName}?`)) {
            return;
          }

          releaseBtn.disabled = true;
          releaseBtn.textContent = "Releasing Escrow Payment...";

          const res = await escrow.releaseEscrow(job.id);
          if (res.error) {
            showToast("Error releasing payment: " + res.error);
            releaseBtn.disabled = false;
            return;
          }

          showToast("🎉 Payment Released! ₹" + job.amount + " settled to " + job.workerName);
          job.status = "approved";
          job.escrowLocked = false;
          render();
        };
      }

      // 7b. Customer Cancels Booking
      const cancelBtn = container.querySelector("#btn-cancel-booking");
      if (cancelBtn) {
        cancelBtn.onclick = async () => {
          if (!confirm("Are you sure you want to cancel this booking? Any escrow hold will be refunded.")) {
            return;
          }
          cancelBtn.disabled = true;
          cancelBtn.textContent = "Cancelling...";
          demoResponder.stop();
          await api.advanceJob(job.id, "cancelled");
          showToast("Booking cancelled.");
          job.status = "cancelled";
          render();
        };
      }

      // 8. View Printable Receipt
      const receiptBtn = container.querySelector("#btn-view-receipt");
      if (receiptBtn) {
        receiptBtn.onclick = () => {
          openReceiptModal(job);
        };
      }

      // 9. Star Rating Submission
      let selectedRating = 5;
      const starBtns = container.querySelectorAll(".star-btn");
      starBtns.forEach(btn => {
        btn.onclick = () => {
          selectedRating = parseInt(btn.dataset.star);
          starBtns.forEach((b, idx) => {
            b.style.opacity = idx < selectedRating ? "1" : "0.3";
          });
        };
      });

      const submitReviewBtn = container.querySelector("#btn-submit-review");
      if (submitReviewBtn) {
        submitReviewBtn.onclick = async () => {
          submitReviewBtn.disabled = true;
          const comment = container.querySelector("#review-comment-input")?.value.trim() || "";
          
          const res = await api.submitReview({
            jobId: job.id,
            rating: selectedRating,
            comment: comment
          });

          if (res.success) {
            hasRated = true;
            showToast("Thank you for your rating! Trust score updated.");
            render();
          } else {
            showToast("Error saving rating: " + res.error);
            submitReviewBtn.disabled = false;
          }
        };
      }
    }

    // Subscribe to worker GPS updates if Customer
    if (isCustomer) {
      unsubTracking = tracking.subscribe(
        job.id,
        { lat: job.lat, lng: job.lng },
        (loc) => {
          if (mapHelper) mapHelper.updateWorkerPos(loc.lat, loc.lng);
          const etaEl = container.querySelector("#eta-display");
          if (etaEl) etaEl.textContent = `~${loc.eta_minutes} min`;
        }
      );
    }

    // Realtime Job Status listener
    unsubJobRealtime = realtime.subscribeJob(job.id, (updatedJob) => {
      if (updatedJob.status && updatedJob.status !== job.status) {
        job.status = updatedJob.status;
        render();
      }
    });

    render();
  },

  unmount() {
    demoResponder.stop();
    if (unsubTracking) unsubTracking();
    if (unsubJobRealtime) unsubJobRealtime();
    if (mapHelper) mapHelper.destroy();
  }
};

function openReceiptModal(job) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay active";
  modal.innerHTML = `
    <div class="modal-card card" style="max-width: 480px; padding: 24px;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px dashed var(--border-light); padding-bottom: 16px;">
        <h2 style="font-weight: 900; color: var(--saffron); letter-spacing: 1px;">NIRMAAN</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Official Verified Work Receipt</p>
        <div style="font-size: 0.72rem; color: var(--text-light); margin-top: 4px;">Receipt Ref: NRMN-${job.id.slice(0, 8).toUpperCase()}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.88rem; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Customer:</span>
          <strong>${escape(job.customerName)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Kaarigar:</span>
          <strong>${escape(job.workerName)} (${escape(job.workerRole)})</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Service:</span>
          <strong>${escape(job.jobTitle)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Location:</span>
          <span>${escape(job.location)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-light); padding-top: 8px;">
          <span style="color: var(--text-muted);">Payment Mode:</span>
          <span>Digital Escrow (Secured)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 900; color: var(--green); border-top: 2px solid var(--border-light); padding-top: 10px;">
          <span>Total Settled:</span>
          <span>₹${job.amount}</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <button id="btn-print-receipt" class="btn btn-primary btn-full btn-sm" style="font-weight: 700;">
          🖨️ Print Receipt
        </button>
        <button id="btn-close-receipt" class="btn btn-secondary btn-full btn-sm">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#btn-close-receipt").onclick = () => modal.remove();
  modal.querySelector("#btn-print-receipt").onclick = () => window.print();
}
