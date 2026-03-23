import { useState, useMemo } from "react";
import {
  Flag,
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  ShieldOff,
  ShieldAlert,
  Ban,
  MessageSquare,
  ChevronRight,
  Filter,
  Users,
  GraduationCap,
  FileText,
  CalendarClock,
  Gavel,
  TriangleAlert,
  Info,
  RefreshCcw,
} from "lucide-react";

// ── Schema alignment ─────────────────────────────────────────────────────────
// reports: id, reporter_id, reporter_role, reported_id, reported_role,
//          category, description, status, admin_decision, admin_notes,
//          booking_id (optional), created_at, resolved_at
//
// users → parent_profiles / tutor_profiles for name lookup
// status:        pending | under_review | resolved | dismissed
// admin_decision: warn | suspend | ban | no_action | null

type ReportStatus   = "pending" | "under_review" | "resolved" | "dismissed";
type AdminDecision  = "warn" | "suspend" | "ban" | "no_action" | null;
type UserRole       = "parent" | "tutor";
type ReportCategory =
  | "harassment"
  | "no_show"
  | "inappropriate_content"
  | "payment_dispute"
  | "fraud"
  | "fake_profile"
  | "abusive_language"
  | "other";

interface ReportUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: "active" | "blocked";
}

interface Report {
  id: string;
  reporter: ReportUser;
  reported: ReportUser;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_decision: AdminDecision;
  admin_notes: string;
  booking_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ── Mock seed data ─────────────────────────────────────────────────────────────
// Users pool (drawn from UserManagement schema)
const u = (id: string, full_name: string, email: string, role: UserRole, status: "active" | "blocked" = "active"): ReportUser =>
  ({ id, full_name, email, role, status });

const USERS: Record<string, ReportUser> = {
  u001: u("u001", "Sarah Johnson",    "sarah.johnson@gmail.com",      "parent"),
  u002: u("u002", "Kwame Mensah",     "kwame.mensah@yahoo.com",       "parent"),
  u003: u("u003", "Emily Clarke",     "emily.clarke@outlook.com",     "parent", "blocked"),
  u004: u("u004", "David Acheampong", "david.acheampong@gmail.com",   "parent"),
  u005: u("u005", "Ama Serwaa",       "ama.serwaa@gmail.com",         "parent"),
  u006: u("u006", "James Opoku",      "james.opoku@gmail.com",        "parent", "blocked"),
  u007: u("u007", "Nana Yaa Boateng", "nana.boateng@gmail.com",       "parent"),
  u011: u("u011", "Daniel Osei",      "daniel.osei@gmail.com",        "tutor"),
  u012: u("u012", "Abena Asante",     "abena.asante@gmail.com",       "tutor"),
  u013: u("u013", "Samuel Boateng",   "samuel.boateng@gmail.com",     "tutor"),
  u014: u("u014", "Linda Owusu",      "linda.owusu@gmail.com",        "tutor"),
  u015: u("u015", "Yaw Darko",        "yaw.darko@gmail.com",          "tutor", "blocked"),
  u016: u("u016", "Fatima Al-Hassan", "fatima.alhassan@gmail.com",    "tutor"),
  u017: u("u017", "Kojo Mensah",      "kojo.mensah@gmail.com",        "tutor"),
};

const seedReports: Report[] = [
  {
    id: "rpt-001",
    reporter: USERS["u001"],
    reported: USERS["u011"],
    category: "no_show",
    description: "The tutor Daniel Osei did not show up for our scheduled session on March 10. He didn't send any prior notice and was unreachable. My child waited for 45 minutes. This is the second time this has happened.",
    status: "pending",
    admin_decision: null,
    admin_notes: "",
    booking_id: "bk-a3f1c2d4",
    created_at: "Mar 13, 2026",
    resolved_at: null,
  },
  {
    id: "rpt-002",
    reporter: USERS["u012"],
    reported: USERS["u002"],
    category: "payment_dispute",
    description: "Parent Kwame Mensah cancelled the session 10 minutes before it started and is now requesting a full refund. Per our platform policy, cancellations under 2 hours are subject to a 50% fee. He is threatening to leave a negative review if the refund is not issued in full.",
    status: "under_review",
    admin_decision: null,
    admin_notes: "Reviewing booking cancellation timestamp and policy terms. Contacted parent via email on Mar 11.",
    booking_id: "bk-b9e2a871",
    created_at: "Mar 11, 2026",
    resolved_at: null,
  },
  {
    id: "rpt-003",
    reporter: USERS["u005"],
    reported: USERS["u015"],
    category: "abusive_language",
    description: "Tutor Yaw Darko used disrespectful and condescending language during an online session. He told my child they were 'too slow' and 'wasting his time'. I have a recording of the session. This is completely unacceptable behavior for a tutor on this platform.",
    status: "resolved",
    admin_decision: "suspend",
    admin_notes: "Reviewed session recording provided by parent. Confirmed abusive language was used. Tutor account suspended for 30 days. Warning email sent.",
    booking_id: "bk-e8c3a119",
    created_at: "Mar 9, 2026",
    resolved_at: "Mar 12, 2026",
  },
  {
    id: "rpt-004",
    reporter: USERS["u013"],
    reported: USERS["u003"],
    category: "fraud",
    description: "Parent Emily Clarke booked 5 sessions using what appears to be a stolen credit card. All payments have been flagged by the payment processor. She has done this before on other platforms according to the chargeback notice we received.",
    status: "resolved",
    admin_decision: "ban",
    admin_notes: "Coordinated with payment processor. Confirmed fraudulent activity. Account permanently banned. Reported to ERCA financial crime unit. Tutor compensated from platform insurance fund.",
    booking_id: null,
    created_at: "Feb 28, 2026",
    resolved_at: "Mar 5, 2026",
  },
  {
    id: "rpt-005",
    reporter: USERS["u007"],
    reported: USERS["u014"],
    category: "inappropriate_content",
    description: "During an online session, tutor Linda Owusu shared a document that contained politically charged content unrelated to the subject (English). My child was disturbed and asked me about it. I am attaching a screenshot of the shared document.",
    status: "pending",
    admin_decision: null,
    admin_notes: "",
    booking_id: "bk-g7f4c882",
    created_at: "Mar 14, 2026",
    resolved_at: null,
  },
  {
    id: "rpt-006",
    reporter: USERS["u016"],
    reported: USERS["u006"],
    category: "harassment",
    description: "Parent James Opoku has been sending aggressive messages demanding sessions outside the platform at a reduced price. When I refused, he started sending threatening messages implying he would 'ruin my reputation'. I have screenshots of all messages.",
    status: "resolved",
    admin_decision: "ban",
    admin_notes: "Screenshots reviewed. Clear violation of platform conduct policy. Account permanently banned. Tutors counseled on reporting such incidents promptly.",
    booking_id: null,
    created_at: "Mar 2, 2026",
    resolved_at: "Mar 8, 2026",
  },
  {
    id: "rpt-007",
    reporter: USERS["u004"],
    reported: USERS["u012"],
    category: "no_show",
    description: "Tutor Abena Asante missed our agreed in-person session without notice. I travelled 30 minutes to the meeting point with my children. This caused significant inconvenience and the booking fee was still charged.",
    status: "dismissed",
    admin_decision: "no_action",
    admin_notes: "Reviewed booking logs. Tutor had sent a cancellation message 1 hour before via the app chat that the parent appears to have not read. Policy was followed. Case dismissed.",
    booking_id: "bk-d1b5e230",
    created_at: "Mar 6, 2026",
    resolved_at: "Mar 9, 2026",
  },
  {
    id: "rpt-008",
    reporter: USERS["u002"],
    reported: USERS["u017"],
    category: "fake_profile",
    description: "Tutor Kojo Mensah claims to have a PhD in Physics from Addis Ababa University. After searching the university alumni directory, no such person exists. His tutoring quality was also poor for someone claiming that level of qualification.",
    status: "under_review",
    admin_decision: null,
    admin_notes: "Requested credential documents from tutor on Mar 13. Awaiting response. Profile temporarily hidden from search results.",
    booking_id: "bk-f2d9b447",
    created_at: "Mar 12, 2026",
    resolved_at: null,
  },
  {
    id: "rpt-009",
    reporter: USERS["u011"],
    reported: USERS["u001"],
    category: "other",
    description: "Parent Sarah Johnson booked a Mathematics session but then spent the entire session asking me to also cover Science without paying for the extra subject. When I declined, she gave a 1-star review claiming I was 'unhelpful'. The review is affecting my rating unfairly.",
    status: "pending",
    admin_decision: null,
    admin_notes: "",
    booking_id: "bk-a3f1c2d4",
    created_at: "Mar 15, 2026",
    resolved_at: null,
  },
];

// ── Config maps ─────────────────────────────────────────────────────────────────

const statusCfg: Record<ReportStatus, { label: string; bg: string; color: string; icon: JSX.Element }> = {
  pending:      { label: "Pending",      bg: "rgba(245,158,11,0.1)",  color: "#d97706", icon: <Clock      style={{ width: 11, height: 11 }} /> },
  under_review: { label: "Under Review", bg: "rgba(59,130,246,0.1)",  color: "#2563eb", icon: <Eye        style={{ width: 11, height: 11 }} /> },
  resolved:     { label: "Resolved",     bg: "rgba(34,197,94,0.1)",   color: "#16a34a", icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  dismissed:    { label: "Dismissed",    bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: <XCircle    style={{ width: 11, height: 11 }} /> },
};

const categoryCfg: Record<ReportCategory, { label: string; color: string; bg: string }> = {
  harassment:           { label: "Harassment",             color: "#dc2626", bg: "rgba(220,38,38,0.08)"  },
  no_show:              { label: "No-Show",                color: "#d97706", bg: "rgba(245,158,11,0.08)" },
  inappropriate_content:{ label: "Inappropriate Content",  color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  payment_dispute:      { label: "Payment Dispute",        color: "#0284c7", bg: "rgba(2,132,199,0.08)"  },
  fraud:                { label: "Fraud",                  color: "#b91c1c", bg: "rgba(185,28,28,0.08)"  },
  fake_profile:         { label: "Fake Profile",           color: "#b45309", bg: "rgba(180,83,9,0.08)"   },
  abusive_language:     { label: "Abusive Language",       color: "#be185d", bg: "rgba(190,24,93,0.08)"  },
  other:                { label: "Other",                  color: "#475569", bg: "rgba(71,85,105,0.08)"  },
};

const decisionCfg: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  warn:      { label: "Warn User",  color: "#d97706", bg: "rgba(245,158,11,0.1)",  icon: <TriangleAlert style={{ width: 14, height: 14 }} /> },
  suspend:   { label: "Suspend",    color: "#dc2626", bg: "rgba(220,38,38,0.1)",   icon: <ShieldOff     style={{ width: 14, height: 14 }} /> },
  ban:       { label: "Ban",        color: "#7f1d1d", bg: "rgba(127,29,29,0.1)",   icon: <Ban           style={{ width: 14, height: 14 }} /> },
  no_action: { label: "No Action",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: <CheckCircle   style={{ width: 14, height: 14 }} /> },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const Avatar = ({ name, role }: { name: string; role: UserRole }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
    style={{
      background: role === "tutor"
        ? "linear-gradient(135deg, #8b5cf6, #a78bfa)"
        : "linear-gradient(135deg, #0d9488, #14b8a6)",
      color: "white",
      fontSize: "0.6rem",
      fontWeight: 700,
      fontFamily: "'Poppins', sans-serif",
    }}
  >
    {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
  </div>
);

const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const s = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>
      {s.icon}{s.label}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: ReportCategory }) => {
  const c = categoryCfg[category];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color, fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>
      {c.label}
    </span>
  );
};

const DecisionBadge = ({ decision }: { decision: AdminDecision }) => {
  if (!decision) return <span style={{ color: "#94a3b8", fontSize: "0.72rem", fontFamily: "'Poppins', sans-serif" }}>—</span>;
  const d = decisionCfg[decision];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: d.bg, color: d.color, fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>
      {d.icon}{d.label}
    </span>
  );
};

const RoleChip = ({ role }: { role: UserRole }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: role === "tutor" ? "rgba(139,92,246,0.08)" : "rgba(13,148,136,0.08)", color: role === "tutor" ? "#7c3aed" : "#0d9488", fontSize: "0.62rem", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>
    {role === "tutor" ? <GraduationCap style={{ width: 10, height: 10 }} /> : <Users style={{ width: 10, height: 10 }} />}
    {role === "tutor" ? "Tutor" : "Parent"}
  </span>
);

// ── Detail Panel ──────────────────────────────────────────────────────────────

function ReportDetailPanel({
  report,
  onClose,
  onUpdate,
}: {
  report: Report;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Report>) => void;
}) {
  const [status, setStatus]       = useState<ReportStatus>(report.status);
  const [decision, setDecision]   = useState<AdminDecision>(report.admin_decision);
  const [notes, setNotes]         = useState(report.admin_notes);
  const [saved, setSaved]         = useState(false);

  const isDirty =
    status !== report.status ||
    decision !== report.admin_decision ||
    notes !== report.admin_notes;

  const handleSave = () => {
    onUpdate(report.id, {
      status,
      admin_decision: decision,
      admin_notes: notes,
      resolved_at:
        (status === "resolved" || status === "dismissed") && !report.resolved_at
          ? "Mar 16, 2026"
          : report.resolved_at,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const s = statusCfg[status];
  const c = categoryCfg[report.category];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: "min(520px, 100vw)",
          background: "white",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          fontFamily: "'Poppins', sans-serif",
          animation: "slideIn 0.22s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flag style={{ width: 16, height: 16, color: "#dc2626" }} />
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Report #{report.id}</span>
            </div>
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.05rem" }}>{c.label}</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Filed {report.created_at}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            {/* Reporter */}
            <div className="rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Filed By</p>
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={report.reporter.full_name} role={report.reporter.role} />
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{report.reporter.full_name}</p>
                  <RoleChip role={report.reporter.role} />
                </div>
              </div>
              <p className="truncate" style={{ fontSize: "0.68rem", color: "#64748b" }}>{report.reporter.email}</p>
            </div>
            {/* Reported */}
            <div className="rounded-xl p-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Reported User</p>
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={report.reported.full_name} role={report.reported.role} />
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{report.reported.full_name}</p>
                  <RoleChip role={report.reported.role} />
                </div>
              </div>
              <p className="truncate" style={{ fontSize: "0.68rem", color: "#64748b" }}>{report.reported.email}</p>
              {report.reported.status === "blocked" && (
                <span style={{ fontSize: "0.62rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", display: "inline-block", marginTop: 4 }}>Already Blocked</span>
              )}
            </div>
          </div>

          {/* Category + booking */}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={report.category} />
            {report.booking_id && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.68rem", fontWeight: 600 }}>
                <CalendarClock style={{ width: 10, height: 10 }} />
                Booking: {report.booking_id}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Report Description</p>
            <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.65 }}>{report.description}</p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* Admin Decision Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gavel style={{ width: 15, height: 15, color: "#0d9488" }} />
              <p style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 700 }}>Admin Decision</p>
            </div>

            {/* Status */}
            <div className="mb-3">
              <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Update Status</label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "under_review", "resolved", "dismissed"] as ReportStatus[]).map((st) => {
                  const sc = statusCfg[st];
                  const active = status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatus(st)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: active ? sc.bg : "#f8fafc",
                        color: active ? sc.color : "#64748b",
                        border: active ? `1.5px solid ${sc.color}44` : "1.5px solid #e2e8f0",
                        fontSize: "0.75rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {sc.icon}{sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Decision on reported user */}
            <div className="mb-3">
              <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Action on Reported User
                <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>({report.reported.full_name})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(["warn", "suspend", "ban", "no_action"] as NonNullable<AdminDecision>[]).map((d) => {
                  const dc = decisionCfg[d];
                  const active = decision === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDecision(d === decision ? null : d)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: active ? dc.bg : "#f8fafc",
                        color: active ? dc.color : "#64748b",
                        border: active ? `1.5px solid ${dc.color}55` : "1.5px solid #e2e8f0",
                        fontSize: "0.75rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {dc.icon}{dc.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 6 }}>Click selected option again to clear.</p>
            </div>

            {/* Admin Notes */}
            <div>
              <label style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Admin Notes <span style={{ color: "#94a3b8", fontWeight: 400 }}>(internal)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add investigation notes, evidence reviewed, actions taken…"
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  padding: "10px 12px",
                  fontSize: "0.8rem",
                  color: "#334155",
                  background: "#f8fafc",
                  fontFamily: "'Poppins', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          {/* Existing notes read-only (if pre-filled) */}
          {report.resolved_at && (
            <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle style={{ width: 12, height: 12, color: "#16a34a" }} />
                <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 700 }}>Resolved on {report.resolved_at}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={!isDirty && !saved}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all"
            style={{
              background: saved ? "rgba(34,197,94,0.1)" : isDirty ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "#f1f5f9",
              color: saved ? "#16a34a" : isDirty ? "white" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.82rem",
              border: "none",
              cursor: isDirty ? "pointer" : "default",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: isDirty && !saved ? "0 4px 14px rgba(13,148,136,0.3)" : "none",
            }}
          >
            {saved ? <><CheckCircle style={{ width: 14, height: 14 }} /> Saved</> : <><Gavel style={{ width: 14, height: 14 }} /> Save Decision</>}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
          >
            Close
          </button>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>(seedReports);
  const [selected, setSelected] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<ReportCategory | "all">("all");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const handleUpdate = (id: string, patch: Partial<Report>) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterRole !== "all" && r.reported.role !== filterRole) return false;
      if (q && !r.reporter.full_name.toLowerCase().includes(q) && !r.reported.full_name.toLowerCase().includes(q) && !r.id.includes(q)) return false;
      return true;
    });
  }, [reports, search, filterStatus, filterCategory, filterRole]);

  const stats = useMemo(() => ({
    total:        reports.length,
    pending:      reports.filter((r) => r.status === "pending").length,
    under_review: reports.filter((r) => r.status === "under_review").length,
    resolved:     reports.filter((r) => r.status === "resolved").length,
    dismissed:    reports.filter((r) => r.status === "dismissed").length,
  }), [reports]);

  const statCards = [
    { label: "Total Reports",   value: stats.total,        color: "#0d9488", bg: "rgba(13,148,136,0.08)",  icon: Flag          },
    { label: "Pending",         value: stats.pending,      color: "#d97706", bg: "rgba(245,158,11,0.08)", icon: Clock         },
    { label: "Under Review",    value: stats.under_review, color: "#2563eb", bg: "rgba(59,130,246,0.08)", icon: Eye           },
    { label: "Resolved",        value: stats.resolved,     color: "#16a34a", bg: "rgba(34,197,94,0.08)",  icon: CheckCircle   },
    { label: "Dismissed",       value: stats.dismissed,    color: "#6b7280", bg: "rgba(107,114,128,0.08)",icon: XCircle       },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="mb-5">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>Reports Management</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>Review user-submitted reports and take administrative action</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 cursor-pointer transition-all duration-150"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon style={{ width: 16, height: 16, color }} />
            </div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.1 }}>{value}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center" style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
          <Search style={{ width: 15, height: 15, color: "#94a3b8", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name or report ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", fontSize: "0.82rem", color: "#0f172a", width: "100%", fontFamily: "'Poppins', sans-serif" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X style={{ width: 13, height: 13 }} /></button>}
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ReportStatus | "all")}
          style={{ borderRadius: "10px", border: "1.5px solid #e2e8f0", padding: "8px 12px", fontSize: "0.8rem", color: "#475569", background: "#f8fafc", fontFamily: "'Poppins', sans-serif", cursor: "pointer", outline: "none" }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ReportCategory | "all")}
          style={{ borderRadius: "10px", border: "1.5px solid #e2e8f0", padding: "8px 12px", fontSize: "0.8rem", color: "#475569", background: "#f8fafc", fontFamily: "'Poppins', sans-serif", cursor: "pointer", outline: "none" }}
        >
          <option value="all">All Categories</option>
          {(Object.entries(categoryCfg) as [ReportCategory, { label: string }][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
          style={{ borderRadius: "10px", border: "1.5px solid #e2e8f0", padding: "8px 12px", fontSize: "0.8rem", color: "#475569", background: "#f8fafc", fontFamily: "'Poppins', sans-serif", cursor: "pointer", outline: "none" }}
        >
          <option value="all">Reported: All Roles</option>
          <option value="parent">Reported: Parent</option>
          <option value="tutor">Reported: Tutor</option>
        </select>

        <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap", marginLeft: "auto" }}>
          {filtered.length} of {reports.length} reports
        </span>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Desktop table */}
        <div className="hidden lg:block">
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "9%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "6%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Filed By</th>
                <th style={thStyle}>Reported User</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Decision</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>
                    No reports match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none", transition: "background 0.12s", cursor: "pointer" }}
                    onClick={() => setSelected(r)}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, background: "#f1f5f9", borderRadius: "6px", padding: "2px 6px", fontFamily: "'Poppins', sans-serif" }}>
                        {r.id}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={r.reporter.full_name} role={r.reporter.role} />
                        <div className="min-w-0">
                          <p className="truncate" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{r.reporter.full_name}</p>
                          <RoleChip role={r.reporter.role} />
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={r.reported.full_name} role={r.reported.role} />
                        <div className="min-w-0">
                          <p className="truncate" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{r.reported.full_name}</p>
                          <RoleChip role={r.reported.role} />
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><CategoryBadge category={r.category} /></td>
                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                    <td style={tdStyle}><DecisionBadge decision={r.admin_decision} /></td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{r.created_at}</td>
                    <td style={tdStyle}>
                      <button
                        className="flex items-center gap-0.5 px-2 py-1 rounded-lg transition-colors"
                        style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(13,148,136,0.16)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(13,148,136,0.08)")}
                        onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                      >
                        <Eye style={{ width: 12, height: 12 }} /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col gap-0 lg:hidden divide-y" style={{ borderColor: "#f1f5f9" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem" }}>No reports match your filters.</div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="p-4 cursor-pointer transition-colors"
                onClick={() => setSelected(r)}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "0.65rem", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{r.id}</span>
                    <CategoryBadge category={r.category} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={r.status} />
                    <ChevronRight style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Filed By</p>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={r.reporter.full_name} role={r.reporter.role} />
                      <span style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{r.reporter.full_name.split(" ")[0]}</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Against</p>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={r.reported.full_name} role={r.reported.role} />
                      <span style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{r.reported.full_name.split(" ")[0]}</span>
                    </div>
                  </div>
                </div>
                <p className="line-clamp-2" style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{r.description}</p>
                {r.admin_decision && (
                  <div className="mt-2">
                    <DecisionBadge decision={r.admin_decision} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)" }}>
        <Info style={{ width: 14, height: 14, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: "0.72rem", color: "#0f172a", lineHeight: 1.6, fontFamily: "'Poppins', sans-serif" }}>
          Click any report row or <strong>Review</strong> to open the decision panel. Admin actions (warn, suspend, ban) are applied to the reported user's account. Notes are internal only and not visible to users.
        </p>
      </div>

      {/* Detail Panel */}
      {selected && (
        <ReportDetailPanel
          report={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "9px 12px",
  textAlign: "left",
  fontSize: "0.65rem",
  fontWeight: 600,
  color: "#94a3b8",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  fontFamily: "'Poppins', sans-serif",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 12px",
  fontFamily: "'Poppins', sans-serif",
  overflow: "hidden",
};
