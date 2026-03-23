import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck, Shield, Mail, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Defined outside the component so React never remounts it on re-render
function PasswordField({
  label, value, onChange, show, onToggle, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ color: "#475569", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Lock style={{ width: 16, height: 16, color: "#0d9488" }} />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full outline-none transition-all duration-200"
          style={{
            paddingLeft: "42px", paddingRight: "44px",
            paddingTop: "12px", paddingBottom: "12px",
            background: "#f8fafc", border: "1.5px solid #e2e8f0",
            borderRadius: "12px", color: "#0f172a", fontSize: "0.875rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            fontFamily: "'Poppins', sans-serif",
          }}
          onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)"; e.target.style.background = "#fff"; }}
          onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.target.style.background = "#f8fafc"; }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
          style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#0d9488")}
          onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
        >
          {show ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
        </button>
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { agent, staffUsers, changePassword } = useAuth();

  // Find the full staff record for the logged-in agent (for password verification)
  const staffRecord = staffUsers.find(s => s.id === agent?.id);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8)            score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPassword);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#e2e8f0", "#ef4444", "#f59e0b", "#0d9488", "#16a34a"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Verify current password against actual stored password
    if (!staffRecord) { setError("Unable to verify account. Please sign out and sign in again."); return; }
    if (currentPassword !== staffRecord.password) {
      setError("Current password is incorrect.");
      return;
    }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword === currentPassword) { setError("New password must be different from current password."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }

    setIsLoading(true);
    setTimeout(() => {
      changePassword(newPassword);   // updates the real store
      setIsLoading(false);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 5000);
    }, 1200);
  };

  const isAdmin = agent?.role === "admin";

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Page header */}
      <div className="mb-7">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
          Account Settings
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
          Manage your account preferences and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

        {/* ── Profile card ── */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
        >
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: isAdmin
                ? "linear-gradient(135deg,#1e293b,#334155)"
                : "linear-gradient(135deg,#0d9488,#14b8a6)",
              boxShadow: isAdmin
                ? "0 8px 24px rgba(30,41,59,0.3)"
                : "0 8px 24px rgba(13,148,136,0.3)",
            }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: "1.6rem" }}>
              {agent?.initials ?? "??"}
            </span>
          </div>

          {/* Name & email */}
          <div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1rem" }}>
              {agent?.name ?? "—"}
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 3 }}>
              {agent?.email ?? "—"}
            </p>
          </div>

          {/* Role badge */}
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: isAdmin ? "rgba(30,41,59,0.08)" : "rgba(13,148,136,0.1)",
              color: isAdmin ? "#1e293b" : "#0d9488",
              fontSize: "0.73rem", fontWeight: 600,
            }}
          >
            <ShieldCheck style={{ width: 13, height: 13 }} />
            {isAdmin ? "Administrator" : "Customer Support"}
          </span>

          {/* Meta rows */}
          <div className="w-full pt-4 mt-1" style={{ borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="flex items-center gap-1.5" style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                <Shield style={{ width: 12, height: 12 }} />Role
              </span>
              <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 500 }}>
                {isAdmin ? "Admin" : "Support Agent"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="flex items-center gap-1.5" style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                <Mail style={{ width: 12, height: 12 }} />Email
              </span>
              <span className="truncate" style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 500, maxWidth: 130 }}>
                {agent?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5" style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                <Calendar style={{ width: 12, height: 12 }} />Joined
              </span>
              <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 500 }}>
                {staffRecord?.createdAt ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Change Password ── */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.1)" }}>
              <Lock style={{ width: 18, height: 18, color: "#0d9488" }} />
            </div>
            <div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem" }}>Change Password</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: 1 }}>
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          {/* Success */}
          {success && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-5"
              style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              <CheckCircle style={{ width: 18, height: 18, color: "#16a34a", flexShrink: 0 }} />
              <p style={{ color: "#16a34a", fontSize: "0.82rem", fontWeight: 500 }}>
                Password updated successfully!
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-5"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder="Enter current password"
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="Enter new password"
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="-mt-1">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? strengthColors[strength] : "#e2e8f0" }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: "0.72rem", color: strengthColors[strength], fontWeight: 600 }}>
                  {strengthLabels[strength]}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}> — use 8+ chars, uppercase, numbers & symbols</span>
                </p>
              </div>
            )}

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder="Confirm new password"
            />

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <p style={{ fontSize: "0.72rem", fontWeight: 600, marginTop: -6,
                          color: newPassword === confirmPassword ? "#16a34a" : "#ef4444" }}>
                {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 mt-1 transition-all duration-200"
              style={{
                background: isLoading
                  ? "linear-gradient(135deg,#5eead4,#2dd4bf)"
                  : "linear-gradient(135deg,#0d9488,#14b8a6)",
                borderRadius: "12px", color: "white", fontWeight: 600, fontSize: "0.9rem",
                border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
                fontFamily: "'Poppins', sans-serif", width: "100%",
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = "linear-gradient(135deg,#0f766e,#0d9488)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = "linear-gradient(135deg,#0d9488,#14b8a6)"; e.currentTarget.style.transform = "translateY(0)"; } }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating…
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
