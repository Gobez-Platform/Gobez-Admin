import { useState } from "react";
import {
  GraduationCap, Crown, Percent, Download, ChevronDown, ChevronRight,
  CheckCircle, Clock, XCircle, Banknote, TrendingUp, Calendar,
  Search, Filter,
} from "lucide-react";

// ── Schema alignment ──────────────────────────────────────────────────────────
// tutors: id, user_id, plan (free|pro), verified, rating, total_sessions
// payout_history: id, tutor_id, amount, period_start, period_end,
//                 status (pending|paid|failed), created_at, paid_at,
//                 session_count, commission_deducted, subscription_fee

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const fmt = (n: number) => `Birr ${Math.round(n).toLocaleString()}`;

// ── Mock tutor payout data ────────────────────────────────────────────────────
interface MonthlyRecord {
  month: string;
  sessions: number;
  grossValue: number;
  commissionOrSub: number;
  netPaid: number;
  status: "paid" | "pending" | "failed";
  paidAt?: string;
}

interface TutorYearData {
  id: string;
  name: string;
  plan: "free" | "pro";
  rating: number;
  verified: boolean;
  years: Record<string, MonthlyRecord[]>;
}

function genMonths(
  year: string,
  plan: "free" | "pro",
  base: number,
  subFee: number
): MonthlyRecord[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  return months.map((month, i) => {
    const isCurrentYear = parseInt(year) === currentYear;
    const isPast = !isCurrentYear || i < currentMonth;
    const isCurrent = isCurrentYear && i === currentMonth;
    const sessions = isPast || isCurrent ? Math.floor(base * (0.7 + Math.random() * 0.6)) : 0;
    const grossValue = sessions * (80 + Math.floor(Math.random() * 60));
    const commOrSub = plan === "free" ? Math.round(grossValue * 0.15) : (sessions > 0 ? subFee : 0);
    const netPaid = plan === "free" ? grossValue - commOrSub : grossValue;
    const status: MonthlyRecord["status"] = sessions === 0 ? "pending" : isPast ? "paid" : isCurrent ? "pending" : "pending";
    return {
      month,
      sessions,
      grossValue,
      commissionOrSub: commOrSub,
      netPaid,
      status,
      paidAt: status === "paid" ? `${month} ${parseInt(year)}, 28` : undefined,
    };
  });
}

const TUTORS: TutorYearData[] = [
  {
    id: "t1", name: "Daniel Osei",      plan: "free", rating: 4.8, verified: true,
    years: {
      "2026": genMonths("2026", "free", 8, 0),
      "2025": genMonths("2025", "free", 7, 0),
      "2024": genMonths("2024", "free", 5, 0),
    },
  },
  {
    id: "t2", name: "Abena Asante",     plan: "pro",  rating: 4.9, verified: true,
    years: {
      "2026": genMonths("2026", "pro", 7, 499),
      "2025": genMonths("2025", "pro", 6, 499),
      "2024": genMonths("2024", "pro", 4, 499),
    },
  },
  {
    id: "t3", name: "Samuel Boateng",   plan: "free", rating: 4.5, verified: true,
    years: {
      "2026": genMonths("2026", "free", 6, 0),
      "2025": genMonths("2025", "free", 5, 0),
      "2024": genMonths("2024", "free", 3, 0),
    },
  },
  {
    id: "t4", name: "Linda Owusu",      plan: "pro",  rating: 4.7, verified: true,
    years: {
      "2026": genMonths("2026", "pro", 6, 499),
      "2025": genMonths("2025", "pro", 5, 499),
      "2024": genMonths("2024", "pro", 3, 499),
    },
  },
  {
    id: "t5", name: "Yaw Darko",        plan: "free", rating: 4.3, verified: false,
    years: {
      "2026": genMonths("2026", "free", 5, 0),
      "2025": genMonths("2025", "free", 4, 0),
      "2024": genMonths("2024", "free", 2, 0),
    },
  },
  {
    id: "t6", name: "Fatima Al-Hassan", plan: "free", rating: 4.6, verified: true,
    years: {
      "2026": genMonths("2026", "free", 4, 0),
      "2025": genMonths("2025", "free", 3, 0),
    },
  },
  {
    id: "t7", name: "Kojo Mensah",      plan: "pro",  rating: 4.4, verified: true,
    years: {
      "2026": genMonths("2026", "pro", 4, 499),
      "2025": genMonths("2025", "pro", 3, 499),
    },
  },
  {
    id: "t8", name: "Mekdes Haile",     plan: "pro",  rating: 4.9, verified: true,
    years: {
      "2026": genMonths("2026", "pro", 7, 499),
      "2025": genMonths("2025", "pro", 6, 499),
    },
  },
];

const YEARS = ["2026", "2025", "2024"];

const statusCfg = {
  paid:    { label: "Paid",    color: "#16a34a", bg: "rgba(34,197,94,0.1)",    icon: CheckCircle },
  pending: { label: "Pending", color: "#d97706", bg: "rgba(245,158,11,0.1)",   icon: Clock       },
  failed:  { label: "Failed",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",    icon: XCircle     },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "paid" | "pending" | "failed" }) {
  const cfg = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: 600, whiteSpace: "nowrap", ...poppins }}>
      <cfg.icon style={{ width: 9, height: 9 }} />
      {cfg.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: plan === "pro" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.08)", color: plan === "pro" ? "#d97706" : "#64748b", fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
      {plan === "pro" ? <Crown style={{ width: 9, height: 9 }} /> : <Percent style={{ width: 9, height: 9 }} />}
      {plan === "pro" ? "Pro" : "Free"}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function PayoutHistory() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [expandedTutor, setExpandedTutor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  const filteredTutors = TUTORS.filter(t => {
    if (!t.years[selectedYear]) return false;
    if (planFilter !== "all" && t.plan !== planFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Aggregate yearly summary for each tutor
  function yearSummary(t: TutorYearData) {
    const months = t.years[selectedYear] || [];
    const activeMos = months.filter(m => m.sessions > 0);
    return {
      totalSessions: activeMos.reduce((s, m) => s + m.sessions, 0),
      grossValue:    activeMos.reduce((s, m) => s + m.grossValue, 0),
      totalDeducted: activeMos.reduce((s, m) => s + m.commissionOrSub, 0),
      netPaid:       activeMos.reduce((s, m) => s + m.netPaid, 0),
      paidMonths:    months.filter(m => m.status === "paid").length,
      pendingMonths: months.filter(m => m.status === "pending" && m.sessions > 0).length,
    };
  }

  // Global KPIs
  const allMonths = filteredTutors.flatMap(t => (t.years[selectedYear] || []).filter(m => m.sessions > 0));
  const totalNetPaid  = allMonths.reduce((s, m) => s + m.netPaid, 0);
  const totalGross    = allMonths.reduce((s, m) => s + m.grossValue, 0);
  const totalDeducted = allMonths.reduce((s, m) => s + m.commissionOrSub, 0);
  const totalSessions = allMonths.reduce((s, m) => s + m.sessions, 0);

  return (
    <div style={poppins}>
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
            Payout History
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
            Per-tutor earnings, commissions &amp; net payouts by year
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "white", border: "1px solid #e2e8f0" }}>
            {YEARS.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{ background: selectedYear === y ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "transparent", color: selectedYear === y ? "white" : "#64748b", fontWeight: selectedYear === y ? 600 : 500, fontSize: "0.78rem", border: "none", cursor: "pointer", boxShadow: selectedYear === y ? "0 2px 8px rgba(13,148,136,0.3)" : "none", ...poppins }}>
                <Calendar style={{ width: 12, height: 12 }} />
                {y}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
            style={{ background: "white", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", ...poppins }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#0d9488"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
            <Download style={{ width: 13, height: 13 }} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Gross Value",   value: fmt(totalGross),    sub: `${totalSessions} sessions`, color: "#0d9488", bg: "rgba(13,148,136,0.08)", icon: Banknote    },
          { label: "Platform Deductions", value: fmt(totalDeducted), sub: "Commission + subscriptions",  color: "#d97706", bg: "rgba(245,158,11,0.08)",  icon: Percent     },
          { label: "Total Net Paid",      value: fmt(totalNetPaid),  sub: "Paid to tutors",              color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  icon: TrendingUp  },
          { label: "Active Tutors",       value: String(filteredTutors.length), sub: `in ${selectedYear}`, color: "#0f172a", bg: "#f1f5f9", icon: GraduationCap },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4 transition-all duration-200"
            style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
              <card.icon style={{ width: 16, height: 16, color: card.color }} />
            </div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.1 }}>{card.value}</p>
            <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: 2 }}>{card.label}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.65rem", marginTop: 1 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tutor…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.8rem", outline: "none", background: "white", ...poppins, color: "#0f172a" }}
            onFocus={e => { e.target.style.border = "1.5px solid #0d9488"; }}
            onBlur={e => { e.target.style.border = "1.5px solid #e2e8f0"; }} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          {(["all", "pro", "free"] as const).map(f => (
            <button key={f} onClick={() => setPlanFilter(f)}
              className="px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ background: planFilter === f ? "#f1f5f9" : "transparent", color: planFilter === f ? "#0d9488" : "#64748b", fontWeight: planFilter === f ? 600 : 500, fontSize: "0.72rem", border: "none", cursor: "pointer", ...poppins }}>
              {f === "all" ? "All Plans" : f === "pro" ? "Pro" : "Free"}
            </button>
          ))}
        </div>
      </div>

      {/* Tutor accordion list */}
      <div className="flex flex-col gap-3">
        {filteredTutors.map(tutor => {
          const summary = yearSummary(tutor);
          const months = (tutor.years[selectedYear] || []);
          const isOpen = expandedTutor === tutor.id;

          return (
            <div key={tutor.id} className="rounded-2xl overflow-hidden"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
              {/* Tutor row header */}
              <button
                onClick={() => setExpandedTutor(isOpen ? null : tutor.id)}
                className="w-full text-left"
                style={{ background: "none", border: "none", cursor: "pointer" }}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tutor.plan === "pro" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#8b5cf6,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0 }}>
                    {tutor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", ...poppins }}>{tutor.name}</p>
                      <PlanBadge plan={tutor.plan} />
                      {tutor.verified && (
                        <span style={{ fontSize: "0.6rem", color: "#16a34a", fontWeight: 700, background: "rgba(34,197,94,0.08)", padding: "1px 5px", borderRadius: 4, ...poppins }}>✓ Verified</span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1, ...poppins }}>
                      ⭐ {tutor.rating} · {summary.totalSessions} sessions in {selectedYear} · {summary.paidMonths} months paid
                    </p>
                  </div>
                  {/* Summary numbers */}
                  <div className="hidden md:grid grid-cols-3 gap-4 text-right">
                    {[
                      { label: "Gross", value: fmt(summary.grossValue), color: "#0f172a" },
                      { label: tutor.plan === "pro" ? "Sub Fee" : "Commission", value: fmt(summary.totalDeducted), color: "#d97706" },
                      { label: "Net Paid", value: fmt(summary.netPaid), color: "#0d9488" },
                    ].map(col => (
                      <div key={col.label}>
                        <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", ...poppins }}>{col.label}</p>
                        <p style={{ fontSize: "0.88rem", fontWeight: 700, color: col.color, ...poppins }}>{col.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ color: "#94a3b8", flexShrink: 0 }}>
                    {isOpen ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
                  </div>
                </div>
              </button>

              {/* Monthly breakdown */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #f1f5f9" }}>
                  {/* Mobile summary */}
                  <div className="grid grid-cols-3 gap-3 px-5 py-3 md:hidden" style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    {[
                      { label: "Gross", value: fmt(summary.grossValue) },
                      { label: tutor.plan === "pro" ? "Sub Fee" : "Comm", value: fmt(summary.totalDeducted) },
                      { label: "Net Paid", value: fmt(summary.netPaid) },
                    ].map(col => (
                      <div key={col.label} className="text-center">
                        <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", ...poppins }}>{col.label}</p>
                        <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", ...poppins }}>{col.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Monthly table */}
                  <div className="overflow-x-auto">
                    <table style={{ width: "100%", borderCollapse: "collapse", ...poppins }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Month", "Sessions", "Gross Value", tutor.plan === "pro" ? "Sub Fee" : "Commission (15%)", "Net Paid", "Status", "Paid On"].map(h => (
                            <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "0.6rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {months.map((m, i) => (
                          <tr key={`${tutor.id}-${m.month}`}
                            style={{ borderTop: "1px solid #f8fafc", opacity: m.sessions === 0 ? 0.4 : 1 }}>
                            <td style={{ padding: "10px 14px", fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{m.month}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "#475569" }}>{m.sessions}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "#0f172a", fontWeight: 500 }}>{m.sessions > 0 ? fmt(m.grossValue) : "—"}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: m.commissionOrSub > 0 ? "#d97706" : "#94a3b8", fontWeight: m.commissionOrSub > 0 ? 600 : 400 }}>
                              {m.commissionOrSub > 0 ? `− ${fmt(m.commissionOrSub)}` : "—"}
                            </td>
                            <td style={{ padding: "10px 14px", fontSize: "0.8rem", fontWeight: 700, color: m.sessions > 0 ? "#0d9488" : "#94a3b8" }}>
                              {m.sessions > 0 ? fmt(m.netPaid) : "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              {m.sessions > 0 ? <StatusBadge status={m.status} /> : <span style={{ fontSize: "0.68rem", color: "#cbd5e1" }}>No activity</span>}
                            </td>
                            <td style={{ padding: "10px 14px", fontSize: "0.72rem", color: "#94a3b8" }}>
                              {m.paidAt ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Year total row */}
                      <tfoot>
                        <tr style={{ background: "rgba(13,148,136,0.04)", borderTop: "2px solid #e2e8f0" }}>
                          <td colSpan={2} style={{ padding: "10px 14px", fontSize: "0.78rem", fontWeight: 700, color: "#0d9488" }}>Year Total</td>
                          <td style={{ padding: "10px 14px", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{fmt(summary.grossValue)}</td>
                          <td style={{ padding: "10px 14px", fontSize: "0.82rem", fontWeight: 700, color: "#d97706" }}>− {fmt(summary.totalDeducted)}</td>
                          <td style={{ padding: "10px 14px", fontSize: "0.88rem", fontWeight: 700, color: "#0d9488" }}>{fmt(summary.netPaid)}</td>
                          <td colSpan={2} style={{ padding: "10px 14px", fontSize: "0.72rem", color: "#94a3b8" }}>
                            {summary.paidMonths} paid · {summary.pendingMonths} pending
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTutors.length === 0 && (
          <div className="rounded-2xl p-12 flex flex-col items-center gap-3" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <GraduationCap style={{ width: 32, height: 32, color: "#e2e8f0" }} />
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", ...poppins }}>No tutors found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
