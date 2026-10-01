/* NIRMAAN Hiring & Job Dispatch Page */
import { escape, showToast } from "../core/ui.js";
import { api } from "../services/api.js";
import { store } from "../core/store.js";

export default {
  route: "#/hire/:id",
  title: "Hire Kaarigar",

  async mount(container, ctx) {
    const { params, t } = ctx;
    const workerId = params[0] || "k-ramesh";

    const { data: worker, error: workerErr } = await api.getWorker(workerId);
    if (!worker || workerErr) {
      container.innerHTML = `
        <div class="container" style="padding:40px 16px; text-align:center;">
          <h3 style="color:var(--text-main); font-weight:800;">Worker not found</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:8px 0 16px;">This worker profile could not be loaded.</p>
          <a href="#/user-home" class="btn btn-secondary btn-sm">← Back to Kaarigars</a>
        </div>
      `;
      return;
    }

    let days = 2;
    let rate = Number(worker.rate) || 850;
    let jobTitle = `${worker.role || "Construction"} Work`;
    let location = "Noida Sector 62, Plot 44";
    let isSubmitting = false;

    function getEstimatedTotal() {
      return days * rate;
    }

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 60px;">
        
        <a href="#/kaarigar/${worker.id}" class="btn btn-secondary btn-sm" style="margin-bottom: 16px;">
          ← ${t("common.back")}
        </a>

        <div class="card" style="padding: 24px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
          
          <!-- Worker Summary Header -->
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--border-light); padding-bottom: 16px;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 2px solid var(--saffron);">
              ${worker.avatar || "👨‍🔧"}
            </div>
            <div>
              <span class="badge badge-saffron" style="font-size: 0.72rem; margin-bottom: 4px;">Direct Booking</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">${escape(worker.name)}</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${escape(worker.role)} · ₹${worker.rate}/${worker.rateType || "day"}</p>
            </div>
          </div>

          <form id="hire-form" onsubmit="return false;">
            
            <!-- Step 1: Work Details -->
            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-bottom: 14px;">1. Work Scope & Location</h4>
            
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label" for="hire-job-title" style="font-weight: 700;">Job Title / Work Scope *</label>
              <input type="text" id="hire-job-title" class="form-control" value="${escape(jobTitle)}" required />
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label" for="hire-description" style="font-weight: 700;">Detailed Instructions (Optional)</label>
              <textarea id="hire-description" class="form-control" rows="2" placeholder="e.g. 50 ft boundary wall construction and cement plastering on outer side"></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label" for="hire-location" style="font-weight: 700;">Work Site Address *</label>
              <input type="text" id="hire-location" class="form-control" value="${escape(location)}" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
              <div class="form-group">
                <label class="form-label" for="hire-days" style="font-weight: 700;">Duration (${worker.rateType === "hour" ? "Hours" : "Days"})</label>
                <input type="number" id="hire-days" class="form-control" value="${days}" min="1" max="60" style="font-weight: 800; font-size: 1.1rem;" />
              </div>
              <div class="form-group">
                <label class="form-label" for="hire-rate-display" style="font-weight: 700;">Wage Rate</label>
                <input type="text" id="hire-rate-display" class="form-control" value="₹${rate}/${worker.rateType || "day"}" disabled style="background: var(--bg-secondary); font-weight: 800;" />
              </div>
            </div>

            <!-- Step 2: Digital e-Affidavit & Mutual Terms -->
            <div style="margin: 18px 0; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.2rem;">📜</span>
                <strong style="font-size: 0.88rem; color: var(--text-main);">Digital e-Affidavit Agreement</strong>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                Mutual commitment ensuring direct wage release upon milestone verification, adherence to on-site safety, and zero hidden thekedar commission.
              </p>
              <label style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.82rem; font-weight: 700; color: var(--text-main); cursor: pointer;">
                <input type="checkbox" id="affidavit-check" checked /> I agree to the Digital e-Affidavit Terms
              </label>
            </div>

            <!-- Step 3: Wage & Escrow Summary -->
            <div style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(45, 106, 79, 0.02)); border: 1.5px solid var(--green); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span class="badge badge-verified" style="margin-bottom: 4px;">🛡️ Wage Protection</span>
                  <div style="font-size: 1.5rem; font-weight: 800; color: var(--green);" id="escrow-lock-amount">
                    ₹${getEstimatedTotal()}
                  </div>
                </div>
                <span style="font-size: 2rem;">🔒</span>
              </div>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin-top: 8px;">
                Payment held securely until you inspect and approve the work.
              </p>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              id="btn-confirm-hire" 
              class="btn btn-success btn-full btn-lg" 
              style="font-size: 1.05rem; font-weight: 800;"
            >
              🔒 Send Job Offer to Kaarigar
            </button>

          </form>

        </div>

      </div>
    `;

    const daysInput = container.querySelector("#hire-days");
    const escrowDisplay = container.querySelector("#escrow-lock-amount");
    const hireForm = container.querySelector("#hire-form");
    const submitBtn = container.querySelector("#btn-confirm-hire");

    daysInput.oninput = (e) => {
      days = Math.max(1, parseInt(e.target.value) || 1);
      escrowDisplay.textContent = `₹${getEstimatedTotal()}`;
    };

    hireForm.onsubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const isAffidavit = container.querySelector("#affidavit-check").checked;
      if (!isAffidavit) {
        showToast("Please agree to the digital e-affidavit terms");
        return;
      }

      const title = container.querySelector("#hire-job-title").value.trim() || jobTitle;
      const desc = container.querySelector("#hire-description").value.trim();
      const loc = container.querySelector("#hire-location").value.trim() || location;

      isSubmitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Dispatching Offer...";

      const { data: job, error } = await api.createJob({
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        jobTitle: title,
        description: desc,
        location: loc,
        trade: worker.trade || "mason",
        days: days,
        rate: rate,
        amount: getEstimatedTotal()
      });

      if (error) {
        showToast("Error creating booking: " + error);
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "🔒 Send Job Offer to Kaarigar";
        return;
      }

      showToast("Job offer sent to Kaarigar! 📨");

      setTimeout(() => {
        window.location.hash = `#/track/${job.id}`;
      }, 500);
    };
  },

  unmount() {}
};
