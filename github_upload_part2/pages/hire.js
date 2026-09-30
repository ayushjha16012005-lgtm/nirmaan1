/* NIRMAAN Hiring, Identity Verification & Escrow Lock Page */
import { escape, showToast } from "../core/ui.js";
import { escrow } from "../services/escrow.js";

export default {
  route: "#/hire/:id",
  title: "Hire Kaarigar & Lock Escrow",

  async mount(container, ctx) {
    const { params, api, t, store } = ctx;
    const workerId = params[0] || "k-ramesh";

    const { data: worker } = await api.getWorker(workerId);
    if (!worker) {
      container.innerHTML = `<div class="container" style="padding:40px; text-align:center;"><h3>Worker not found</h3><a href="#/user-home" class="btn btn-secondary">Back</a></div>`;
      return;
    }

    let days = 2;
    let rate = worker.rate;
    let jobTitle = "Boundary Wall Construction & Plastering";
    let location = "Noida Sector 62, Plot 44";

    function getEscrowTotal() {
      return days * rate;
    }

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 50px;">
        
        <a href="#/kaarigar/${worker.id}" class="btn btn-secondary btn-sm" style="margin-bottom: 16px;">
          ← ${t("common.back")}
        </a>

        <div class="card" style="padding: 24px;">
          
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
              ${worker.avatar || "👨‍🔧"}
            </div>
            <div>
              <span class="badge badge-saffron" style="font-size: 0.72rem; margin-bottom: 4px;">Hiring Direct</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">${escape(worker.name)}</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${escape(worker.role)} · ₹${worker.rate}/${worker.rateType}</p>
            </div>
          </div>

          <!-- Step 1: Work Details -->
          <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-bottom: 12px;">1. Work Scope & Schedule</h4>
          
          <div class="form-group">
            <label class="form-label">Job Title / Work Description</label>
            <input type="text" id="hire-job-title" class="form-control" value="${jobTitle}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Work Site Location</label>
            <input type="text" id="hire-location" class="form-control" value="${location}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Expected Duration (${worker.rateType === "day" ? "Days" : "Hours"})</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="number" id="hire-days" class="form-control" value="${days}" min="1" max="60" style="width: 100px; font-size: 1.1rem; font-weight: 800;" />
              <span style="font-size: 0.85rem; color: var(--text-muted);">Total Wage: <strong id="total-wage-display" style="color: var(--saffron); font-size: 1.1rem;">₹${getEscrowTotal()}</strong></span>
            </div>
          </div>

          <!-- Step 2: Digital e-Affidavit & Terms -->
          <div style="margin: 20px 0; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 1.2rem;">📜</span>
              <strong style="font-size: 0.88rem; color: var(--text-main);">Nirmaan Digital e-Affidavit</strong>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
              Mutual agreement ensuring 100% direct wage transfer upon customer sign-off, safety protocol adherence on site, and dispute resolution via Nirmaan Arbitrator.
            </p>
            <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.82rem; font-weight: 700; color: var(--text-main); cursor: pointer;">
              <input type="checkbox" id="affidavit-check" checked /> I agree to Digital e-Affidavit Terms
            </label>
          </div>

          <!-- Step 3: Escrow Payment Lock -->
          <div style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(45, 106, 79, 0.02)); border: 1.5px solid var(--green); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="badge badge-verified" style="margin-bottom: 4px;">🛡️ Protected Escrow Lock</span>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--green);" id="escrow-lock-amount">₹${getEscrowTotal()}</div>
              </div>
              <span style="font-size: 2rem;">🔒</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">
              Your funds will be locked in the secure Nirmaan Escrow Vault. Money is ONLY released to Kaarigar after you verify the work.
            </p>
          </div>

          <!-- Action Button -->
          <button id="btn-lock-escrow-hire" class="btn btn-success btn-full btn-lg" style="box-shadow: 0 8px 24px rgba(45, 106, 79, 0.3); font-size: 1.05rem;">
            🔒 Lock Escrow & Dispatch Kaarigar
          </button>

        </div>

      </div>
    `;

    const daysInput = container.querySelector("#hire-days");
    const wageDisplay = container.querySelector("#total-wage-display");
    const escrowDisplay = container.querySelector("#escrow-lock-amount");

    daysInput.oninput = (e) => {
      days = Math.max(1, parseInt(e.target.value) || 1);
      const tot = getEscrowTotal();
      wageDisplay.textContent = `₹${tot}`;
      escrowDisplay.textContent = `₹${tot}`;
    };

    container.querySelector("#btn-lock-escrow-hire").onclick = async () => {
      const isAffidavit = container.querySelector("#affidavit-check").checked;
      if (!isAffidavit) {
        showToast("Please agree to the digital e-affidavit");
        return;
      }

      showToast("Locking Escrow & Dispatching Kaarigar... 🔒");

      const title = container.querySelector("#hire-job-title").value.trim() || jobTitle;
      const loc = container.querySelector("#hire-location").value.trim() || location;

      const { data: job, error } = await api.createJob({
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        jobTitle: title,
        location: loc,
        rate: worker.rate,
        rateType: worker.rateType,
        days: days,
        amount: getEscrowTotal()
      });

      if (error) {
        showToast("Error creating job: " + error);
        return;
      }

      await escrow.lockEscrow(job.id, job.amount);
      showToast("Escrow Locked! Kaarigar is on the way 🛵");

      setTimeout(() => {
        window.location.hash = `#/track/${job.id}`;
      }, 500);
    };
  },

  unmount() {}
};
