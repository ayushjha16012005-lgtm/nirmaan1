/* NIRMAAN Projects — Construction Command Centre Page */
import { escape, showToast } from "../core/ui.js";
import { renderBottomNav } from "../components/bottom-nav.js";

export default {
  route: "#/projects",
  title: "Projects Command Centre",

  async mount(container, ctx) {
    const { t, api } = ctx;
    renderBottomNav();

    const { data: projects } = await api.getProjects();
    const project = (projects && projects[0]) || {};

    let activeTab = "resources"; // resources | labour | progress | aiMap | engineer

    function render() {
      container.innerHTML = `
        <div class="container" style="padding-bottom: 60px;">
          
          <!-- Projects Header -->
          <div style="margin-bottom: 20px;">
            <span class="badge badge-saffron" style="margin-bottom: 6px;">Construction Command Centre</span>
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">
              ${escape(project.title || "Dream Villa — 2400 sq.ft Construction")}
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              📍 ${escape(project.location || "Noida Sector 62")} · Overall Progress: <strong style="color:var(--green);">${project.progressPct || 65}%</strong>
            </p>

            <!-- Overall Progress Bar -->
            <div style="width: 100%; height: 8px; background: var(--border-light); border-radius: 4px; margin-top: 10px; overflow: hidden;">
              <div style="width: ${project.progressPct || 65}%; height: 100%; background: linear-gradient(90deg, var(--saffron), var(--green));"></div>
            </div>
          </div>

          <!-- Feature Navigation Tabs -->
          <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px; scrollbar-width: none;">
            <button class="radius-pill project-tab-btn ${activeTab === "resources" ? "active" : ""}" data-tab="resources">
              🧱 Resource Management
            </button>
            <button class="radius-pill project-tab-btn ${activeTab === "labour" ? "active" : ""}" data-tab="labour">
              👷 Labour Planning
            </button>
            <button class="radius-pill project-tab-btn ${activeTab === "progress" ? "active" : ""}" data-tab="progress">
              📸 Daily Progress
            </button>
            <button class="radius-pill project-tab-btn ${activeTab === "aiMap" ? "active" : ""}" data-tab="aiMap">
              🤖 AI House Map Maker
            </button>
            <button class="radius-pill project-tab-btn ${activeTab === "engineer" ? "active" : ""}" data-tab="engineer">
              📐 Civil Engineer Support
            </button>
          </div>

          <!-- TAB CONTENT -->
          <div id="project-tab-content">
            ${renderTabContent(activeTab, project, t)}
          </div>

        </div>
      `;

      // Bind Tab switches
      container.querySelectorAll(".project-tab-btn").forEach(btn => {
        btn.onclick = () => {
          activeTab = btn.dataset.tab;
          render();
        };
      });

      bindTabInteractions(activeTab, container);
    }

    render();
  },

  unmount() {}
};

function renderTabContent(tab, project, t) {
  if (tab === "resources") {
    const res = project.resources || {
      cement_bags: { used: 240, total: 350 },
      bricks: { used: 18000, total: 25000 },
      sand_tons: { used: 14, total: 20 },
      steel_kg: { used: 3200, total: 4000 }
    };

    return `
      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 8px;">Resource & Material Usage Tracker</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Monitor site material stock to prevent theft, waste, and supply delays.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          
          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700;">Cement Bags (UltraTech)</span>
              <span style="font-size: 1.3rem;">🏗️</span>
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--saffron);">
              ${res.cement_bags.used} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${res.cement_bags.total} bags</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; margin-top: 8px; overflow: hidden;">
              <div style="width: ${(res.cement_bags.used / res.cement_bags.total) * 100}%; height: 100%; background: var(--saffron);"></div>
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700;">Red Clay Bricks</span>
              <span style="font-size: 1.3rem;">🧱</span>
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--saffron);">
              ${res.bricks.used.toLocaleString()} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${res.bricks.total.toLocaleString()}</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; margin-top: 8px; overflow: hidden;">
              <div style="width: ${(res.bricks.used / res.bricks.total) * 100}%; height: 100%; background: var(--saffron);"></div>
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700;">River Sand</span>
              <span style="font-size: 1.3rem;">⏳</span>
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--saffron);">
              ${res.sand_tons.used} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${res.sand_tons.total} Tons</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; margin-top: 8px; overflow: hidden;">
              <div style="width: ${(res.sand_tons.used / res.sand_tons.total) * 100}%; height: 100%; background: var(--saffron);"></div>
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700;">TMT Steel Rods</span>
              <span style="font-size: 1.3rem;">🔩</span>
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--saffron);">
              ${res.steel_kg.used.toLocaleString()} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${res.steel_kg.total.toLocaleString()} kg</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; margin-top: 8px; overflow: hidden;">
              <div style="width: ${(res.steel_kg.used / res.steel_kg.total) * 100}%; height: 100%; background: var(--saffron);"></div>
            </div>
          </div>

        </div>

        <button class="btn btn-secondary btn-sm" id="btn-add-resource" style="margin-top: 20px;">
          + Log New Material Delivery
        </button>
      </div>
    `;
  }

  if (tab === "labour") {
    return `
      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">Smart Labour Mix & Dynamic Planning</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Configure required worker crew and calculate daily wages automatically.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
          
          <div class="card" style="background: var(--bg-secondary); padding: 18px;">
            <h4 style="font-weight: 800; margin-bottom: 12px;">Active Crew Mix</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>🧱 Senior Raj Mistri (2x @ ₹850/day)</span>
              <strong>₹1,700</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>🤝 Beldar / Helpers (4x @ ₹500/day)</span>
              <strong>₹2,000</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>⚡ Electrician (1x @ ₹120/hr x 4 hrs)</span>
              <strong>₹480</strong>
            </div>
            <div style="border-top: 1px solid var(--border-light); padding-top: 10px; display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; color: var(--saffron);">
              <span>Total Daily Labour Cost:</span>
              <span>₹4,180 / day</span>
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 18px;">
            <h4 style="font-weight: 800; margin-bottom: 8px;">Dynamic Surge Estimator</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Market rate intelligence based on NCR weather, crop season & locality demand.</p>
            <div class="badge badge-verified" style="margin-bottom: 10px;">⚡ Normal Market Rates Active</div>
            <p style="font-size: 0.82rem; color: var(--text-main);">Direct booking saves ~₹800/day compared to local thekedar contractor margin.</p>
          </div>

        </div>

        <a href="#/user-home" class="btn btn-primary">Add More Kaarigars to Project</a>
      </div>
    `;
  }

  if (tab === "progress") {
    return `
      <div class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800;">Daily Progress & Photo Verification</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Inspect work milestones with timestamped site photos.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-upload-site-photo">📷 Upload Site Photo</button>
        </div>

        <!-- Milestones Checklist -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          ${(project.timeline || []).map(t => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">${t.done ? "✅" : "⏳"}</span>
                <span style="font-weight: 700; ${t.done ? "text-decoration: line-through; color: var(--text-muted);" : "color: var(--text-main);"}">${escape(t.step)}</span>
              </div>
              <span class="badge ${t.done ? "badge-verified" : "badge-pending"}">${t.done ? "Completed" : "In Progress"}</span>
            </div>
          `).join("")}
        </div>

        <!-- Progress Photos Gallery -->
        <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 12px;">Verified Site Photos</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
          <img src="https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=400&auto=format&fit=crop&q=80" style="width: 100%; height: 130px; object-fit: cover; border-radius: var(--radius-md);" alt="Site photo" />
          <img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&auto=format&fit=crop&q=80" style="width: 100%; height: 130px; object-fit: cover; border-radius: var(--radius-md);" alt="Site photo" />
        </div>
      </div>
    `;
  }

  if (tab === "aiMap") {
    return `
      <div class="card" style="padding: 24px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 1.6rem;">🤖</span>
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">AI House Map & Floor Plan Generator</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Enter your plot dimensions to generate Vastu-compliant architectural layouts.</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label">Plot Width (ft)</label>
            <input type="number" id="plot-width" class="form-control" value="30" />
          </div>
          <div class="form-group">
            <label class="form-label">Plot Length (ft)</label>
            <input type="number" id="plot-length" class="form-control" value="50" />
          </div>
          <div class="form-group">
            <label class="form-label">Floors (G+)</label>
            <select id="plot-floors" class="form-control">
              <option value="1">Ground Floor (1BHK/2BHK)</option>
              <option value="2" selected>G + 1 (Duplex 3BHK)</option>
              <option value="3">G + 2 (4BHK + Rental)</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary btn-full" id="btn-generate-ai-map" style="margin-bottom: 24px;">
          ✨ Generate Multiple AI Floor Plans
        </button>

        <div id="ai-map-results" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          
          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--saffron);">Option A — Modern Vastu 3BHK</strong>
              <span class="badge badge-verified">North Facing</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">1500 sq.ft covered area · 3 Bedrooms, Modular Kitchen, Open Courtyard.</p>
            <div style="height: 140px; background: #222; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px solid var(--border-light);">
              [2D Architectural Schematic: 30'x50']
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--saffron);">Option B — Maximum Space Utilization</strong>
              <span class="badge badge-verified">East Facing</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Spacious Living hall, Attached Bathrooms, Parking Portico.</p>
            <div style="height: 140px; background: #222; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px solid var(--border-light);">
              [2D Architectural Schematic: 30'x50']
            </div>
          </div>

        </div>
      </div>
    `;
  }

  if (tab === "engineer") {
    return `
      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">Certified Civil Engineer Support</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Book licensed structural engineers to review foundation load calculations, beam casting, and government approvals.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          
          <div class="card" style="background: var(--bg-secondary); padding: 18px;">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--saffron-glow); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                👨‍💼
              </div>
              <div>
                <h4 style="font-weight: 800;">Er. Ashish Saxena, M.Tech</h4>
                <p style="font-size: 0.78rem; color: var(--text-muted);">Licensed Structural Engineer · 16 yrs exp</p>
              </div>
            </div>
            <div class="badge badge-verified" style="margin-bottom: 12px;">IIT Roorkee Alumnus · Certified</div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">Specialized in residential earthquake-resistant structure design & beam inspection.</p>
            <button class="btn btn-primary btn-sm btn-full" onclick="alert('Civil Engineer consultation request sent!')">Book Site Inspection (₹1,500)</button>
          </div>

        </div>
      </div>
    `;
  }

  return "";
}

function bindTabInteractions(tab, container) {
  if (tab === "resources") {
    const btn = container.querySelector("#btn-add-resource");
    if (btn) {
      btn.onclick = () => {
        showToast("Logged new delivery: 50 Cement Bags added to inventory!");
      };
    }
  }
  if (tab === "progress") {
    const btn = container.querySelector("#btn-upload-site-photo");
    if (btn) {
      btn.onclick = () => {
        showToast("Site photo uploaded and timestamped to project timeline!");
      };
    }
  }
  if (tab === "aiMap") {
    const btn = container.querySelector("#btn-generate-ai-map");
    if (btn) {
      btn.onclick = () => {
        showToast("Generating Vastu-compliant 2D/3D layouts... ✨");
      };
    }
  }
}
