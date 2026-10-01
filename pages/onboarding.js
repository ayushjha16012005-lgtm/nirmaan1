/* NIRMAAN First-Login Profile Onboarding Page */
import { TRADES } from "../data/constants.js";
import { supabase, isLive } from "../services/supabase.js";
import { showToast, escape } from "../core/ui.js";

let mediaStream = null;

export default {
  route: "#/onboarding",
  title: "Complete Profile",

  async mount(container, ctx) {
    const { t, store } = ctx;
    const currentUser = store.get("user");
    
    // Check if URL has a role parameter
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes("?") ? hash.slice(hash.indexOf("?")) : "");
    const initialRole = urlParams.get("role") || store.get("role") || "user";

    let selectedRole = initialRole === "kaarigar" ? "kaarigar" : "user";
    let selectedTrade = "mason";
    let selfieBlob = null;
    let selfieDataUrl = null;
    let isSubmitting = false;
    let errorMessage = "";

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="padding-top: 16px; padding-bottom: 70px;">
          
          <div class="card" style="padding: 26px 20px; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge badge-saffron" style="margin-bottom: 6px;">Profile Setup</span>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">
                ${t("onboarding.title")}
              </h2>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                Tell us about yourself to get started on Nirmaan
              </p>
            </div>

            <!-- Error Banner -->
            <div id="onboarding-error" style="display: ${errorMessage ? "block" : "none"}; background: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 16px;">
              ${escape(errorMessage)}
            </div>

            <form id="onboarding-form" onsubmit="return false;">
              
              <!-- 1. Role Selection -->
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: 700;">${t("onboarding.roleSelect")}</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <button 
                    type="button" 
                    id="role-btn-user" 
                    class="btn ${selectedRole === "user" ? "btn-primary" : "btn-secondary"}" 
                    style="padding: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 4px;"
                  >
                    <span style="font-size: 1.4rem;">👤</span>
                    <span>Customer / Builder</span>
                  </button>
                  <button 
                    type="button" 
                    id="role-btn-kaarigar" 
                    class="btn ${selectedRole === "kaarigar" ? "btn-primary" : "btn-secondary"}" 
                    style="padding: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 4px;"
                  >
                    <span style="font-size: 1.4rem;">👷</span>
                    <span>Kaarigar / Worker</span>
                  </button>
                </div>
              </div>

              <!-- 2. Common Fields -->
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="full-name" style="font-weight: 700;">${t("onboarding.fullName")} *</label>
                <input 
                  type="text" 
                  id="full-name" 
                  class="form-control" 
                  placeholder="e.g. Ramesh Yadav" 
                  required 
                  value="${escape(currentUser?.name || "")}" 
                />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label" for="city" style="font-weight: 700;">City</label>
                  <input type="text" id="city" class="form-control" placeholder="Noida" value="Noida" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="sector" style="font-weight: 700;">Sector / Locality</label>
                  <input type="text" id="sector" class="form-control" placeholder="Sector 62" value="Sector 62" required />
                </div>
              </div>

              <!-- 3. Kaarigar Specific Fields -->
              ${selectedRole === "kaarigar" ? `
                <div id="kaarigar-fields" style="background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; margin-bottom: 18px;">
                  
                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" for="trade-select" style="font-weight: 700;">${t("onboarding.trade")} *</label>
                    <select id="trade-select" class="form-control" style="font-weight: 600;">
                      ${TRADES.filter(t => t.id !== "all").map(t => `
                        <option value="${t.id}" ${t.id === selectedTrade ? "selected" : ""}>
                          ${t.icon} ${store.get("lang") === "hi" ? t.label_hi : t.label_en}
                        </option>
                      `).join("")}
                    </select>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                    <div class="form-group">
                      <label class="form-label" for="experience-years" style="font-weight: 700;">${t("onboarding.experience")}</label>
                      <input type="number" id="experience-years" class="form-control" min="1" max="40" value="5" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="daily-rate" style="font-weight: 700;">${t("onboarding.rate")}</label>
                      <input type="number" id="daily-rate" class="form-control" min="200" step="50" value="800" />
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom: 14px;">
                    <label class="form-label" for="skills-input" style="font-weight: 700;">${t("onboarding.skills")}</label>
                    <input type="text" id="skills-input" class="form-control" placeholder="Brickwork, Plastering, Tiling" value="Brickwork, Plastering" />
                    <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Separate multiple skills with commas</p>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                    <div class="form-group">
                      <label class="form-label" for="languages-input" style="font-weight: 700;">${t("onboarding.languages")}</label>
                      <input type="text" id="languages-input" class="form-control" placeholder="Hindi, Bhojpuri" value="Hindi, Bhojpuri" />
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="radius-km" style="font-weight: 700;">${t("onboarding.radius")}</label>
                      <select id="radius-km" class="form-control">
                        <option value="5" selected>5 km</option>
                        <option value="10">10 km</option>
                        <option value="15">15 km</option>
                        <option value="25">25 km</option>
                      </select>
                    </div>
                  </div>

                  <!-- Optional Selfie / Camera Verification -->
                  <div style="border-top: 1px solid var(--border-light); padding-top: 12px; margin-top: 12px;">
                    <label class="form-label" style="font-weight: 700; margin-bottom: 6px;">${t("onboarding.selfie")}</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <div id="selfie-preview" style="width: 54px; height: 54px; border-radius: 50%; background: var(--bg-tertiary); border: 2px dashed var(--border-light); display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 1.5rem;">
                        ${selfieDataUrl ? `<img src="${selfieDataUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Selfie" />` : "📷"}
                      </div>
                      <div style="flex: 1;">
                        <input type="file" id="selfie-file" accept="image/*" capture="user" style="display: none;" />
                        <button type="button" id="btn-snap-selfie" class="btn btn-secondary btn-sm">
                          ${selfieDataUrl ? "Retake Photo" : "Take Photo / Upload"}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ` : ""}

              <!-- Submit Button -->
              <button 
                type="submit" 
                id="btn-submit-onboarding" 
                class="btn btn-success btn-full btn-lg" 
                ${isSubmitting ? "disabled" : ""}
                style="margin-top: 14px; font-weight: 800;"
              >
                ${isSubmitting ? "Saving Profile..." : `${t("onboarding.submit")} ✓`}
              </button>

            </form>

          </div>

        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      // Role switchers
      const btnUser = container.querySelector("#role-btn-user");
      const btnKaarigar = container.querySelector("#role-btn-kaarigar");

      if (btnUser) {
        btnUser.onclick = () => {
          if (selectedRole !== "user") {
            selectedRole = "user";
            render();
          }
        };
      }

      if (btnKaarigar) {
        btnKaarigar.onclick = () => {
          if (selectedRole !== "kaarigar") {
            selectedRole = "kaarigar";
            render();
          }
        };
      }

      // Selfie capture
      const snapBtn = container.querySelector("#btn-snap-selfie");
      const fileInput = container.querySelector("#selfie-file");
      if (snapBtn && fileInput) {
        snapBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            selfieBlob = file;
            const reader = new FileReader();
            reader.onload = (re) => {
              selfieDataUrl = re.target.result;
              const previewEl = container.querySelector("#selfie-preview");
              if (previewEl) {
                previewEl.innerHTML = `<img src="${selfieDataUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Selfie" />`;
              }
            };
            reader.readAsDataURL(file);
          }
        };
      }

      // Form submission
      const form = container.querySelector("#onboarding-form");
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          if (isSubmitting) return;

          const fullName = container.querySelector("#full-name").value.trim();
          if (!fullName) {
            errorMessage = "Please enter your full name";
            render();
            return;
          }

          const city = container.querySelector("#city").value.trim() || "Noida";
          const sector = container.querySelector("#sector").value.trim() || "Sector 62";

          isSubmitting = true;
          errorMessage = "";
          render();

          const userId = currentUser?.id || `user-${Date.now()}`;
          const phone = currentUser?.phone || "+91 98765 43210";

          let avatarUrl = null;

          if (isLive() && currentUser?.id) {
            try {
              // 1. Optional upload avatar
              if (selfieBlob) {
                const path = `${currentUser.id}/avatar-${Date.now()}.jpg`;
                const { data: uploadData, error: upError } = await supabase.storage
                  .from("avatars")
                  .upload(path, selfieBlob, { upsert: true });

                if (!upError && uploadData) {
                  const { data: publicUrlData } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(path);
                  avatarUrl = publicUrlData?.publicUrl || null;
                }
              }

              // 2. Upsert profiles row
              const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                  id: currentUser.id,
                  phone: phone,
                  full_name: fullName,
                  active_role: selectedRole,
                  city: city,
                  sector: sector,
                  avatar_url: avatarUrl,
                  created_at: new Date().toISOString()
                });

              if (profileError) throw profileError;

              // 3. If Kaarigar, upsert worker_profiles row
              if (selectedRole === "kaarigar") {
                const trade = container.querySelector("#trade-select").value;
                const tradeObj = TRADES.find(t => t.id === trade);
                const tradeLabel = tradeObj ? tradeObj.label_en : "Mason";
                const experience = parseInt(container.querySelector("#experience-years").value) || 3;
                const rate = parseInt(container.querySelector("#daily-rate").value) || 800;
                const skillsText = container.querySelector("#skills-input").value;
                const skills = skillsText.split(",").map(s => s.trim()).filter(Boolean);
                const languagesText = container.querySelector("#languages-input").value;
                const languages = languagesText.split(",").map(l => l.trim()).filter(Boolean);
                const radius = parseInt(container.querySelector("#radius-km").value) || 5;

                const { error: workerError } = await supabase
                  .from("worker_profiles")
                  .upsert({
                    id: currentUser.id,
                    trade: trade,
                    trade_label: tradeLabel,
                    experience_years: experience,
                    rate: rate,
                    rate_type: "day",
                    skills: skills,
                    languages: languages,
                    radius_km: radius,
                    locality: `${city} ${sector}`.trim(),
                    verified: false,
                    availability: "Available",
                    is_seed: false
                  });

                if (workerError) throw workerError;
              }

              // 4. Reload profile in store
              await store.loadUserProfile(currentUser.id, phone);

              showToast("Profile created successfully! 🎉");

              setTimeout(() => {
                const redirect = sessionStorage.getItem("nirmaan_redirect_after_login");
                if (redirect) {
                  sessionStorage.removeItem("nirmaan_redirect_after_login");
                  window.location.hash = redirect;
                } else {
                  window.location.hash = selectedRole === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
                }
              }, 400);

            } catch (err) {
              console.error("Onboarding submission error:", err);
              errorMessage = err.message || "Failed to save profile. Please try again.";
              isSubmitting = false;
              render();
            }
          } else {
            // Offline / non-live mode
            const mockUser = {
              id: userId,
              phone: phone,
              name: fullName,
              role: selectedRole,
              city: city,
              sector: sector,
              avatarUrl: selfieDataUrl,
              hasCustomerProfile: true,
              hasWorkerProfile: selectedRole === "kaarigar",
              needsOnboarding: false
            };

            store.set("role", selectedRole);
            store.set("user", mockUser);

            showToast("Profile created! 🎉");
            setTimeout(() => {
              window.location.hash = selectedRole === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
            }, 400);
          }
        };
      }
    }

    render();
  },

  unmount() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }
};
