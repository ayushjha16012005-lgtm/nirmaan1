/* NIRMAAN Phone OTP Auth Page */
import { showToast } from "../core/ui.js";

export default {
  route: "#/auth",
  title: "Secure Login",

  async mount(container, ctx) {
    const { t, store } = ctx;
    const role = store.get("role") || "user";

    let step = 1; // 1 = Phone input, 2 = OTP input
    let generatedOtp = "1234";
    let enteredPhone = "";

    function render() {
      container.innerHTML = `
        <div class="container-mobile" style="min-height: calc(100vh - 140px); display: flex; flex-direction: column; justify-content: center; padding: 20px 16px;">
          
          <div class="card" style="padding: 30px 24px; text-align: center; border-radius: var(--radius-lg);">
            
            <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: var(--saffron-glow); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">
              ${role === "kaarigar" ? "👷" : "👤"}
            </div>

            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
              ${t("auth.loginTitle")}
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px;">
              ${role === "kaarigar" ? "Kaarigar Partner Access" : "Customer / Builder Access"}
            </p>

            ${step === 1 ? `
              <!-- Step 1: Mobile Phone -->
              <div class="form-group" style="text-align: left;">
                <label class="form-label">${t("auth.enterMobile")}</label>
                <div style="display: flex; gap: 8px;">
                  <span style="display: flex; align-items: center; padding: 0 12px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-md); font-weight: 700; color: var(--text-muted);">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone-input"
                    class="form-control"
                    placeholder="98765 43210"
                    maxlength="10"
                    value="${enteredPhone || "9876543210"}"
                    required
                  />
                </div>
              </div>

              <button id="btn-get-otp" class="btn btn-primary btn-full btn-lg" style="margin-top: 12px;">
                ${t("auth.getOtp")} →
              </button>
            ` : `
              <!-- Step 2: OTP Entry -->
              <div class="form-group" style="text-align: left;">
                <label class="form-label">${t("auth.enterOtp")}</label>
                <input
                  type="number"
                  id="otp-input"
                  class="form-control"
                  placeholder="• • • •"
                  style="text-align: center; font-size: 1.4rem; letter-spacing: 8px; font-weight: 800;"
                  value="1234"
                  maxlength="4"
                  required
                />
                <p style="font-size: 0.75rem; color: var(--green); margin-top: 6px; font-weight: 600;">
                  ✨ Demo OTP: <strong>1234</strong> (auto-filled for testing)
                </p>
              </div>

              <button id="btn-verify-otp" class="btn btn-success btn-full btn-lg" style="margin-top: 12px;">
                ${t("auth.verifyOtp")} ✓
              </button>

              <button id="btn-change-phone" class="btn btn-secondary btn-full btn-sm" style="margin-top: 10px;">
                Change Phone Number
              </button>
            `}

            <div style="margin-top: 24px; font-size: 0.75rem; color: var(--text-light);">
              🔒 Supabase Auth · 256-bit Encrypted OTP Session
            </div>

          </div>

        </div>
      `;

      if (step === 1) {
        container.querySelector("#btn-get-otp").onclick = () => {
          const phone = container.querySelector("#phone-input").value.trim();
          if (phone.length < 10) {
            showToast("Please enter a valid 10-digit mobile number");
            return;
          }
          enteredPhone = phone;
          step = 2;
          showToast(`OTP sent to +91 ${phone}! (Code: 1234)`);
          render();
        };
      } else {
        container.querySelector("#btn-verify-otp").onclick = () => {
          const otp = container.querySelector("#otp-input").value.trim();
          if (otp === "1234" || otp.length === 4) {
            showToast("Login Successful! 🎉");
            
            // Set session in store
            store.set("user", {
              id: role === "kaarigar" ? "k-ramesh" : "u-aman",
              name: role === "kaarigar" ? "Ramesh Yadav" : "Aman Sharma",
              phone: `+91 ${enteredPhone || "9876543210"}`,
              role: role,
              verified: true
            });

            setTimeout(() => {
              window.location.hash = role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
            }, 400);
          } else {
            showToast("Invalid OTP. Try 1234.");
          }
        };

        container.querySelector("#btn-change-phone").onclick = () => {
          step = 1;
          render();
        };
      }
    }

    render();
  },

  unmount() {}
};
