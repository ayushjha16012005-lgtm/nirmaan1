/* NIRMAAN Projects — Construction Command Centre Page */
import { escape, showToast } from "../core/ui.js";
import { renderBottomNav } from "../components/bottom-nav.js";
import { pms } from "../services/pms.js";

export default {
  route: "#/projects",
  title: "Projects Command Centre",

  async mount(container, ctx) {
    const { t } = ctx;
    renderBottomNav();

    // Load full project with materials, tasks, and progress from PMS service
    let project = {};
    try {
      const { data } = await pms.getProject();
      project = data || {};
    } catch (e) {
      console.warn("Failed to load project from PMS:", e);
    }

    let activeTab = "resources"; // resources | labour | progress | aiMap | engineer
    let isAddingMaterial = false;
    let isUploadingPhoto = false;

    function render() {
      const progressPct = project.progressPct ?? project.progress_pct ?? 65;

      container.innerHTML = `
        <div class="container" style="padding-bottom: 70px;">
          
          <!-- Projects Header -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div>
                <span class="badge badge-saffron" style="margin-bottom: 6px;">Construction Command Centre</span>
                <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">
                  ${escape(project.title || "Dream Villa — 2400 sq.ft Construction")}
                </h1>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                  📍 ${escape(project.location || "Noida Sector 62")} · Overall Progress: <strong id="pms-progress-val" style="color:var(--green);">${progressPct}%</strong>
                </p>
              </div>
              <span class="badge ${project.status === "completed" ? "badge-verified" : "badge-saffron"}" style="white-space: nowrap;">
                ${project.status === "completed" ? "Completed" : "Active Site"}
              </span>
            </div>

            <!-- Overall Progress Bar -->
            <div style="width: 100%; height: 8px; background: var(--border-light); border-radius: 4px; margin-top: 10px; overflow: hidden;">
              <div id="pms-progress-bar" style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, var(--saffron), var(--green)); transition: width 0.3s ease;"></div>
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
            ${renderTabContent(activeTab, project, t, isAddingMaterial, isUploadingPhoto)}
          </div>

          <!-- Hidden photo upload input -->
          <input type="file" id="pms-site-photo-input" accept="image/*" capture="environment" style="display: none;" />

        </div>
      `;

      // Bind Tab switches
      container.querySelectorAll(".project-tab-btn").forEach(btn => {
        btn.onclick = () => {
          activeTab = btn.dataset.tab;
          isAddingMaterial = false;
          render();
        };
      });

      bindTabInteractions();
    }

    function bindTabInteractions() {
      // 1. Resources Tab
      if (activeTab === "resources") {
        const addBtn = container.querySelector("#btn-add-resource");
        if (addBtn) {
          addBtn.onclick = () => {
            isAddingMaterial = true;
            render();
          };
        }

        const cancelBtn = container.querySelector("#btn-cancel-material");
        if (cancelBtn) {
          cancelBtn.onclick = () => {
            isAddingMaterial = false;
            render();
          };
        }

        const form = container.querySelector("#form-new-material");
        if (form) {
          form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector("button[type='submit']");
            submitBtn.disabled = true;
            submitBtn.innerText = "Logging...";

            const name = form.querySelector("#mat-name")?.value.trim();
            const category = form.querySelector("#mat-category")?.value;
            const qty = Number(form.querySelector("#mat-qty")?.value);
            const unit = form.querySelector("#mat-unit")?.value.trim();

            if (!name || !qty || qty <= 0) {
              showToast("Please enter a valid material name and quantity");
              submitBtn.disabled = false;
              submitBtn.innerText = "Log Material Delivery";
              return;
            }

            try {
              const { data: newMat } = await pms.logMaterialDelivery(project.id, {
                name,
                category,
                qty,
                unit
              });

              if (newMat) {
                project.materials = [newMat, ...(project.materials || [])];
                showToast(`✅ Logged ${qty} ${unit} of ${name} to site inventory!`);
              }
            } catch (err) {
              showToast("Failed to log material delivery: " + err.message);
            } finally {
              isAddingMaterial = false;
              render();
            }
          };
        }
      }

      // 2. Progress Tab
      if (activeTab === "progress") {
        // Toggle Task
        container.querySelectorAll(".pms-task-toggle").forEach(checkbox => {
          checkbox.onchange = async () => {
            const taskId = checkbox.dataset.taskId;
            const isCompleted = checkbox.checked;

            await pms.toggleTask(project.id, taskId, isCompleted);

            // Update in-memory project state
            const target = (project.tasks || []).find(t => t.id === taskId);
            if (target) target.completed = isCompleted;

            const total = project.tasks?.length || 1;
            const comp = project.tasks?.filter(t => t.completed).length || 0;
            const newPct = Math.round((comp / total) * 100);
            project.progressPct = newPct;

            const progBar = container.querySelector("#pms-progress-bar");
            const progVal = container.querySelector("#pms-progress-val");
            if (progBar) progBar.style.width = `${newPct}%`;
            if (progVal) progVal.innerText = `${newPct}%`;

            showToast(isCompleted ? "Milestone marked as complete! 🎉" : "Milestone updated to in-progress.");
          };
        });

        // Upload Site Photo
        const photoBtn = container.querySelector("#btn-upload-site-photo");
        const photoInput = container.querySelector("#pms-site-photo-input");

        if (photoBtn && photoInput) {
          photoBtn.onclick = () => {
            photoInput.click();
          };

          photoInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            isUploadingPhoto = true;
            render();

            try {
              showToast("Uploading and timestamping site verification photo...");
              const { data: entry } = await pms.uploadSitePhoto(project.id, file, "Site Progress Inspection");
              if (entry) {
                project.progress = [entry, ...(project.progress || [])];
                showToast("✅ Site verification photo saved to project timeline!");
              }
            } catch (err) {
              showToast("Photo upload failed: " + err.message);
            } finally {
              isUploadingPhoto = false;
              photoInput.value = "";
              render();
            }
          };
        }
      }

      // 3. AI House Map Maker
      if (activeTab === "aiMap") {
        const generateBtn = container.querySelector("#btn-generate-ai-map");
        if (generateBtn) {
          generateBtn.onclick = () => {
            const w = container.querySelector("#plot-width")?.value || 30;
            const l = container.querySelector("#plot-length")?.value || 50;
            const floors = container.querySelector("#plot-floors")?.value || 2;

            generateBtn.disabled = true;
            generateBtn.innerText = "Architectural AI Computing...";

            setTimeout(() => {
              generateBtn.disabled = false;
              generateBtn.innerText = "✨ Regenerate Alternative Layouts";

              const results = container.querySelector("#ai-map-results");
              if (results) {
                const sqft = Number(w) * Number(l);
                results.innerHTML = `
                  <div class="card" style="background: var(--bg-secondary); padding: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <strong style="color: var(--saffron);">Option A — Modern Vastu Layout</strong>
                      <span class="badge badge-verified">North-East Facing</span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                      ${sqft * Number(floors)} sq.ft built-up area (${w}' x ${l}') · ${floors} Floors · Pooja room in Ishan Kon, Kitchen in Agni Kon.
                    </p>
                    <div style="height: 140px; background: #1a1a1a; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px dashed var(--saffron);">
                      <span style="font-size: 1.5rem; margin-bottom: 4px;">📐</span>
                      <span>[CAD Schematic: Ground + ${Number(floors) - 1}]</span>
                      <span style="font-size: 0.7rem; color: #888; margin-top: 4px;">Vastu Score: 98% · Optimal Column Grid</span>
                    </div>
                  </div>

                  <div class="card" style="background: var(--bg-secondary); padding: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <strong style="color: var(--saffron);">Option B — Maximum Carpet Efficiency</strong>
                      <span class="badge badge-verified">East Facing</span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                      Zero corridor wastage · Wide double-height living room · Separate servant room entrance.
                    </p>
                    <div style="height: 140px; background: #1a1a1a; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px dashed var(--green);">
                      <span style="font-size: 1.5rem; margin-bottom: 4px;">🏢</span>
                      <span>[CAD Schematic: Cross-Ventilation]</span>
                      <span style="font-size: 0.7rem; color: #888; margin-top: 4px;">Usable Area: 88% · Sun Path Optimized</span>
                    </div>
                  </div>
                `;
              }
              showToast("Generated Vastu-compliant blueprints for " + w + "x" + l + " plot!");
            }, 600);
          };
        }
      }

      // 4. Civil Engineer Support
      if (activeTab === "engineer") {
        const bookBtn = container.querySelector("#btn-book-engineer");
        if (bookBtn) {
          bookBtn.onclick = () => {
            bookBtn.disabled = true;
            bookBtn.innerText = "Consultation Booked ✅";
            showToast("Consultation booked with Er. Ashish Saxena! Our civil engineering team will call you within 2 hours.");
          };
        }
      }
    }

    render();
  },

  unmount() {}
};

function renderTabContent(tab, project, t, isAddingMaterial, isUploadingPhoto) {
  if (tab === "resources") {
    const materials = project.materials || [
      { id: "1", item_name: "UltraTech Cement", category: "Cement", used_qty: 240, total_qty: 350, unit: "bags" },
      { id: "2", item_name: "Red Clay Bricks", category: "Bricks", used_qty: 18000, total_qty: 25000, unit: "units" },
      { id: "3", item_name: "River Sand", category: "Sand", used_qty: 14, total_qty: 20, unit: "tons" },
      { id: "4", item_name: "TMT Steel 12mm", category: "Steel", used_qty: 3200, total_qty: 4000, unit: "kg" }
    ];

    return `
      <div class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 4px;">Resource & Material Usage Tracker</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Monitor site material stock to prevent theft, waste, and supply delays.</p>
          </div>
          ${!isAddingMaterial ? `
            <button class="btn btn-secondary btn-sm" id="btn-add-resource">
              + Log New Delivery
            </button>
          ` : ""}
        </div>

        ${isAddingMaterial ? `
          <div class="card" style="background: var(--bg-secondary); padding: 18px; margin-bottom: 20px; border: 1px solid var(--saffron);">
            <h4 style="font-weight: 800; font-size: 1rem; margin-bottom: 12px; color: var(--saffron);">
              Log New Material Delivery to Site
            </h4>
            <form id="form-new-material" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              <div class="form-group">
                <label class="form-label">Material / Brand Name</label>
                <input type="text" id="mat-name" class="form-control" placeholder="e.g. ACC Gold Cement" required />
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select id="mat-category" class="form-control">
                  <option value="Cement">Cement</option>
                  <option value="Bricks">Bricks & Blocks</option>
                  <option value="Steel">Steel & Rebar</option>
                  <option value="Sand">Sand & Aggregates</option>
                  <option value="Electrical">Electrical & Wiring</option>
                  <option value="Plumbing">Plumbing & Pipes</option>
                  <option value="Finishing">Tiles & Paint</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Delivered Quantity</label>
                <input type="number" id="mat-qty" class="form-control" placeholder="e.g. 50" min="1" required />
              </div>
              <div class="form-group">
                <label class="form-label">Unit of Measure</label>
                <select id="mat-unit" class="form-control">
                  <option value="bags">bags</option>
                  <option value="units">units (bricks/blocks)</option>
                  <option value="tons">tons</option>
                  <option value="kg">kg</option>
                  <option value="litres">litres</option>
                  <option value="sq.ft">sq.ft</option>
                </select>
              </div>
              <div style="grid-column: 1 / -1; display: flex; gap: 10px; margin-top: 6px;">
                <button type="submit" class="btn btn-primary btn-sm">Log Material Delivery</button>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-material">Cancel</button>
              </div>
            </form>
          </div>
        ` : ""}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          ${materials.map(m => {
            const used = Number(m.used_qty) || 0;
            const total = Number(m.total_qty) || 1;
            const pct = Math.min(100, Math.round((used / total) * 100));
            const icon = m.category === "Cement" ? "🏗️" : m.category === "Bricks" ? "🧱" : m.category === "Sand" ? "⏳" : m.category === "Steel" ? "🔩" : "📦";

            return `
              <div class="card" style="background: var(--bg-secondary); padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 700; font-size: 0.95rem;">${escape(m.item_name)}</span>
                  <span style="font-size: 1.3rem;">${icon}</span>
                </div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--saffron);">
                  ${used.toLocaleString()} <span style="font-size: 0.82rem; color: var(--text-muted);">/ ${total.toLocaleString()} ${escape(m.unit)}</span>
                </div>
                <div style="width: 100%; height: 6px; background: var(--border-light); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${pct > 85 ? "var(--red)" : "var(--saffron)"};"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">
                  <span>${pct}% consumed</span>
                  <span>${escape(m.category || "General")}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
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
    const tasks = project.tasks || [
      { id: "t1", title: "Foundation Excavation & PCC", completed: true },
      { id: "t2", title: "Ground Floor Column Casting & Plinth Beam", completed: true },
      { id: "t3", title: "Brick Masonry up to Lintel Level", completed: true },
      { id: "t4", title: "First Floor Slab Shuttering & Casting", completed: false },
      { id: "t5", title: "Plumbing Concealed Lines & Sanitary Fitting", completed: false },
      { id: "t6", title: "Electrical Concealed Conduiting & Wiring", completed: false }
    ];

    const progressEntries = project.progress || [
      {
        id: "p1",
        step: "Slab Shuttering Inspection",
        photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb180f5f6?w=600&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "p2",
        step: "Ground Floor Brickwork Verified",
        photo_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80",
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    return `
      <div class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800;">Daily Progress & Milestones</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Check off completed stages to update overall project completion.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-upload-site-photo" ${isUploadingPhoto ? "disabled" : ""}>
            ${isUploadingPhoto ? "Uploading..." : "📷 Upload Site Photo"}
          </button>
        </div>

        <!-- Milestones Checklist -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          ${tasks.map(t => `
            <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-light); cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" class="pms-task-toggle" data-task-id="${escape(t.id)}" ${t.completed ? "checked" : ""} style="width: 18px; height: 18px; accent-color: var(--saffron); cursor: pointer;" />
                <span style="font-weight: 700; font-size: 0.95rem; ${t.completed ? "text-decoration: line-through; color: var(--text-muted);" : "color: var(--text-main);"}">
                  ${escape(t.title || t.step)}
                </span>
              </div>
              <span class="badge ${t.completed ? "badge-verified" : "badge-pending"}">
                ${t.completed ? "Completed" : "In Progress"}
              </span>
            </label>
          `).join("")}
        </div>

        <!-- Progress Photos Gallery -->
        <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 12px;">Verified Site Photos</h4>
        ${progressEntries.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted);">No site photos uploaded yet. Snap your first inspection photo using the button above.</p>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
            ${progressEntries.map(entry => `
              <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-light);">
                <img src="${escape(entry.photo_url)}" style="width: 100%; height: 130px; object-fit: cover;" alt="${escape(entry.step || 'Site photo')}" />
                <div style="padding: 8px 10px;">
                  <div style="font-size: 0.8rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escape(entry.step || "Site Verification")}
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    ${entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Just now"}
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
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
            <div style="height: 140px; background: #1a1a1a; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px dashed var(--saffron);">
              <span style="font-size: 1.5rem; margin-bottom: 4px;">📐</span>
              <span>[2D Architectural Schematic: 30'x50']</span>
              <span style="font-size: 0.7rem; color: #888; margin-top: 4px;">Vastu Score: 98% · Optimal Column Grid</span>
            </div>
          </div>

          <div class="card" style="background: var(--bg-secondary); padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: var(--saffron);">Option B — Maximum Space Utilization</strong>
              <span class="badge badge-verified">East Facing</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Spacious Living hall, Attached Bathrooms, Parking Portico.</p>
            <div style="height: 140px; background: #1a1a1a; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: monospace; font-size: 0.8rem; border: 1px dashed var(--green);">
              <span style="font-size: 1.5rem; margin-bottom: 4px;">🏢</span>
              <span>[2D Architectural Schematic: 30'x50']</span>
              <span style="font-size: 0.7rem; color: #888; margin-top: 4px;">Usable Area: 88% · Sun Path Optimized</span>
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
            <button class="btn btn-primary btn-sm btn-full" id="btn-book-engineer">Book Site Inspection (₹1,500)</button>
          </div>

        </div>
      </div>
    `;
  }

  return "";
}
