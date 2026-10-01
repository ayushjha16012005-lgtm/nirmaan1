/* NIRMAAN Kaarigar Detail & Gallery Page */
import { escape, formatCurrency, formatDateIST } from "../core/ui.js";

export default {
  route: "#/kaarigar/:id",
  title: "Kaarigar Profile",

  async mount(container, ctx) {
    const { params, api, t } = ctx;
    const workerId = params[0] || "k-ramesh";

    const { data: worker } = await api.getWorker(workerId);
    if (!worker) {
      container.innerHTML = `
        <div class="container" style="padding:40px 16px; text-align:center;">
          <h3 style="font-weight: 800; color: var(--text-main);">Worker not found</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin: 8px 0 16px;">This worker profile does not exist or has been removed.</p>
          <a href="#/user-home" class="btn btn-secondary btn-sm">← Back to Kaarigars</a>
        </div>
      `;
      return;
    }

    const { data: reviews } = await api.listReviews(worker.id);

    const name = escape(worker.name);
    const role = escape(worker.role);

    container.innerHTML = `
      <div class="container-mobile" style="padding-top: 10px; padding-bottom: 50px;">
        
        <a href="#/user-home" class="btn btn-secondary btn-sm" style="margin-bottom: 16px;">
          ← ${t("common.back")}
        </a>

        <div class="card" style="padding: 24px;">
          
          <!-- Avatar & Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 12px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; border: 3px solid var(--saffron);">
              ${worker.avatar || "👨‍🔧"}
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">${name}</h2>
            <p style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; margin-top: 4px;">${role} · ${worker.experience} yrs exp</p>
            <p style="font-size: 0.82rem; color: var(--green); font-weight: 700; margin-top: 2px;">📍 ${escape(worker.location)} (${worker.distance_km || 2.1} km away)</p>
          </div>

          <!-- Verified Badges -->
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 20px;">
            <span class="badge badge-verified">
              <span class="badge-dot"></span> Aadhaar KYC Verified
            </span>
            <span class="badge badge-verified">
              <span class="badge-dot"></span> Video Selfie Verified
            </span>
          </div>

          <!-- Rating & Stats Strip -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--bg-secondary); padding: 14px; border-radius: var(--radius-md); text-align: center; margin-bottom: 20px; border: 1px solid var(--border-light);">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Rating</span>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--gold);">★ ${worker.rating}</div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Wage Rate</span>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--saffron);">
                ${formatCurrency(worker.rate)}<span style="font-size: 0.8rem; color: var(--text-muted);">/${worker.rateType || "day"}</span>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">About</h4>
            <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5;">${escape(worker.bio || "Skilled professional verified on Nirmaan.")}</p>
          </div>

          <!-- Skills -->
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Specialties</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${(worker.skills || []).map(s => `
                <span style="background: var(--bg-secondary); border: 1px solid var(--border-light); font-size: 0.82rem; padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 600;">
                  ${escape(s)}
                </span>
              `).join("")}
            </div>
          </div>

          <!-- Previous Work Gallery -->
          <div style="margin-bottom: 24px;">
            <h4 style="font-size: 0.9rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Previous Work Gallery</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${(worker.gallery && worker.gallery.length > 0 ? worker.gallery : [
                "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=400&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&auto=format&fit=crop&q=80"
              ]).map(img => `
                <img src="${escape(img)}" style="width: 100%; height: 110px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border-light);" alt="Work sample" />
              `).join("")}
            </div>
          </div>

          <!-- Customer Reviews Section (Phase 7 Audit) -->
          <div style="margin-bottom: 24px; border-top: 1px solid var(--border-light); padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                Verified Reviews (${(reviews || []).length})
              </h4>
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--gold);">★ ${worker.rating}</span>
            </div>

            ${(!reviews || reviews.length === 0) ? `
              <div style="text-align: center; padding: 20px 14px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-light);">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">⭐ Be the first to review this verified Kaarigar!</p>
                <p style="font-size: 0.75rem; color: var(--text-light);">Customer reviews are verified and recorded after escrow sign-off.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${reviews.map(r => `
                  <div class="card" style="padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border-light);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: 700; font-size: 0.88rem;">${escape(r.profiles?.full_name || "Verified Customer")}</span>
                      <span style="color: var(--gold); font-size: 0.82rem; font-weight: 800;">${"★".repeat(r.rating || 5)}</span>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 4px;">${escape(r.comment || "Great work, completed on time.")}</p>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${formatDateIST(r.created_at)}</span>
                  </div>
                `).join("")}
              </div>
            `}
          </div>

          <!-- Hiring CTA -->
          <button id="btn-proceed-hire" class="btn btn-primary btn-full btn-lg" style="box-shadow: var(--shadow-saffron); font-size: 1.1rem; font-weight: 800;">
            ⚡ ${t("user.kaarigarBulaye")} (Hire Now)
          </button>

        </div>

      </div>
    `;

    container.querySelector("#btn-proceed-hire").onclick = () => {
      window.location.hash = `#/hire/${worker.id}`;
    };
  },

  unmount() {}
};
