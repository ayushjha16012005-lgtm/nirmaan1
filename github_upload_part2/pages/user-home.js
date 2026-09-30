/* NIRMAAN User Home — Map-First Kaarigar Discovery */
import { TRADES, RADIUS_OPTIONS } from "../data/constants.js";
import { renderKaarigarCard } from "../components/kaarigar-card.js";
import { createMap } from "../components/map.js";
import { renderBottomNav } from "../components/bottom-nav.js";

let mapHelper = null;

export default {
  route: "#/user-home",
  title: "Find Kaarigars",

  async mount(container, ctx) {
    const { t, api, store } = ctx;
    renderBottomNav();

    let selectedTrade = "all";
    let selectedRadius = 5;
    let searchQuery = "";
    let selectedWorker = null;

    container.innerHTML = `
      <div class="container">
        
        <!-- Search & Filter Bar -->
        <div style="margin-bottom: 16px;">
          <div style="position: relative;">
            <input
              type="text"
              id="search-input"
              class="form-control"
              placeholder="${t("user.searchPlaceholder")}"
              style="padding-left: 44px; height: 50px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);"
            />
            <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.2rem;">🔍</span>
          </div>

          <!-- Trade Chips -->
          <div style="display: flex; gap: 8px; overflow-x: auto; padding: 12px 0 4px; scrollbar-width: none;">
            ${TRADES.map(tr => `
              <button class="radius-pill trade-pill ${tr.id === "all" ? "active" : ""}" data-trade="${tr.id}" style="white-space: nowrap; display: flex; align-items: center; gap: 6px; padding: 8px 16px;">
                <span>${tr.icon}</span>
                <span>${store.get("lang") === "hi" ? tr.label_hi : tr.label_en}</span>
              </button>
            `).join("")}
          </div>

          <!-- Radius Selector -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              📍 ${t("user.radius")}:
            </span>
            <div class="map-radius-pills" style="margin: 0;">
              ${RADIUS_OPTIONS.map(r => `
                <button class="radius-pill ${r === 5 ? "active" : ""}" data-radius="${r}">
                  ${r} km
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Interactive Map -->
        <div class="map-wrap" id="discovery-map"></div>

        <!-- Selected Kaarigar Popup Card (if clicked pin) -->
        <div id="selected-kaarigar-preview" style="margin: 16px 0; display: none;"></div>

        <!-- Projects Command Centre Banner -->
        <div class="card" style="margin: 20px 0; background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)); border: 1px solid var(--border-saffron); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <span class="badge badge-saffron" style="margin-bottom: 6px;">🏗️ ${t("projects.title")}</span>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Construction Command Centre</h3>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">Track Cement, Bricks, Labour mix & AI House Maps</p>
          </div>
          <a href="#/projects" class="btn btn-primary btn-sm" style="padding: 8px 18px;">Open Projects →</a>
        </div>

        <!-- Nearby Kaarigars List -->
        <div style="margin-top: 20px;">
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 14px; color: var(--text-main);">
            ${t("user.nearbyKaarigars")} (<span id="kaarigar-count">0</span>)
          </h3>
          <div id="kaarigars-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px;"></div>
        </div>

      </div>
    `;

    // Initialize Map
    const mapEl = container.querySelector("#discovery-map");
    mapHelper = createMap(mapEl, { center: [28.6280, 77.3649], zoom: 13 });

    async function updateListAndMap() {
      const { data: workers } = await api.listWorkers({
        trade: selectedTrade,
        radius: selectedRadius
      });

      const filtered = (workers || []).filter(w => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return w.name.toLowerCase().includes(q) ||
               w.role.toLowerCase().includes(q) ||
               (w.skills || []).some(s => s.toLowerCase().includes(q));
      });

      container.querySelector("#kaarigar-count").textContent = filtered.length;

      // Update Map Pins
      mapHelper.addKaarigarMarkers(filtered, (worker) => {
        showWorkerPreview(worker);
      });

      // Update Cards Grid
      const listEl = container.querySelector("#kaarigars-list");
      listEl.innerHTML = "";

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-muted);">
            <p style="font-size: 1.5rem;">🔍</p>
            <p style="margin-top: 8px; font-weight: 600;">No Kaarigars found in this radius or trade.</p>
            <p style="font-size: 0.8rem;">Try expanding the radius to 10 km.</p>
          </div>
        `;
        return;
      }

      filtered.forEach(w => {
        const card = renderKaarigarCard(w, {
          onBook: (worker) => { window.location.hash = `#/hire/${worker.id}`; },
          onView: (worker) => { window.location.hash = `#/kaarigar/${worker.id}`; }
        });
        listEl.appendChild(card);
      });
    }

    function showWorkerPreview(worker) {
      const previewEl = container.querySelector("#selected-kaarigar-preview");
      previewEl.style.display = "block";
      previewEl.innerHTML = "";
      const card = renderKaarigarCard(worker);
      previewEl.appendChild(card);
      previewEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Trade clicks
    container.querySelectorAll(".trade-pill").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".trade-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedTrade = btn.dataset.trade;
        updateListAndMap();
      };
    });

    // Radius clicks
    container.querySelectorAll(".map-radius-pills button").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".map-radius-pills button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedRadius = parseInt(btn.dataset.radius);
        updateListAndMap();
      };
    });

    // Search input
    container.querySelector("#search-input").oninput = (e) => {
      searchQuery = e.target.value.trim();
      updateListAndMap();
    };

    updateListAndMap();
  },

  unmount() {
    if (mapHelper) {
      mapHelper.destroy();
      mapHelper = null;
    }
  }
};
