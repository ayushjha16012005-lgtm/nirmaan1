/* NIRMAAN Kaarigar Card Component (Pure component) */
import { escape } from "../core/ui.js";
import { t } from "../core/i18n.js";

export function renderKaarigarCard(worker, { onBook, onView } = {}) {
  const card = document.createElement("div");
  card.className = "card card-clickable nirmaan-kaarigar-card";
  card.style.cssText = "display: flex; flex-direction: column; justify-content: space-between; gap: 14px;";

  const name = escape(worker.name);
  const role = escape(worker.role);
  const rateUnit = worker.rateType === "day" ? t("user.rateDay") : t("user.rateHour");
  const distance = worker.distance_km ? `${worker.distance_km} km away` : worker.location;

  card.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            ${worker.avatar || "👨‍🔧"}
          </div>
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">${name}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${role} · ${worker.experience} yrs</span>
          </div>
        </div>
        ${worker.verified
          ? `<span class="badge badge-verified"><span class="badge-dot"></span>${t("user.verified")}</span>`
          : `<span class="badge badge-pending"><span class="badge-dot"></span>${t("user.unverified")}</span>`
        }
      </div>

      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; margin-bottom: 10px;">
        <span style="color: var(--gold); font-weight: 800;">★ ${worker.rating}</span>
        <span style="color: var(--text-muted);">(${worker.reviewsCount || 0} reviews)</span>
        <span style="color: var(--text-muted);">·</span>
        <span style="color: var(--green); font-weight: 700;">📍 ${escape(distance)}</span>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
        ${(worker.skills || []).slice(0, 3).map(s => `
          <span style="background: var(--bg-secondary); border: 1px solid var(--border-light); font-size: 0.75rem; padding: 3px 8px; border-radius: var(--radius-sm); color: var(--text-muted); font-weight: 600;">
            ${escape(s)}
          </span>
        `).join("")}
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
      <div>
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Wage Rate</span>
        <div style="font-size: 1.2rem; font-weight: 800; color: var(--saffron);">
          ₹${worker.rate}<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${rateUnit}</span>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary btn-sm" id="btn-view-profile">${t("user.viewProfile")}</button>
        <button class="btn btn-primary btn-sm" id="btn-book-kaarigar">${t("user.kaarigarBulaye")}</button>
      </div>
    </div>
  `;

  card.querySelector("#btn-view-profile").onclick = (e) => {
    e.stopPropagation();
    if (onView) onView(worker);
    else window.location.hash = `#/kaarigar/${worker.id}`;
  };

  card.querySelector("#btn-book-kaarigar").onclick = (e) => {
    e.stopPropagation();
    if (onBook) onBook(worker);
    else window.location.hash = `#/hire/${worker.id}`;
  };

  card.onclick = () => {
    if (onView) onView(worker);
    else window.location.hash = `#/kaarigar/${worker.id}`;
  };

  return card;
}
