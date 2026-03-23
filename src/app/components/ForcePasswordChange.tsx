import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

export function ForcePasswordChange() {
  const { agent, changePassword } = useAuth();
  const [newPw,     setNewPw]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew,   setShowNew]  = useState(false);
  const [showConf,  setShowConf] = useState(false);
  const [error,     setError]    = useState("");
  const [saving,    setSaving]   = useState(false);
  // When true, show success screen. Password is NOT changed yet —
  // we call changePassword() only when the user explicitly clicks "Continue",
  // so the overlay stays alive long enough for them to read the success message.
  const [done, setDone]          = useState(false);
  const [savedPw, setSavedPw]    = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedPw(newPw);   // store the validated password
      setDone(true);        // show success screen — overlay stays mounted
    }, 700);
  };

  // Called when user clicks "Continue to Dashboard":
  // This triggers changePassword → mustChangePassword becomes false → Layout unmounts this overlay
  const handleContinue = () => {
    changePassword(savedPw);
  };

  const strength = newPw.length === 0 ? 0
    : newPw.length < 6  ? 1
    : newPw.length < 8  ? 2
    : newPw.length < 12 ? 3
    : 4;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["#e2e8f0", "#ef4444", "#f59e0b", "#0d9488", "#16a34a"][strength];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(6px)", ...poppins }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 32px 80px rgba(0,0,0,0.24)" }}
      >
        {/* Header */}
        <div className="px-8 py-6" style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Lock style={{ width: 26, height: 26, color: "white" }} />
          </div>
          <h2 style={{ color: "white", fontWeight: 700, fontSize: "1.2rem" }}>
            {done ? "Password Set!" : "Set Your Password"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", marginTop: 4, lineHeight: 1.6 }}>
            {done
              ? "You're all set. Click Continue to access your dashboard."
              : `Hi ${agent?.name?.split(" ")[0] ?? "there"}! Your account was created with a temporary password. Please create your own password before continuing.`}
          </p>
        </div>

        <div className="px-8 py-6">
          {done ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-5 py-2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <ShieldCheck style={{ width: 38, height: 38, color: "#16a34a" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>Password Updated!</p>
                <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: 6, lineHeight: 1.65 }}>
                  Your new password has been saved. You'll use it the next time you sign in.
                </p>
              </div>
              <button
                onClick={handleContinue}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "linear-gradient(135deg,#0d9488,#14b8a6)",
                  color: "white", fontWeight: 600, fontSize: "0.9rem",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.35)",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <ShieldCheck style={{ width: 16, height: 16 }} />
                Continue to Dashboard
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>New Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock style={{ width: 15, height: 15, color: "#0d9488" }} />
                  </div>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full pl-10 pr-10 py-3 outline-none transition-all"
                    style={{
                      background: "#f8fafc", border: "1.5px solid #e2e8f0",
                      borderRadius: "12px", color: "#0f172a", fontSize: "0.875rem", ...poppins,
                    }}
                    onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
                    onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                  >
                    {showNew ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColor : "#e2e8f0" }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.65rem", color: strengthColor, fontWeight: 600 }}>
                      {strengthLabel}
                      <span style={{ color: "#94a3b8", fontWeight: 400 }}> — min. 8 characters</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock style={{ width: 15, height: 15, color: "#0d9488" }} />
                  </div>
                  <input
                    type={showConf ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-10 pr-10 py-3 outline-none transition-all"
                    style={{
                      background: "#f8fafc", border: "1.5px solid #e2e8f0",
                      borderRadius: "12px", color: "#0f172a", fontSize: "0.875rem", ...poppins,
                    }}
                    onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
                    onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                  >
                    {showConf ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
                {/* Match hint */}
                {confirmPw.length > 0 && (
                  <p style={{ fontSize: "0.68rem", fontWeight: 600,
                    color: newPw === confirmPw ? "#16a34a" : "#ef4444" }}>
                    {newPw === confirmPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(220,38,38,0.07)", color: "#dc2626" }}
                >
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <p style={{ fontSize: "0.78rem", fontWeight: 500 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: saving
                    ? "linear-gradient(135deg,#5eead4,#2dd4bf)"
                    : "linear-gradient(135deg,#0d9488,#14b8a6)",
                  color: "white", fontWeight: 600, fontSize: "0.9rem",
                  border: "none", cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.3)", ...poppins,
                }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  <><ShieldCheck style={{ width: 16, height: 16 }} /> Set Password & Continue</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}