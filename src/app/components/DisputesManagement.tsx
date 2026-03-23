import { useState } from "react";
import {
  AlertTriangle, CheckCircle, XCircle, Clock, MessageSquare,
  Search, Filter, X, ChevronRight, Banknote, User,
  GraduationCap, Calendar, FileText, RefreshCcw, ShieldCheck,
  Info, Gavel, Send, Eye,
} from "lucide-react";

// ── Schema alignment ──────────────────────────────────────────────────────────
// disputes: id, booking_id, raised_by (parent_id | tutor_id), raised_by_role,
//           against_id, against_role, reason, description, amount_disputed,
//           status (open|under_review|approved|rejected|escalated),
//           resolution, admin_notes, created_at, resolved_at
//
// refund_requests: id, dispute_id, booking_id, parent_id, tutor_id,
//                  amount_requested, amount_approved, reason,
//                  status (pending|approved|rejected|partial),
//                  approved_by_admin_id, created_at, processed_at

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const fmt = (n: number) => `Birr ${Math.round(n).toLocaleString()}`;

type DisputeStatus = "open" | "under_review" | "approved" | "rejected" | "escalated";
type DisputeReason = "no_show" | "quality" | "payment" | "misconduct" | "cancel_refund" | "other";

interface Dispute {
  id: string;
  bookingId: string;
  raisedByName: string;
  raisedByRole: "parent" | "tutor";
  againstName: string;
  againstRole: "parent" | "tutor";
  reason: DisputeReason;
  description: string;
  amountDisputed: number;
  amountApproved?: number;
  status: DisputeStatus;
  resolution?: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  subject: string;
  sessionDate: string;
}

const DISPUTES: Dispute[] = [
  {
    id: "DSP-001", bookingId: "a3f1c2d4", raisedByName: "Sarah Johnson", raisedByRole: "parent",
    againstName: "Daniel Osei", againstRole: "tutor",
    reason: "no_show", description: "The tutor did not show up for the scheduled online session. My child waited for 45 minutes. I want a full refund for this session.",
    amountDisputed: 120, status: "open", createdAt: "Mar 14, 2026", subject: "Mathematics", sessionDate: "Mar 13, 2026",
  },
  {
    id: "DSP-002", bookingId: "b9e2a871", raisedByName: "Kwame Mensah", raisedByRole: "parent",
    againstName: "Abena Asante", againstRole: "tutor",
    reason: "quality", description: "The tutor spent only 30 minutes out of the agreed 1 hour and was unprepared. Requesting a 50% partial refund.",
    amountDisputed: 90, amountApproved: 45, status: "approved", resolution: "Partial refund approved — tutor confirmed early termination. 50% refunded.",
    adminNotes: "Reviewed session logs. Tutor confirmed 30-min session.", createdAt: "Mar 12, 2026", resolvedAt: "Mar 13, 2026", subject: "English", sessionDate: "Mar 11, 2026",
  },
  {
    id: "DSP-003", bookingId: "c4d7f093", raisedByName: "Emily Clarke", raisedByRole: "parent",
    againstName: "Samuel Boateng", againstRole: "tutor",
    reason: "cancel_refund", description: "I cancelled the session 4 hours before the scheduled time due to a family emergency. The tutor is refusing to provide a refund despite the platform policy.",
    amountDisputed: 90, status: "under_review", adminNotes: "Checking cancellation policy and tutor's response.", createdAt: "Mar 13, 2026", subject: "Science", sessionDate: "Mar 15, 2026",
  },
  {
    id: "DSP-004", bookingId: "d1b5e230", raisedByName: "Yaw Darko", raisedByRole: "tutor",
    againstName: "David Acheampong", againstRole: "parent",
    reason: "payment", description: "The parent has not released the session payment 5 days after the completed lesson. Session was completed successfully on March 8th.",
    amountDisputed: 300, status: "under_review", createdAt: "Mar 13, 2026", subject: "French & History", sessionDate: "Mar 8, 2026",
  },
  {
    id: "DSP-005", bookingId: "e8c3a119", raisedByName: "Ama Serwaa", raisedByRole: "parent",
    againstName: "Grace Asiedu", againstRole: "tutor",
    reason: "misconduct", description: "The tutor was rude and dismissive during the session and made inappropriate comments. I demand a full refund and immediate review of this tutor.",
    amountDisputed: 90, status: "escalated", createdAt: "Mar 11, 2026", subject: "Mathematics", sessionDate: "Mar 10, 2026",
  },
  {
    id: "DSP-006", bookingId: "f2d9b447", raisedByName: "James Opoku", raisedByRole: "parent",
    againstName: "Kojo Mensah", againstRole: "tutor",
    reason: "cancel_refund", description: "Tutor cancelled 2 hours before session without adequate notice. I had already prepared my child. Requesting full refund.",
    amountDisputed: 200, amountApproved: 0, status: "rejected", resolution: "Cancelled within the 24hr policy window by tutor — rescheduled offered and declined by parent. No refund.",
    adminNotes: "Tutor provided 2hr notice; platform policy requires 4hr. Partial grace given.", createdAt: "Mar 10, 2026", resolvedAt: "Mar 11, 2026", subject: "Coding", sessionDate: "Mar 12, 2026",
  },
  {
    id: "DSP-007", bookingId: "g7f4c882", raisedByName: "Nana Yaa Boateng", raisedByRole: "parent",
    againstName: "Linda Owusu", againstRole: "tutor",
    reason: "quality", description: "Tutor is not matching the described experience level. My child is struggling because lessons are not appropriate for their grade.",
    amountDisputed: 110, status: "open", createdAt: "Mar 15, 2026", subject: "History & English", sessionDate: "Mar 14, 2026",
  },
  {
    id: "DSP-008", bookingId: "h5a2d631", raisedByName: "Michael Asare", raisedByRole: "parent",
    againstName: "Fatima Al-Hassan", againstRole: "tutor",
    reason: "other", description: "The tutor has been rescheduling without proper notice repeatedly. We have had 3 cancellations this month.",
    amountDisputed: 160, status: "open", createdAt: "Mar 16, 2026", subject: "English", sessionDate: "Multiple",
  },
];

const statusCfg: Record<DisputeStatus, { label: string; color: string; bg: string; icon: any }> = {
  open:         { label: "Open",         color: "#d97706", bg: "rgba(245,158,11,0.1)",   icon: Clock       },
  under_review: { label: "Under Review", color: "#2563eb", bg: "rgba(59,130,246,0.1)",   icon: RefreshCcw  },
  approved:     { label: "Approved",     color: "#16a34a", bg: "rgba(34,197,94,0.1)",     icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.1)",     icon: XCircle     },
  escalated:    { label: "Escalated",    color: "#7c3aed", bg: "rgba(124,58,237,0.1)",    icon: AlertTriangle },
};

const reasonCfg: Record<DisputeReason, { label: string; color: string }> = {
  no_show:      { label: "No Show",        color: "#ef4444" },
  quality:      { label: "Quality Issue",  color: "#d97706" },
  payment:      { label: "Payment",        color: "#0d9488" },
  misconduct:   { label: "Misconduct",     color: "#7c3aed" },
  cancel_refund:{ label: "Cancel/Refund",  color: "#2563eb" },
  other:        { label: "Other",          color: "#64748b" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DisputeStatus }) {
  const cfg = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap", ...poppins }}>
      <cfg.icon style={{ width: 9, height: 9 }} />
      {cfg.label}
    </span>
  );
}

function ReasonBadge({ reason }: { reason: DisputeReason }) {
  const cfg = reasonCfg[reason];
  return (
    <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.65rem", fontWeight: 600, padding: "2px 7px", borderRadius: 5, ...poppins }}>
      {cfg.label}
    </span>
  );
}

function Avatar({ name, role }: { name: string; role: "parent" | "tutor" }) {
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: role === "tutor" ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "linear-gradient(135deg,#8b5cf6,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.55rem", fontWeight: 700, flexShrink: 0 }}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────
function DetailPanel({ dispute, onClose, onAction }: { dispute: Dispute; onClose: () => void; onAction: (id: string, action: string, notes: string) => void }) {
  const [notes, setNotes] = useState(dispute.adminNotes || "");
  const [approveAmount, setApproveAmount] = useState(String(dispute.amountDisputed));

  const canAct = dispute.status === "open" || dispute.status === "under_review" || dispute.status === "escalated";

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="ml-auto h-full overflow-y-auto w-full max-w-lg" style={{ background: "white", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", ...poppins }}>Dispute Details</p>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginTop: 2, ...poppins }}>{dispute.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={dispute.status} />
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X style={{ width: 14, height: 14, color: "#64748b" }} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Booking info */}
          <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, ...poppins }}>Booking Reference</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Booking ID",    value: `#${dispute.bookingId}` },
                { label: "Subject",       value: dispute.subject },
                { label: "Session Date",  value: dispute.sessionDate },
                { label: "Amount",        value: fmt(dispute.amountDisputed) },
              ].map(row => (
                <div key={row.label}>
                  <p style={{ fontSize: "0.6rem", color: "#94a3b8", ...poppins }}>{row.label}</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", marginTop: 1, ...poppins }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parties */}
          <div>
            <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, ...poppins }}>Parties Involved</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: dispute.raisedByName, role: dispute.raisedByRole, label: "Filed By" },
                { name: dispute.againstName, role: dispute.againstRole, label: "Filed Against" },
              ].map(p => (
                <div key={p.label} className="rounded-xl p-3 flex items-center gap-2" style={{ background: "white", border: "1px solid #f1f5f9" }}>
                  <Avatar name={p.name} role={p.role as any} />
                  <div>
                    <p style={{ fontSize: "0.6rem", color: "#94a3b8", ...poppins }}>{p.label}</p>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{p.name}</p>
                    <span style={{ fontSize: "0.6rem", color: p.role === "tutor" ? "#0d9488" : "#8b5cf6", fontWeight: 600, textTransform: "capitalize" }}>{p.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason & Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", ...poppins }}>Reason</p>
              <ReasonBadge reason={dispute.reason} />
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <p style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.6, ...poppins }}>{dispute.description}</p>
            </div>
          </div>

          {/* Resolution (if resolved) */}
          {dispute.resolution && (
            <div>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, ...poppins }}>Resolution</p>
              <div className="rounded-xl p-4" style={{ background: dispute.status === "approved" ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${dispute.status === "approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <p style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.6, ...poppins }}>{dispute.resolution}</p>
                {dispute.amountApproved !== undefined && (
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0d9488", marginTop: 8, ...poppins }}>
                    Refund approved: {fmt(dispute.amountApproved)}
                  </p>
                )}
                {dispute.resolvedAt && (
                  <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 4, ...poppins }}>Resolved on {dispute.resolvedAt}</p>
                )}
              </div>
            </div>
          )}

          {/* Admin notes */}
          <div>
            <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, ...poppins }}>Admin Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={!canAct}
              placeholder="Add internal notes about this dispute…"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.8rem", outline: "none", background: canAct ? "#f8fafc" : "#f8fafc", color: "#0f172a", resize: "vertical", ...poppins, boxSizing: "border-box", opacity: canAct ? 1 : 0.7 }}
              onFocus={e => { if (canAct) e.target.style.border = "1.5px solid #0d9488"; }}
              onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"}
            />
          </div>

          {/* Action buttons */}
          {canAct && (
            <div>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, ...poppins }}>Actions</p>

              {/* Refund amount */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#64748b", ...poppins }}>Birr</span>
                  <input
                    type="number"
                    value={approveAmount}
                    onChange={e => setApproveAmount(e.target.value)}
                    style={{ width: "100%", paddingLeft: 42, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.8rem", outline: "none", background: "#f8fafc", color: "#0f172a", ...poppins, boxSizing: "border-box" }}
                    onFocus={e => e.target.style.border = "1.5px solid #0d9488"}
                    onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"}
                    placeholder="Refund amount"
                  />
                </div>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", whiteSpace: "nowrap", ...poppins }}>of {fmt(dispute.amountDisputed)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onAction(dispute.id, "under_review", notes)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", fontWeight: 600, fontSize: "0.78rem", border: "1.5px solid rgba(59,130,246,0.2)", cursor: "pointer", ...poppins }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}>
                  <RefreshCcw style={{ width: 12, height: 12 }} /> Mark Under Review
                </button>
                <button onClick={() => onAction(dispute.id, "escalated", notes)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", fontWeight: 600, fontSize: "0.78rem", border: "1.5px solid rgba(124,58,237,0.2)", cursor: "pointer", ...poppins }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}>
                  <AlertTriangle style={{ width: 12, height: 12 }} /> Escalate
                </button>
                <button onClick={() => onAction(dispute.id, "rejected", notes)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 600, fontSize: "0.78rem", border: "1.5px solid rgba(239,68,68,0.2)", cursor: "pointer", ...poppins }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                  <XCircle style={{ width: 12, height: 12 }} /> Reject Refund
                </button>
                <button onClick={() => onAction(dispute.id, "approved", notes)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white", fontWeight: 600, fontSize: "0.78rem", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)", ...poppins }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#0f766e,#0d9488)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#0d9488,#14b8a6)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <CheckCircle style={{ width: 12, height: 12 }} /> Approve Refund
                </button>
              </div>
            </div>
          )}

          {/* Created at */}
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", textAlign: "center", ...poppins }}>
            Dispute filed on {dispute.createdAt}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function DisputesManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>(DISPUTES);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [reasonFilter, setReasonFilter] = useState<DisputeReason | "all">("all");

  const filtered = disputes.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (reasonFilter !== "all" && d.reason !== reasonFilter) return false;
    if (search && !d.raisedByName.toLowerCase().includes(search.toLowerCase()) &&
        !d.againstName.toLowerCase().includes(search.toLowerCase()) &&
        !d.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (id: string, action: string, notes: string) => {
    setDisputes(prev => prev.map(d => d.id === id
      ? { ...d, status: action as DisputeStatus, adminNotes: notes, resolvedAt: ["approved", "rejected"].includes(action) ? "Mar 16, 2026" : undefined }
      : d));
    setSelected(prev => prev?.id === id ? { ...prev, status: action as DisputeStatus, adminNotes: notes } : prev);
  };

  const counts = {
    open:         disputes.filter(d => d.status === "open").length,
    under_review: disputes.filter(d => d.status === "under_review").length,
    escalated:    disputes.filter(d => d.status === "escalated").length,
    approved:     disputes.filter(d => d.status === "approved").length,
    rejected:     disputes.filter(d => d.status === "rejected").length,
  };
  const totalDisputed = disputes.reduce((s, d) => s + d.amountDisputed, 0);
  const totalApproved = disputes.filter(d => d.status === "approved").reduce((s, d) => s + (d.amountApproved ?? 0), 0);

  return (
    <div style={poppins}>
      {/* Header */}
      <div className="mb-5">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
          Disputes &amp; Refunds
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
          Review, approve or reject booking disputes and refund requests
        </p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Open",         value: counts.open,         color: "#d97706", bg: "rgba(245,158,11,0.08)",  icon: Clock         },
          { label: "Under Review", value: counts.under_review, color: "#2563eb", bg: "rgba(59,130,246,0.08)",  icon: RefreshCcw    },
          { label: "Escalated",    value: counts.escalated,    color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  icon: AlertTriangle  },
          { label: "Resolved",     value: counts.approved + counts.rejected, color: "#16a34a", bg: "rgba(34,197,94,0.08)", icon: CheckCircle },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
              <card.icon style={{ width: 16, height: 16, color: card.color }} />
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Amount summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
            <Banknote style={{ width: 18, height: 18, color: "#ef4444" }} />
          </div>
          <div>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{fmt(totalDisputed)}</p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Total amount in dispute</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.08)" }}>
            <ShieldCheck style={{ width: 18, height: 18, color: "#0d9488" }} />
          </div>
          <div>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0d9488" }}>{fmt(totalApproved)}</p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Total refunds approved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.8rem", outline: "none", background: "white", ...poppins, color: "#0f172a" }}
            onFocus={e => e.target.style.border = "1.5px solid #0d9488"}
            onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"} />
        </div>
        <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          {(["all", "open", "under_review", "escalated", "approved", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{ background: statusFilter === s ? "#f1f5f9" : "transparent", color: statusFilter === s ? "#0d9488" : "#64748b", fontWeight: statusFilter === s ? 600 : 500, fontSize: "0.7rem", border: "none", cursor: "pointer", ...poppins }}>
              {s === "all" ? "All" : s === "under_review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && counts[s as keyof typeof counts] !== undefined && (
                <span style={{ marginLeft: 4, background: "rgba(13,148,136,0.1)", color: "#0d9488", borderRadius: 4, padding: "0 4px", fontSize: "0.6rem" }}>{counts[s as keyof typeof counts]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes list */}
      <div className="flex flex-col gap-3">
        {filtered.map(d => {
          const stCfg = statusCfg[d.status];
          return (
            <div key={d.id}
              className="rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-150"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
              onClick={() => setSelected(d)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "#f1f5f9"; }}>
              <div className="flex flex-wrap items-start gap-3">
                {/* Left — ID + status */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, background: "#f1f5f9", padding: "2px 7px", borderRadius: 6, ...poppins }}>{d.id}</span>
                    <StatusBadge status={d.status} />
                    <ReasonBadge reason={d.reason} />
                  </div>

                  {/* Parties */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={d.raisedByName} role={d.raisedByRole} />
                      <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{d.raisedByName}</p>
                        <p style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "capitalize", ...poppins }}>{d.raisedByRole}</p>
                      </div>
                    </div>
                    <ChevronRight style={{ width: 12, height: 12, color: "#cbd5e1" }} />
                    <div className="flex items-center gap-1.5">
                      <Avatar name={d.againstName} role={d.againstRole} />
                      <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{d.againstName}</p>
                        <p style={{ fontSize: "0.6rem", color: "#94a3b8", textTransform: "capitalize", ...poppins }}>{d.againstRole}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description preview */}
                  <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, ...poppins, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.description}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins }}>📅 Filed {d.createdAt}</span>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins }}>📚 {d.subject}</span>
                  </div>
                </div>

                {/* Right — amount + action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p style={{ fontSize: "0.62rem", color: "#94a3b8", ...poppins }}>Disputed</p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", ...poppins }}>{fmt(d.amountDisputed)}</p>
                    {d.amountApproved !== undefined && (
                      <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#0d9488", ...poppins }}>Approved: {fmt(d.amountApproved)}</p>
                    )}
                  </div>
                  <button
                    style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, ...poppins }}
                    onClick={e => { e.stopPropagation(); setSelected(d); }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(13,148,136,0.15)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(13,148,136,0.08)"}>
                    <Eye style={{ width: 12, height: 12 }} /> Review
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl p-12 flex flex-col items-center gap-3" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <Gavel style={{ width: 32, height: 32, color: "#e2e8f0" }} />
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", ...poppins }}>No disputes match the current filters.</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          dispute={disputes.find(d => d.id === selected.id) || selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
