import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, ShieldOff, ShieldCheck, X, Users, GraduationCap, UserX,
  ChevronDown, MapPin, Globe, Phone, Mail, Filter, Plus, Trash2,
  UserCog, Eye, EyeOff, KeyRound, AlertTriangle, RefreshCw,
  ShieldAlert, Lock, CheckCircle,
} from "lucide-react";
import { useAuth, StaffUser, AgentRole } from "../context/AuthContext";

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

// ── Platform-user types ────────────────────────────────────────────────────────
type PlatformRole   = "parent" | "tutor";
type PlatformStatus = "active" | "blocked";
type Origin         = "local" | "google";

interface PlatformUser {
  id: string; email: string; role: PlatformRole; status: PlatformStatus;
  origin: Origin; created_at: string; full_name: string; phone: string;
  bio?: string; subjects?: string[]; kids_count?: number;
}

const seedUsers: PlatformUser[] = [
  { id: "u001", email: "sarah.johnson@gmail.com",    role: "parent", status: "active",  origin: "google", created_at: "Jan 8, 2025",  full_name: "Sarah Johnson",    phone: "+251 911 234 567", kids_count: 2 },
  { id: "u002", email: "kwame.mensah@yahoo.com",     role: "parent", status: "active",  origin: "local",  created_at: "Feb 2, 2025",  full_name: "Kwame Mensah",     phone: "+251 922 345 678", kids_count: 1 },
  { id: "u003", email: "emily.clarke@outlook.com",   role: "parent", status: "blocked", origin: "local",  created_at: "Mar 14, 2025", full_name: "Emily Clarke",     phone: "+251 933 456 789", kids_count: 3 },
  { id: "u004", email: "david.acheampong@gmail.com", role: "parent", status: "active",  origin: "google", created_at: "Apr 20, 2025", full_name: "David Acheampong", phone: "+251 944 567 890", kids_count: 2 },
  { id: "u005", email: "ama.serwaa@gmail.com",       role: "parent", status: "active",  origin: "local",  created_at: "May 5, 2025",  full_name: "Ama Serwaa",       phone: "+251 955 678 901", kids_count: 1 },
  { id: "u006", email: "james.opoku@gmail.com",      role: "parent", status: "blocked", origin: "local",  created_at: "Jun 11, 2025", full_name: "James Opoku",      phone: "+251 966 789 012", kids_count: 2 },
  { id: "u007", email: "nana.boateng@gmail.com",     role: "parent", status: "active",  origin: "google", created_at: "Jul 3, 2025",  full_name: "Nana Yaa Boateng", phone: "+251 977 890 123", kids_count: 1 },
  { id: "u008", email: "michael.asare@yahoo.com",    role: "parent", status: "active",  origin: "local",  created_at: "Aug 17, 2025", full_name: "Michael Asare",    phone: "+251 988 901 234", kids_count: 3 },
  { id: "u009", email: "helen.tadesse@gmail.com",    role: "parent", status: "active",  origin: "google", created_at: "Sep 22, 2025", full_name: "Helen Tadesse",    phone: "+251 911 012 345", kids_count: 2 },
  { id: "u010", email: "yonas.bekele@outlook.com",   role: "parent", status: "blocked", origin: "local",  created_at: "Oct 9, 2025",  full_name: "Yonas Bekele",     phone: "+251 922 123 456", kids_count: 1 },
  { id: "u011", email: "daniel.osei@gmail.com",      role: "tutor",  status: "active",  origin: "local",  created_at: "Jan 15, 2025", full_name: "Daniel Osei",      phone: "+251 933 234 567", bio: "Expert in Mathematics and Science with 5 years of tutoring experience.", subjects: ["Mathematics", "Science"] },
  { id: "u012", email: "abena.asante@gmail.com",     role: "tutor",  status: "active",  origin: "google", created_at: "Feb 20, 2025", full_name: "Abena Asante",     phone: "+251 944 345 678", bio: "English literature specialist. Passionate about helping students excel.", subjects: ["English", "History"] },
  { id: "u013", email: "samuel.boateng@yahoo.com",   role: "tutor",  status: "blocked", origin: "local",  created_at: "Mar 7, 2025",  full_name: "Samuel Boateng",   phone: "+251 955 456 789", bio: "Science tutor with a background in biology and chemistry.", subjects: ["Science", "Biology"] },
  { id: "u014", email: "linda.owusu@gmail.com",      role: "tutor",  status: "active",  origin: "google", created_at: "Apr 12, 2025", full_name: "Linda Owusu",      phone: "+251 966 567 890", bio: "French and History tutor with a Master's degree in Education.", subjects: ["French", "History"] },
  { id: "u015", email: "yaw.darko@outlook.com",      role: "tutor",  status: "active",  origin: "local",  created_at: "May 25, 2025", full_name: "Yaw Darko",        phone: "+251 977 678 901", bio: "Software engineer turned coding tutor. Specializes in web development.", subjects: ["Coding"] },
  { id: "u016", email: "kofi.adu@gmail.com",         role: "tutor",  status: "blocked", origin: "local",  created_at: "Jun 30, 2025", full_name: "Kofi Adu",         phone: "+251 988 789 012", bio: "Mathematics tutor with 8+ years experience at university level.", subjects: ["Mathematics"] },
  { id: "u017", email: "akosua.frimpong@gmail.com",  role: "tutor",  status: "active",  origin: "google", created_at: "Jul 14, 2025", full_name: "Akosua Frimpong",  phone: "+251 911 890 123", bio: "Specializes in primary school subjects. Patient and encouraging.", subjects: ["Mathematics", "English", "Science"] },
  { id: "u018", email: "kwasi.bonsu@yahoo.com",      role: "tutor",  status: "active",  origin: "local",  created_at: "Aug 5, 2025",  full_name: "Kwasi Bonsu",      phone: "+251 922 901 234", bio: "Geography and History teacher with over a decade of classroom experience.", subjects: ["Geography", "History"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function roleGradient(role: PlatformRole) {
  return role === "parent" ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "linear-gradient(135deg,#8b5cf6,#a78bfa)";
}
function staffGradient(role: AgentRole) {
  return role === "admin" ? "linear-gradient(135deg,#1e293b,#334155)" : "linear-gradient(135deg,#0d9488,#2dd4bf)";
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Platform-user sub-components ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "#f1f5f9", color: "#64748b" }}>{icon}</div>
      <div className="min-w-0">
        <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase",
                    letterSpacing: "0.06em", ...poppins }}>{label}</p>
        <p className="truncate" style={{ fontSize: "0.82rem", fontWeight: 500, color: "#0f172a", marginTop: 1, ...poppins }}>{value}</p>
      </div>
    </div>
  );
}

function ConfirmModal({ user, action, onConfirm, onCancel }: {
  user: PlatformUser; action: "block" | "unblock"; onConfirm: () => void; onCancel: () => void;
}) {
  const isBlock = action === "block";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: isBlock ? "rgba(239,68,68,0.08)" : "rgba(13,148,136,0.08)" }}>
          {isBlock ? <ShieldOff style={{ width: 26, height: 26, color: "#ef4444" }} /> : <ShieldCheck style={{ width: 26, height: 26, color: "#0d9488" }} />}
        </div>
        <h3 className="text-center mb-1" style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", ...poppins }}>
          {isBlock ? "Block User?" : "Unblock User?"}
        </h3>
        <p className="text-center mb-5" style={{ fontSize: "0.82rem", color: "#64748b", ...poppins, lineHeight: 1.6 }}>
          {isBlock
            ? <><strong style={{ color: "#0f172a" }}>{user.full_name}</strong> will lose platform access immediately.</>
            : <>Restoring access for <strong style={{ color: "#0f172a" }}>{user.full_name}</strong>.</>}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl transition-colors"
            style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f1f5f9")}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{ background: isBlock ? "linear-gradient(135deg,#ef4444,#f87171)" : "linear-gradient(135deg,#0d9488,#14b8a6)",
                     color: "white", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins,
                     boxShadow: isBlock ? "0 4px 12px rgba(239,68,68,0.3)" : "0 4px 12px rgba(13,148,136,0.3)" }}>
            {isBlock ? <ShieldOff style={{ width: 14, height: 14 }} /> : <ShieldCheck style={{ width: 14, height: 14 }} />}
            {isBlock ? "Block User" : "Unblock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDrawer({ user, onClose, onToggleBlock }: {
  user: PlatformUser; onClose: () => void; onToggleBlock: (u: PlatformUser) => void;
}) {
  const isBlocked = user.status === "blocked";
  return (
    <div className="fixed inset-0 z-40 flex justify-end"
      style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="h-full w-full max-w-sm flex flex-col overflow-y-auto"
        style={{ background: "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", ...poppins }}>User Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="flex-1 p-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: roleGradient(user.role), color: "white", fontSize: "1.4rem", fontWeight: 700, ...poppins,
                       boxShadow: user.role === "parent" ? "0 8px 24px rgba(13,148,136,0.3)" : "0 8px 24px rgba(139,92,246,0.3)" }}>
              {getInitials(user.full_name)}
            </div>
            <div className="text-center">
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", ...poppins }}>{user.full_name}</p>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", ...poppins, marginTop: 2 }}>{user.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-2.5 py-1 rounded-full"
                style={{ background: user.role === "parent" ? "rgba(13,148,136,0.1)" : "rgba(139,92,246,0.1)",
                         color: user.role === "parent" ? "#0d9488" : "#8b5cf6", fontSize: "0.72rem", fontWeight: 600, ...poppins }}>
                {user.role === "parent" ? "👨‍👩‍👧 Parent" : "🎓 Tutor"}
              </span>
              <span className="px-2.5 py-1 rounded-full"
                style={{ background: isBlocked ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                         color: isBlocked ? "#ef4444" : "#16a34a", fontSize: "0.72rem", fontWeight: 600, ...poppins }}>
                {isBlocked ? "● Blocked" : "● Active"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <InfoRow icon={<Mail style={{ width: 14, height: 14 }} />} label="Email" value={user.email} />
            <InfoRow icon={<Phone style={{ width: 14, height: 14 }} />} label="Phone" value={user.phone} />
            <InfoRow icon={user.origin === "google" ? <Globe style={{ width: 14, height: 14 }} /> : <MapPin style={{ width: 14, height: 14 }} />}
              label="Sign-in Method" value={user.origin === "google" ? "Google OAuth" : "Email & Password"} />
            <InfoRow icon={<Users style={{ width: 14, height: 14 }} />} label="Role" value={user.role === "parent" ? "Parent" : "Tutor"} />
            <InfoRow icon={<ShieldCheck style={{ width: 14, height: 14 }} />} label="Member Since" value={user.created_at} />
            {user.role === "parent" && user.kids_count !== undefined && (
              <InfoRow icon={<Users style={{ width: 14, height: 14 }} />} label="Number of Kids" value={`${user.kids_count} kid${user.kids_count !== 1 ? "s" : ""}`} />
            )}
          </div>
          {user.role === "tutor" && (
            <>
              {user.subjects && user.subjects.length > 0 && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, ...poppins }}>Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.subjects.map(s => (
                      <span key={s} style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", borderRadius: "6px", padding: "3px 9px", fontSize: "0.75rem", fontWeight: 500, ...poppins }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {user.bio && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, ...poppins }}>Bio</p>
                  <p style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.7, ...poppins }}>{user.bio}</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button onClick={() => onToggleBlock(user)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
            style={{ background: isBlocked ? "rgba(13,148,136,0.06)" : "rgba(239,68,68,0.06)",
                     color: isBlocked ? "#0d9488" : "#ef4444",
                     border: `1.5px solid ${isBlocked ? "rgba(13,148,136,0.2)" : "rgba(239,68,68,0.2)"}`,
                     fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", ...poppins }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            {isBlocked ? <><ShieldCheck style={{ width: 16, height: 16 }} /> Unblock User</> : <><ShieldOff style={{ width: 16, height: 16 }} /> Block User</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Staff sub-components ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function CreateStaffModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (msg: string) => void;
}) {
  const { createStaff } = useAuth();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<AgentRole>("customer_support");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [saving,   setSaving]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Temporary password must be at least 6 characters."); return; }
    setSaving(true);
    setTimeout(() => {
      const result = createStaff({ name, email, password, role });
      setSaving(false);
      if (!result.success) { setError(result.error ?? "Failed to create account."); return; }
      onCreated(`Account created for ${name}. They can sign in with the temporary password and will be prompted to change it.`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", ...poppins }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,rgba(13,148,136,0.04),rgba(13,148,136,0.02))" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
              <UserCog style={{ width: 17, height: 17, color: "white" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>Create Staff Account</h3>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Account created by admin — user must change password on first login</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Role selector */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Role</label>
            <div className="flex gap-2">
              {([
                { value: "customer_support" as AgentRole, label: "Customer Support", color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
                { value: "admin"            as AgentRole, label: "Admin",            color: "#1e293b", bg: "rgba(30,41,59,0.08)"  },
              ]).map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{ background: role === r.value ? r.bg : "#f8fafc",
                           color: role === r.value ? r.color : "#94a3b8",
                           border: role === r.value ? `2px solid ${r.color}30` : "2px solid #e2e8f0",
                           fontWeight: role === r.value ? 700 : 500, fontSize: "0.8rem", cursor: "pointer" }}>
                  {r.value === "admin" ? <ShieldAlert style={{ width: 14, height: 14 }} /> : <Users style={{ width: 14, height: 14 }} />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. Dawit Haile"
              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a", fontSize: "0.875rem", ...poppins }}
              onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
              onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }} />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Work Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="e.g. dawit@gobez.et"
              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a", fontSize: "0.875rem", ...poppins }}
              onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
              onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }} />
          </div>

          {/* Temporary password */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Temporary Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Set a temporary password"
                className="w-full pl-4 pr-10 py-3 rounded-xl outline-none transition-all"
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a", fontSize: "0.875rem", ...poppins }}
                onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
                onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 4 }}>
              The staff member will be forced to change this on first login.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(220,38,38,0.07)", color: "#dc2626" }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              <p style={{ fontSize: "0.78rem", fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl transition-colors"
              style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f1f5f9")}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                       fontWeight: 600, fontSize: "0.82rem", border: "none",
                       cursor: saving ? "not-allowed" : "pointer",
                       boxShadow: "0 4px 12px rgba(13,148,136,0.3)", ...poppins }}>
              {saving ? <RefreshCw style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }} /> : <Plus style={{ width: 14, height: 14 }} />}
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ConfirmDeleteStaffModal({ staff, onConfirm, onCancel }: {
  staff: StaffUser; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.08)" }}>
          <Trash2 style={{ width: 26, height: 26, color: "#ef4444" }} />
        </div>
        <h3 className="text-center mb-1" style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", ...poppins }}>Remove Staff Account?</h3>
        <p className="text-center mb-5" style={{ fontSize: "0.82rem", color: "#64748b", ...poppins, lineHeight: 1.6 }}>
          <strong style={{ color: "#0f172a" }}>{staff.name}</strong> will lose all access to the admin panel immediately and cannot log in.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl"
            style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins }}
            onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f1f5f9")}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#ef4444,#f87171)", color: "white",
                     fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer",
                     boxShadow: "0 4px 12px rgba(239,68,68,0.3)", ...poppins }}>
            <Trash2 style={{ width: 14, height: 14 }} /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ staff, onClose }: { staff: StaffUser; onClose: () => void }) {
  const { updateStaff } = useAuth();
  const [newPw,  setNewPw]  = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done,   setDone]   = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) return;
    updateStaff(staff.id, { password: newPw, mustChangePassword: true });
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", ...poppins }}>Reset Password</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <CheckCircle style={{ width: 28, height: 28, color: "#16a34a" }} />
            </div>
            <p style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem", textAlign: "center", ...poppins }}>
              Password reset for {staff.name}
            </p>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.6, ...poppins }}>
              They will be required to set a new password on their next login.
            </p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                       fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6, ...poppins }}>
              Set a new temporary password for <strong style={{ color: "#0f172a" }}>{staff.name}</strong>.
              They will be forced to change it on their next login.
            </p>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} required
                placeholder="New temporary password"
                className="w-full pl-4 pr-10 py-3 rounded-xl outline-none transition-all"
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a", fontSize: "0.875rem", ...poppins }}
                onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; e.target.style.background = "white"; }}
                onBlur={e  => { e.target.style.border = "1.5px solid #e2e8f0"; e.target.style.background = "#f8fafc"; }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl"
                style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer", ...poppins }}>
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                         fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer",
                         boxShadow: "0 4px 12px rgba(13,148,136,0.3)", ...poppins }}>
                <KeyRound style={{ width: 14, height: 14 }} /> Reset Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Staff table row ────────────────────────────────────────────────────────────
function StaffRow({ staff, isCurrentUser, onSuspend, onRestore, onDelete, onResetPassword }: {
  staff: StaffUser; isCurrentUser: boolean;
  onSuspend: () => void; onRestore: () => void;
  onDelete: () => void; onResetPassword: () => void;
}) {
  const isSuspended = staff.status === "suspended";
  const isAdmin     = staff.role === "admin";
  return (
    <tr style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.12s" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>

      {/* Name */}
      <td style={{ padding: "13px 14px" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: staffGradient(staff.role), color: "white", fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
            {staff.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate" style={{ fontSize: "0.83rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{staff.name}</p>
              {isCurrentUser && (
                <span className="px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", fontSize: "0.6rem", fontWeight: 700 }}>You</span>
              )}
            </div>
            <p style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins }}>Since {staff.createdAt}</p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td style={{ padding: "13px 14px" }}>
        <span className="truncate block" style={{ fontSize: "0.78rem", color: "#475569", ...poppins }}>{staff.email}</span>
      </td>

      {/* Role */}
      <td style={{ padding: "13px 14px" }}>
        <span className="px-2.5 py-1 rounded-full inline-flex items-center gap-1"
          style={{ background: isAdmin ? "rgba(30,41,59,0.08)" : "rgba(13,148,136,0.1)",
                   color: isAdmin ? "#1e293b" : "#0d9488",
                   fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
          {isAdmin ? <ShieldAlert style={{ width: 10, height: 10 }} /> : <Users style={{ width: 10, height: 10 }} />}
          {isAdmin ? "Admin" : "Support"}
        </span>
      </td>

      {/* Password status */}
      <td style={{ padding: "13px 14px" }}>
        {staff.mustChangePassword ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(245,158,11,0.1)", color: "#d97706", fontSize: "0.68rem", fontWeight: 600, ...poppins }}>
            <KeyRound style={{ width: 10, height: 10 }} /> Temp
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", fontSize: "0.68rem", fontWeight: 600, ...poppins }}>
            <Lock style={{ width: 10, height: 10 }} /> Set
          </span>
        )}
      </td>

      {/* Status */}
      <td style={{ padding: "13px 14px" }}>
        <span className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full"
          style={{ background: isSuspended ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                   color: isSuspended ? "#ef4444" : "#16a34a",
                   fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSuspended ? "#ef4444" : "#16a34a" }} />
          {isSuspended ? "Suspended" : "Active"}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button onClick={onResetPassword}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(100,116,139,0.08)", color: "#64748b", border: "none",
                     cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, ...poppins }}
            title="Reset password"
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,116,139,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(100,116,139,0.08)")}>
            <KeyRound style={{ width: 11, height: 11 }} /> Reset
          </button>
          {!isCurrentUser && (
            <>
              <button onClick={isSuspended ? onRestore : onSuspend}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: isSuspended ? "rgba(13,148,136,0.08)" : "rgba(245,158,11,0.08)",
                         color: isSuspended ? "#0d9488" : "#d97706",
                         border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, ...poppins }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                {isSuspended ? <><ShieldCheck style={{ width: 11, height: 11 }} /> Restore</> : <><ShieldOff style={{ width: 11, height: 11 }} /> Suspend</>}
              </button>
              <button onClick={onDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444",
                         border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, ...poppins }}
                title="Remove staff account"
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}>
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main Component ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
type RoleFilter   = "all" | "parent" | "tutor";
type StatusFilter = "all" | "active" | "blocked";
type MainTab      = "platform" | "staff";

export function UserManagement() {
  const { agent, staffUsers, updateStaff, deleteStaff } = useAuth();

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>("platform");

  // ── Platform-user state ───────────────────────────────────────────────────────
  const [users, setUsers]           = useState<PlatformUser[]>(seedUsers);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  // Close status dropdown when clicking outside
  useEffect(() => {
    if (!statusDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdownOpen]);
  const [confirmAction, setConfirmAction] = useState<{ user: PlatformUser; action: "block" | "unblock" } | null>(null);

  // ── Staff state ───────────────────────────────────────────────────────────────
  const [staffSearch,   setStaffSearch]   = useState("");
  const [showCreate,    setShowCreate]    = useState(false);
  const [toastMsg,      setToastMsg]      = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);
  const [resetPwTarget, setResetPwTarget] = useState<StaffUser | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // ── Platform filters ──────────────────────────────────────────────────────────
  const totalParents = users.filter(u => u.role === "parent").length;
  const totalTutors  = users.filter(u => u.role === "tutor").length;
  const totalBlocked = users.filter(u => u.status === "blocked").length;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
      const matchRole   = roleFilter   === "all" || u.role   === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleBlock = (user: PlatformUser) => {
    setConfirmAction({ user, action: user.status === "active" ? "block" : "unblock" });
    setSelectedUser(null);
  };
  const handleConfirm = () => {
    if (!confirmAction) return;
    const { user, action } = confirmAction;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: action === "block" ? "blocked" : "active" } : u));
    setConfirmAction(null);
  };

  // ── Staff filters ─────────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const q = staffSearch.toLowerCase();
    return staffUsers.filter(s => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staffUsers, staffSearch]);

  const statusFilterLabels: Record<StatusFilter, string> = { all: "All Statuses", active: "Active", blocked: "Blocked" };

  return (
    <div style={{ ...poppins }}>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                   boxShadow: "0 8px 24px rgba(13,148,136,0.35)", maxWidth: 380 }}>
          <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
          <p style={{ fontSize: "0.82rem", fontWeight: 500 }}>{toastMsg}</p>
          <button onClick={() => setToastMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-5">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>User Management</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
          Manage platform users and staff accounts
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 mb-5 rounded-2xl w-fit"
        style={{ background: "white", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {([
          { key: "platform" as MainTab, label: "Platform Users",  Icon: Users   },
          { key: "staff"    as MainTab, label: "Staff Accounts",   Icon: UserCog },
        ]).map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMainTab(key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
            style={{ background: mainTab === key ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "transparent",
                     color: mainTab === key ? "white" : "#64748b",
                     fontWeight: mainTab === key ? 700 : 500, fontSize: "0.82rem",
                     border: "none", cursor: "pointer",
                     boxShadow: mainTab === key ? "0 4px 12px rgba(13,148,136,0.25)" : "none" }}>
            <Icon style={{ width: 15, height: 15 }} />{label}
            <span className="px-1.5 py-0.5 rounded-md"
              style={{ background: mainTab === key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                       color: mainTab === key ? "white" : "#94a3b8", fontSize: "0.62rem", fontWeight: 700 }}>
              {key === "platform" ? users.length : staffUsers.length}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ PLATFORM USERS TAB ═══════════════════════════════════════════════ */}
      {mainTab === "platform" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total Parents", value: totalParents, icon: Users,        color: "#0d9488", bg: "rgba(13,148,136,0.08)" },
              { label: "Total Tutors",  value: totalTutors,  icon: GraduationCap, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
              { label: "Blocked Users", value: totalBlocked, icon: UserX,         color: "#ef4444", bg: "rgba(239,68,68,0.08)"  },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon style={{ width: 16, height: 16, color }} />
                  </div>
                </div>
                <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.1 }}>{value}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                <Search style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone…"
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", ...poppins, color: "#0f172a", width: "100%" }} />
                {search && (
                  <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative" ref={statusDropdownRef}>
                  <button onClick={() => setStatusDropdownOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", ...poppins, whiteSpace: "nowrap" }}>
                    <Filter style={{ width: 13, height: 13 }} />
                    {statusFilterLabels[statusFilter]}
                    <ChevronDown style={{ width: 13, height: 13 }} />
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-xl overflow-hidden"
                      style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: "160px" }}>
                      {(["all", "active", "blocked"] as StatusFilter[]).map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setStatusDropdownOpen(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
                          style={{ background: statusFilter === s ? "rgba(13,148,136,0.06)" : "transparent",
                                   color: statusFilter === s ? "#0d9488" : "#475569",
                                   fontSize: "0.8rem", fontWeight: statusFilter === s ? 600 : 400,
                                   border: "none", cursor: "pointer", ...poppins }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: s === "all" ? "#94a3b8" : s === "active" ? "#16a34a" : "#ef4444" }} />
                          {statusFilterLabels[s]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                  {(["all", "parent", "tutor"] as RoleFilter[]).map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)} className="px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: roleFilter === r ? "white" : "transparent",
                               color: roleFilter === r ? "#0f172a" : "#94a3b8",
                               fontWeight: roleFilter === r ? 600 : 400, fontSize: "0.78rem",
                               border: "none", cursor: "pointer", ...poppins,
                               boxShadow: roleFilter === r ? "0 1px 4px rgba(0,0,0,0.08)" : "none", whiteSpace: "nowrap" }}>
                      {r === "all" ? "All" : r === "parent" ? "Parents" : "Tutors"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3" style={{ fontSize: "0.72rem", color: "#94a3b8", ...poppins }}>
              Showing <strong style={{ color: "#0f172a" }}>{filteredUsers.length}</strong> of {users.length} users
              {search && <> matching "<strong style={{ color: "#0d9488" }}>{search}</strong>"</>}
            </p>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden hidden lg:block" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "24%" }} /><col style={{ width: "22%" }} /><col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "10%" }} /><col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["User", "Email", "Role", "Phone", "Sign-in", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", ...poppins }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f1f5f9" }}>
                        <Search style={{ width: 20, height: 20, color: "#94a3b8" }} />
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", ...poppins }}>No users match your search.</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredUsers.map((u, i) => {
                    const isBlocked = u.status === "blocked";
                    return (
                      <tr key={u.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none", transition: "background 0.12s", cursor: "pointer" }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                        onClick={() => setSelectedUser(u)}>
                        <td style={{ padding: "13px 14px", overflow: "hidden" }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: roleGradient(u.role), color: "white", fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
                              {getInitials(u.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate" style={{ fontSize: "0.83rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{u.full_name}</p>
                              <p style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins, marginTop: 1 }}>Since {u.created_at}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "13px 14px", overflow: "hidden" }}>
                          <span className="truncate block" style={{ fontSize: "0.78rem", color: "#475569", ...poppins }}>{u.email}</span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span className="px-2.5 py-1 rounded-full inline-block"
                            style={{ background: u.role === "parent" ? "rgba(13,148,136,0.1)" : "rgba(139,92,246,0.1)",
                                     color: u.role === "parent" ? "#0d9488" : "#8b5cf6",
                                     fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
                            {u.role === "parent" ? "Parent" : "Tutor"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px", overflow: "hidden" }}>
                          <span className="truncate block" style={{ fontSize: "0.78rem", color: "#475569", ...poppins }}>{u.phone}</span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span className="flex items-center gap-1.5" style={{ fontSize: "0.75rem", color: "#64748b", ...poppins, whiteSpace: "nowrap" }}>
                            {u.origin === "google" ? <><Globe style={{ width: 12, height: 12, color: "#0d9488" }} /> Google</> : <><MapPin style={{ width: 12, height: 12 }} /> Email</>}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full"
                            style={{ background: isBlocked ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                                     color: isBlocked ? "#ef4444" : "#16a34a", fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isBlocked ? "#ef4444" : "#16a34a" }} />
                            {isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setConfirmAction({ user: u, action: isBlocked ? "unblock" : "block" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: isBlocked ? "rgba(13,148,136,0.08)" : "rgba(239,68,68,0.08)",
                                     color: isBlocked ? "#0d9488" : "#ef4444",
                                     border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                            {isBlocked ? <><ShieldCheck style={{ width: 12, height: 12 }} /> Unblock</> : <><ShieldOff style={{ width: 12, height: 12 }} /> Block</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Card grid (mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center gap-3 py-16">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f1f5f9" }}>
                  <Search style={{ width: 20, height: 20, color: "#94a3b8" }} />
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.82rem", ...poppins }}>No users match your search.</p>
              </div>
            ) : (
              filteredUsers.map(u => {
                const isBlocked = u.status === "blocked";
                return (
                  <div key={u.id} className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => setSelectedUser(u)}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: roleGradient(u.role), color: "white", fontSize: "0.7rem", fontWeight: 700, ...poppins }}>
                        {getInitials(u.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{u.full_name}</p>
                        <p className="truncate" style={{ fontSize: "0.72rem", color: "#94a3b8", ...poppins }}>{u.email}</p>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: isBlocked ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                                 color: isBlocked ? "#ef4444" : "#16a34a", fontSize: "0.65rem", fontWeight: 600 }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isBlocked ? "#ef4444" : "#16a34a" }} />
                        {isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full"
                        style={{ background: u.role === "parent" ? "rgba(13,148,136,0.1)" : "rgba(139,92,246,0.1)",
                                 color: u.role === "parent" ? "#0d9488" : "#8b5cf6", fontSize: "0.68rem", fontWeight: 600, ...poppins }}>
                        {u.role === "parent" ? "Parent" : "Tutor"}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontSize: "0.72rem", color: "#94a3b8", ...poppins }}>
                        {u.origin === "google" ? <Globe style={{ width: 11, height: 11 }} /> : <MapPin style={{ width: 11, height: 11 }} />}
                        {u.origin === "google" ? "Google" : "Email"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", ...poppins }}>{u.phone}</span>
                    </div>
                    <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid #f1f5f9" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedUser(u)} className="flex-1 py-2 rounded-lg"
                        style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", ...poppins }}>
                        View Details
                      </button>
                      <button onClick={() => setConfirmAction({ user: u, action: isBlocked ? "unblock" : "block" })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg"
                        style={{ background: isBlocked ? "rgba(13,148,136,0.08)" : "rgba(239,68,68,0.08)",
                                 color: isBlocked ? "#0d9488" : "#ef4444",
                                 border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", ...poppins }}>
                        {isBlocked ? <><ShieldCheck style={{ width: 12, height: 12 }} /> Unblock</> : <><ShieldOff style={{ width: 12, height: 12 }} /> Block</>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ═══ STAFF ACCOUNTS TAB ═══════════════════════════════════════════════ */}
      {mainTab === "staff" && (
        <>
          {/* Staff stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Staff",     value: staffUsers.length,                                           color: "#0d9488", bg: "rgba(13,148,136,0.08)",  Icon: UserCog    },
              { label: "Admins",          value: staffUsers.filter(s => s.role === "admin").length,           color: "#1e293b", bg: "rgba(30,41,59,0.08)",    Icon: ShieldAlert },
              { label: "Support Agents", value: staffUsers.filter(s => s.role === "customer_support").length, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", Icon: Users       },
              { label: "Temp Passwords", value: staffUsers.filter(s => s.mustChangePassword).length,          color: "#d97706", bg: "rgba(245,158,11,0.08)",  Icon: KeyRound   },
            ].map(({ label, value, color, bg, Icon }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.1 }}>{value}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Staff toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2.5 rounded-xl"
              style={{ background: "white", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Search style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
              <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search staff by name or email…"
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", ...poppins, color: "#0f172a", width: "100%" }} />
              {staffSearch && (
                <button onClick={() => setStaffSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                       fontWeight: 700, fontSize: "0.82rem", border: "none", cursor: "pointer",
                       boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              <Plus style={{ width: 15, height: 15 }} /> New Staff Account
            </button>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: "rgba(13,148,136,0.05)", border: "1.5px solid rgba(13,148,136,0.15)" }}>
            <ShieldAlert style={{ width: 16, height: 16, color: "#0d9488", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
              Staff accounts are created by admins. Customer Support agents can only access the Support & Reports section.
              All newly created accounts are assigned a temporary password and must change it on first login.
            </p>
          </div>

          {/* Staff table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "28%" }} /><col style={{ width: "24%" }} /><col style={{ width: "13%" }} />
                <col style={{ width: "11%" }} /><col style={{ width: "10%" }} /><col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Staff Member", "Email", "Role", "Password", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", ...poppins }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f1f5f9" }}>
                        <UserCog style={{ width: 20, height: 20, color: "#94a3b8" }} />
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem", ...poppins }}>No staff accounts found.</p>
                    </div>
                  </td></tr>
                ) : (
                  filteredStaff.map(staff => (
                    <StaffRow key={staff.id} staff={staff} isCurrentUser={staff.id === agent?.id}
                      onSuspend={() => { updateStaff(staff.id, { status: "suspended" }); showToast(`${staff.name}'s account has been suspended.`); }}
                      onRestore={() => { updateStaff(staff.id, { status: "active" });    showToast(`${staff.name}'s account has been restored.`); }}
                      onDelete={() => setConfirmDelete(staff)}
                      onResetPassword={() => setResetPwTarget(staff)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {selectedUser && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} onToggleBlock={handleToggleBlock} />
      )}
      {confirmAction && (
        <ConfirmModal user={confirmAction.user} action={confirmAction.action}
          onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)} />
      )}
      {showCreate && (
        <CreateStaffModal onClose={() => setShowCreate(false)} onCreated={showToast} />
      )}
      {confirmDelete && (
        <ConfirmDeleteStaffModal staff={confirmDelete}
          onConfirm={() => {
            const result = deleteStaff(confirmDelete.id);
            if (result.success) showToast(`${confirmDelete.name}'s account has been removed.`);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)} />
      )}
      {resetPwTarget && (
        <ResetPasswordModal staff={resetPwTarget} onClose={() => setResetPwTarget(null)} />
      )}
    </div>
  );
}
