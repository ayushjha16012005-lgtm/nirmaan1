/* NIRMAAN Real Supabase Phone Auth Page */
import { supabase, isLive } from "../services/supabase.js";
import { showToast, escape } from "../core/ui.js";
import { getPersona } from "../data/personas.js";

let expiryInterval = null;
let resendInterval = null;

export default {
  route: "#/auth",
  title: "Secure Phone Login",

  async mount(container, ctx) {
    const { t, store } = ctx;
    const role = store.get("role") || "user";

    // If already signed in with a valid profile, redirect immediately
    const currentUser = store.get("user");
    if (currentUser && !currentUser.needsOnboarding) {
      window.location.hash = currentUser.role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
      return;
    }

    let step = 1; // 1 = Phone input, 2 = 6-digit OTP input
    let enteredPhone = "";
    let isLoading = false;
    let errorMessage = "";
    let expirySeconds = 300; // 5 minutes expiry countdown
    let resendCooldown = 30; // 30s resend cooldown

    function isLockedOut() {
      const lockedUntil = parseInt(sessionStorage.getItem("nirmaan_auth_locked_until") || "0", 10);
      return Date.now() < lockedUntil;
    }

    function getRemainingLockMinutes() {
      const lockedUntil = parseInt(sessionStorage.getItem("nirmaan_auth_locked_until") || "0", 10);
      const remainingMs = lockedUntil - Date.now();
      return Math.max(1, Math.ceil(remainingMs / 60000));
    }

    function recordFailedAttempt() {
      const attempts = parseInt(sessionStorage.getItem("nirmaan_auth_failed_attempts") || "0", 10) + 1;
      sessionStorage.setItem("nirmaan_auth_failed_attempts", String(attempts));
      if (attempts >= 5) {
        sessionStorage.setItem("nirmaan_auth_locked_until", String(Date.now() + 10 * 60 * 1000));
      }
      return attempts;
    }

    function clearLockout() {
      sessionStorage.removeItem("nirmaan_auth_failed_attempts");
      sessionStorage.removeItem("nirmaan_auth_locked_until");
    }

    function startExpiryTimer() {
      if (expiryInterval) clearInterval(expiryInterval);
      expirySeconds = 300;
      expiryInterval = setInterval(() => {
        expirySeconds--;
        const timerEl = container.querySelector("#otp-expiry-timer");
        if (timerEl) {
          if (expirySeconds <= 0) {
            clearInterval(expiryInterval);
            timerEl.textContent = "0:00 (Expired)";
            timerEl.style.color = "var(--danger)";
            errorMessage = t("auth.expiredOtp");
            const errEl = container.querySelector("#auth-error-msg");
            if (errEl) {
              errEl.textContent = errorMessage;
              errEl.style.display = "block";
            }
          } else {
            const m = Math.floor(expirySeconds / 60);
            const s = String(expirySeconds % 60).padStart(2, "0");
            timerEl.textContent = `${m}:${s}`;
          }
        }
      }, 1000);
    }

    function startResendTimer() {
      if (resendInterval) clearInterval(resendInterval);
      resendCooldown = 30;
      resendInterval = setInterval(() => {
        resendCooldown--;
        const resendBtn = container.querySelector("#btn-resend-otp");
        if (resendBtn) {
          if (resendCooldown <= 0) {
            clearInterval(resendInterval);
            resendBtn.disabled = false;
            resendBtn.textContent = t("auth.resendOtp");
          } else {
            resendBtn.disabled = true;
            resendBtn.textContent = t("auth.resendIn", { s: String(resendCooldown) });
          }
        }
      }, 1000);
    }

    function render() {
      const locked = isLockedOut();
      const showDemoHelp = import.meta.env.VITE_DEMO_HELP === "true";

      container.innerHTML = `
        <div class="container-mobile" style="min-height: calc(100vh - 140px); display: flex; flex-direction: column; justify-content: center; padding: 20px 16px;">
          
          <div class="card" style="padding: 32px 24px; text-align: center; border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
            
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: var(--saffron-glow); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 2px solid var(--saffron);">
              ${role === "kaarigar" ? "👷" : "👤"}
            </div>

            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
              ${t("auth.loginTitle")}
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
              ${role === "kaarigar" ? "Kaarigar / Worker Access" : "Customer / Builder Access"}
            </p>

            ${!isLive() ? `
              <div style="background: rgba(232, 98, 26, 0.08); border: 1px solid var(--saffron-border); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 18px; text-align: left; font-size: 0.78rem;">
                <strong style="color: var(--saffron);">ℹ️ Offline Dev Mode:</strong>
                <span style="color: var(--text-muted);"> Supabase keys not set. Running in local development mode.</span>
              </div>
            ` : ""}

            ${locked ? `
              <div class="alert alert-danger" style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 14px; border-radius: var(--radius-md); margin-bottom: 18px; font-size: 0.85rem; text-align: left;">
                <strong>⚠️ ${t("auth.formLocked")}</strong>
                <p style="margin-top: 4px; font-size: 0.8rem;">Please wait ${getRemainingLockMinutes()} minutes before trying again.</p>
              </div>
            ` : ""}

            <!-- Dynamic Error Feedback -->
            <div id="auth-error-msg" style="display: ${errorMessage ? "block" : "none"}; background: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 16px; text-align: left;">
              ${escape(errorMessage)}
            </div>

            ${step === 1 ? `
              <!-- Step 1: Mobile Phone Input -->
              <form id="phone-form" onsubmit="return false;">
                <div class="form-group" style="text-align: left; margin-bottom: 16px;">
                  <label class="form-label" for="phone-input" style="font-weight: 700;">${t("auth.enterMobile")}</label>
                  <div style="display: flex; gap: 8px;">
                    <span style="display: flex; align-items: center; padding: 0 14px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: var(--radius-md); font-weight: 800; color: var(--text-main);">
                      +91
                    </span>
                    <input
                      type="tel"
                      id="phone-input"
                      class="form-control"
                      placeholder="98765 43210"
                      maxlength="10"
                      inputmode="numeric"
                      pattern="[6-9][0-9]{9}"
                      autocomplete="tel-national"
                      value="${escape(enteredPhone)}"
                      ${locked || isLoading ? "disabled" : ""}
                      required
                      style="font-size: 1.1rem; letter-spacing: 1px; font-weight: 700;"
                    />
                  </div>
                  <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
                    Valid 10-digit Indian mobile number starting with 6, 7, 8, or 9
                  </p>
                </div>

                <button 
                  type="submit" 
                  id="btn-get-otp" 
                  class="btn btn-primary btn-full btn-lg" 
                  ${locked || isLoading ? "disabled" : ""}
                  style="margin-top: 8px; font-weight: 800;"
                >
                  ${isLoading ? "Sending OTP..." : `${t("auth.getOtp")} →`}
                </button>
              </form>
            ` : `
              <!-- Step 2: 6-Digit Real OTP Input -->
              <form id="otp-form" onsubmit="return false;">
                <div class="form-group" style="text-align: left; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label class="form-label" style="font-weight: 700; margin: 0;">${t("auth.enterOtp6")}</label>
                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--saffron);">
                      ⏱️ <span id="otp-expiry-timer">5:00</span>
                    </span>
                  </div>

                  <!-- 6 Auto-Advancing Digit Boxes -->
                  <div id="otp-inputs-container" style="display: flex; justify-content: space-between; gap: 8px; margin: 12px 0;">
                    ${[0, 1, 2, 3, 4, 5].map(idx => `
                      <input
                        type="text"
                        class="otp-digit"
                        data-index="${idx}"
                        maxlength="1"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        ${idx === 0 ? 'autocomplete="one-time-code"' : ""}
                        ${locked || isLoading ? "disabled" : ""}
                        style="width: 44px; height: 52px; text-align: center; font-size: 1.5rem; font-weight: 800; border: 1.5px solid var(--border-light); border-radius: var(--radius-md); background: var(--bg-secondary); color: var(--text-main);"
                      />
                    `).join("")}
                  </div>

                  <p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 8px;">
                    Enter the 6-digit verification code sent to +91 ${escape(enteredPhone)}
                  </p>
                </div>

                <button 
                  type="submit" 
                  id="btn-verify-otp" 
                  class="btn btn-success btn-full btn-lg" 
                  ${locked || isLoading ? "disabled" : ""}
                  style="margin-top: 8px; font-weight: 800;"
                >
                  ${isLoading ? "Verifying..." : `${t("auth.verifyOtp")} ✓`}
                </button>

                <div style="display: flex; gap: 10px; margin-top: 14px;">
                  <button 
                    type="button" 
                    id="btn-resend-otp" 
                    class="btn btn-secondary btn-sm" 
                    style="flex: 1;"
                    disabled
                  >
                    ${t("auth.resendIn", { s: "30" })}
                  </button>
                  <button 
                    type="button" 
                    id="btn-change-phone" 
                    class="btn btn-secondary btn-sm" 
                    style="flex: 1;"
                  >
                    Change Phone
                  </button>
                </div>
              </form>
            `}

            ${showDemoHelp ? `
              <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--border-light); font-size: 0.75rem; color: var(--text-muted);">
                <strong style="color: var(--saffron);">📋 ${t("auth.demoAccess")}:</strong> ${t("auth.demoAccessText")}
              </div>
            ` : ""}

          </div>

        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      if (step === 1) {
        const phoneForm = container.querySelector("#phone-form");
        const phoneInput = container.querySelector("#phone-input");

        if (phoneInput) {
          phoneInput.focus();
        }

        if (phoneForm) {
          phoneForm.onsubmit = async (e) => {
            e.preventDefault();
            if (isLockedOut() || isLoading) return;

            const val = phoneInput.value.replace(/\D/g, "");
            // Validate Indian 10-digit mobile starting with 6-9
            if (!/^[6-9]\d{9}$/.test(val)) {
              errorMessage = t("auth.invalidPhone");
              render();
              return;
            }

            enteredPhone = val;
            isLoading = true;
            errorMessage = "";
            render();

            if (isLive()) {
              try {
                const { error } = await supabase.auth.signInWithOtp({
                  phone: "+91" + enteredPhone
                });

                if (error) {
                  console.error("Supabase signInWithOtp error:", error);
                  if (error.message.includes("rate") || error.status === 429) {
                    errorMessage = t("auth.tooManyRequests");
                  } else {
                    errorMessage = error.message || t("auth.networkError");
                  }
                  isLoading = false;
                  render();
                  return;
                }

                step = 2;
                isLoading = false;
                render();
                startExpiryTimer();
                startResendTimer();
                showToast("OTP sent successfully via SMS! 📩");
              } catch (err) {
                console.error("Auth send OTP exception:", err);
                errorMessage = t("auth.networkError");
                isLoading = false;
                render();
              }
            } else {
              // Offline dev fallback
              step = 2;
              isLoading = false;
              render();
              startExpiryTimer();
              startResendTimer();
              showToast("Offline Dev Mode: Enter any 6-digit code");
            }
          };
        }
      } else {
        // Step 2: OTP Entry bindings
        const otpInputs = container.querySelectorAll(".otp-digit");
        const otpForm = container.querySelector("#otp-form");
        const resendBtn = container.querySelector("#btn-resend-otp");
        const changePhoneBtn = container.querySelector("#btn-change-phone");

        if (otpInputs.length > 0) {
          otpInputs[0].focus();

          otpInputs.forEach((input, idx) => {
            input.oninput = (e) => {
              const val = e.target.value.replace(/\D/g, "");
              e.target.value = val ? val[val.length - 1] : "";
              if (e.target.value && idx < 5) {
                otpInputs[idx + 1].focus();
              }
            };

            input.onkeydown = (e) => {
              if (e.key === "Backspace" && !input.value && idx > 0) {
                otpInputs[idx - 1].focus();
              }
            };

            input.onpaste = (e) => {
              e.preventDefault();
              const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
              if (pasted) {
                pasted.split("").forEach((char, i) => {
                  if (otpInputs[i]) {
                    otpInputs[i].value = char;
                  }
                });
                const nextFocus = Math.min(pasted.length, 5);
                otpInputs[nextFocus].focus();
              }
            };
          });
        }

        if (changePhoneBtn) {
          changePhoneBtn.onclick = () => {
            if (expiryInterval) clearInterval(expiryInterval);
            if (resendInterval) clearInterval(resendInterval);
            step = 1;
            errorMessage = "";
            render();
          };
        }

        if (resendBtn) {
          resendBtn.onclick = async () => {
            if (resendCooldown > 0 || isLockedOut() || isLoading) return;
            isLoading = true;
            errorMessage = "";
            render();

            if (isLive()) {
              try {
                const { error } = await supabase.auth.signInWithOtp({
                  phone: "+91" + enteredPhone
                });
                isLoading = false;
                if (error) {
                  errorMessage = error.message.includes("rate") ? t("auth.tooManyRequests") : error.message;
                } else {
                  showToast("New OTP sent via SMS! 📩");
                  startExpiryTimer();
                  startResendTimer();
                }
                render();
              } catch (err) {
                isLoading = false;
                errorMessage = t("auth.networkError");
                render();
              }
            } else {
              isLoading = false;
              startExpiryTimer();
              startResendTimer();
              render();
              showToast("New test OTP requested");
            }
          };
        }

        if (otpForm) {
          otpForm.onsubmit = async (e) => {
            e.preventDefault();
            if (isLockedOut() || isLoading) return;

            const code = Array.from(otpInputs).map(inp => inp.value).join("");
            if (code.length !== 6) {
              errorMessage = "Please enter the complete 6-digit code";
              render();
              return;
            }

            isLoading = true;
            errorMessage = "";
            render();

            if (isLive()) {
              try {
                const { data, error } = await supabase.auth.verifyOtp({
                  phone: "+91" + enteredPhone,
                  token: code,
                  type: "sms"
                });

                if (error) {
                  console.error("Supabase verifyOtp error:", error);
                  recordFailedAttempt();
                  if (error.message.includes("expired") || error.message.includes("Expired")) {
                    errorMessage = t("auth.expiredOtp");
                  } else if (error.message.includes("rate") || error.status === 429) {
                    errorMessage = t("auth.tooManyRequests");
                  } else {
                    errorMessage = t("auth.invalidOtp");
                  }
                  isLoading = false;
                  render();
                  return;
                }

                // OTP Verified Successfully!
                clearLockout();
                if (expiryInterval) clearInterval(expiryInterval);
                if (resendInterval) clearInterval(resendInterval);

                showToast("Verification Successful! 🎉");

                // Load or create user profile
                const profile = await store.loadUserProfile(data.user.id, data.user.phone);

                setTimeout(() => {
                  if (!profile || profile.needsOnboarding) {
                    window.location.hash = "#/onboarding";
                  } else {
                    const redirect = sessionStorage.getItem("nirmaan_redirect_after_login");
                    if (redirect) {
                      sessionStorage.removeItem("nirmaan_redirect_after_login");
                      window.location.hash = redirect;
                    } else {
                      window.location.hash = profile.role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
                    }
                  }
                }, 400);

              } catch (err) {
                console.error("Auth verification exception:", err);
                recordFailedAttempt();
                errorMessage = t("auth.networkError");
                isLoading = false;
                render();
              }
            } else {
              // Offline dev fallback
              clearLockout();
              if (expiryInterval) clearInterval(expiryInterval);
              if (resendInterval) clearInterval(resendInterval);

              const persona = getPersona(role);
              const maskedPhone = `+91 ${enteredPhone.slice(0, 2)}•••• ••${enteredPhone.slice(-2)}`;
              store.set("role", role);
              store.set("user", {
                ...persona,
                phone: maskedPhone,
                verified: true
              });

              showToast("Login Successful! 🎉");
              setTimeout(() => {
                const redirect = sessionStorage.getItem("nirmaan_redirect_after_login");
                if (redirect) {
                  sessionStorage.removeItem("nirmaan_redirect_after_login");
                  window.location.hash = redirect;
                } else {
                  window.location.hash = role === "kaarigar" ? "#/kaarigar-home" : "#/user-home";
                }
              }, 400);
            }
          };
        }
      }
    }

    render();
  },

  unmount() {
    if (expiryInterval) {
      clearInterval(expiryInterval);
      expiryInterval = null;
    }
    if (resendInterval) {
      clearInterval(resendInterval);
      resendInterval = null;
    }
  }
};
