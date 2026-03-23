import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Wifi,
  MapPin,
  AlertCircle,
  Activity,
} from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const monthlyData = [
  { month: "Sep", bookings: 38, revenue: 2280 },
  { month: "Oct", bookings: 52, revenue: 3120 },
  { month: "Nov", bookings: 47, revenue: 2820 },
  { month: "Dec", bookings: 61, revenue: 3660 },
  { month: "Jan", bookings: 55, revenue: 3300 },
  { month: "Feb", bookings: 74, revenue: 4440 },
  { month: "Mar", bookings: 89, revenue: 5340 },
];

const subjectData = [
  { subject: "Math",    count: 42 },
  { subject: "English", count: 35 },
  { subject: "Science", count: 28 },
  { subject: "Coding",  count: 22 },
  { subject: "History", count: 18 },
  { subject: "French",  count: 14 },
];
const subjectMax = Math.max(...subjectData.map(d => d.count));

const bookings = [
  { id: "a3f1c2d4", parent: "Sarah Johnson",    tutor: "Daniel Osei",    subjects: ["Mathematics", "Science"],  numberOfKids: 1, mode: "online"    as const, totalPrice: "Birr 120", status: "pending",   createdAt: "Mar 12, 2026" },
  { id: "b9e2a871", parent: "Kwame Mensah",     tutor: "Abena Asante",   subjects: ["English"],                 numberOfKids: 2, mode: "in_person" as const, totalPrice: "Birr 180", status: "accepted",  createdAt: "Mar 12, 2026" },
  { id: "c4d7f093", parent: "Emily Clarke",     tutor: "Samuel Boateng", subjects: ["Science"],                 numberOfKids: 1, mode: "online"    as const, totalPrice: "Birr 90",  status: "completed", createdAt: "Mar 11, 2026" },
  { id: "d1b5e230", parent: "David Acheampong", tutor: "Linda Owusu",    subjects: ["French", "History"],       numberOfKids: 3, mode: "in_person" as const, totalPrice: "Birr 300", status: "active",    createdAt: "Mar 11, 2026" },
  { id: "e8c3a119", parent: "Ama Serwaa",       tutor: "Daniel Osei",    subjects: ["Mathematics"],             numberOfKids: 1, mode: "online"    as const, totalPrice: "Birr 90",  status: "pending",   createdAt: "Mar 13, 2026" },
  { id: "f2d9b447", parent: "James Opoku",      tutor: "Yaw Darko",      subjects: ["Coding"],                  numberOfKids: 2, mode: "in_person" as const, totalPrice: "Birr 200", status: "cancelled", createdAt: "Mar 10, 2026" },
  { id: "g7f4c882", parent: "Nana Yaa Boateng", tutor: "Abena Asante",  subjects: ["History", "English"],      numberOfKids: 1, mode: "online"    as const, totalPrice: "Birr 110", status: "declined",  createdAt: "Mar 14, 2026" },
  { id: "h5a2d631", parent: "Michael Asare",    tutor: "Linda Owusu",    subjects: ["English"],                 numberOfKids: 2, mode: "in_person" as const, totalPrice: "Birr 160", status: "completed", createdAt: "Mar 10, 2026" },
];

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: ReactNode }> = {
  pending:   { label: "Pending",   bg: "rgba(245,158,11,0.1)",  color: "#d97706", icon: <Clock       style={{ width: 11, height: 11 }} /> },
  accepted:  { label: "Accepted",  bg: "rgba(59,130,246,0.1)",  color: "#2563eb", icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  active:    { label: "Active",    bg: "rgba(13,148,136,0.1)",  color: "#0d9488", icon: <Activity    style={{ width: 11, height: 11 }} /> },
  completed: { label: "Completed", bg: "rgba(34,197,94,0.1)",   color: "#16a34a", icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  cancelled: { label: "Cancelled", bg: "rgba(239,68,68,0.1)",   color: "#ef4444", icon: <XCircle     style={{ width: 11, height: 11 }} /> },
  declined:  { label: "Declined",  bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: <AlertCircle style={{ width: 11, height: 11 }} /> },
};

const statCards = [
  { label: "Total Parents",  value: "1,284", change: "+12%",  up: true, icon: Users,        color: "#0d9488", bg: "rgba(13,148,136,0.08)"  },
  { label: "Total Tutors",   value: "148",   change: "+5%",   up: true, icon: GraduationCap, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
  { label: "Booking Rate",   value: "87.4%", change: "+3.2%", up: true, icon: CalendarCheck, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { label: "This Month",     value: "89",    change: "+20%",  up: true, icon: TrendingUp,    color: "#ef4444", bg: "rgba(239,68,68,0.08)"  },
];

// ── Pure SVG dual-line chart (no Recharts) ────────────────────────────────────

function DualLineChart() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 480, H = 160, padL = 36, padR = 12, padT = 10, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxB = Math.max(...monthlyData.map(d => d.bookings));
  const maxR = Math.max(...monthlyData.map(d => d.revenue));
  const n = monthlyData.length;

  const bx = (i: number) => padL + (i / (n - 1)) * innerW;
  const by = (v: number) => padT + innerH - (v / maxB) * innerH;
  const ry = (v: number) => padT + innerH - (v / maxR) * innerH;

  const bPath = monthlyData.map((d, i) => `${i === 0 ? "M" : "L"}${bx(i).toFixed(1)},${by(d.bookings).toFixed(1)}`).join(" ");
  const rPath = monthlyData.map((d, i) => `${i === 0 ? "M" : "L"}${bx(i).toFixed(1)},${ry(d.revenue).toFixed(1)}`).join(" ");

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {/* Grid lines */}
        {yTicks.map(pct => {
          const yy = padT + innerH - (pct / 100) * innerH;
          return (
            <g key={`grid-${pct}`}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#f1f5f9" strokeWidth={1} />
              <text x={padL - 4} y={yy + 3.5} textAnchor="end" fontSize={8} fill="#94a3b8" fontFamily="Poppins">{pct}%</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {monthlyData.map((d, i) => (
          <text key={`xl-${i}`} x={bx(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="Poppins">{d.month}</text>
        ))}

        {/* Revenue line (dashed, purple) */}
        <path d={rPath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Bookings line (solid, teal) */}
        <path d={bPath} fill="none" stroke="#0d9488" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + hover targets */}
        {monthlyData.map((d, i) => (
          <g key={`pt-${i}`}>
            <circle cx={bx(i)} cy={ry(d.revenue)} r={3} fill="#8b5cf6" />
            <circle cx={bx(i)} cy={by(d.bookings)} r={3} fill="#0d9488" />
            {/* invisible wide hit target */}
            <rect
              x={bx(i) - 16} y={padT} width={32} height={innerH}
              fill="transparent"
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
                setTooltip({ x: bx(i), y: by(d.bookings), idx: i });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}

        {/* Tooltip vertical line */}
        {tooltip !== null && (
          <line x1={bx(tooltip.idx)} y1={padT} x2={bx(tooltip.idx)} y2={padT + innerH} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 2" />
        )}
      </svg>

      {/* Floating tooltip box */}
      {tooltip !== null && (() => {
        const d = monthlyData[tooltip.idx];
        const pct = Math.round((bx(tooltip.idx) / W) * 100);
        return (
          <div style={{
            position: "absolute",
            bottom: "calc(100% - 20px)",
            left: `clamp(0px, ${pct}%, calc(100% - 130px))`,
            transform: "translateX(-50%)",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "8px 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.75rem",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}>
            <p style={{ color: "#64748b", marginBottom: 4 }}>{d.month}</p>
            <p style={{ color: "#0d9488", fontWeight: 600 }}>Bookings: {d.bookings}</p>
            <p style={{ color: "#8b5cf6", fontWeight: 600 }}>Revenue: Birr {d.revenue.toLocaleString()}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const ModeChip = ({ mode }: { mode: "online" | "in_person" }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: mode === "online" ? "rgba(59,130,246,0.08)" : "rgba(249,115,22,0.08)", color: mode === "online" ? "#2563eb" : "#ea580c", fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap" }}>
    {mode === "online" ? <Wifi style={{ width: 9, height: 9 }} /> : <MapPin style={{ width: 9, height: 9 }} />}
    {mode === "online" ? "Online" : "In-Person"}
  </span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const st = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color, fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>
      {st.icon}{st.label}
    </span>
  );
};

const Avatar = ({ name, gradient }: { name: string; gradient: string }) => (
  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: gradient, color: "white", fontSize: "0.55rem", fontWeight: 700 }}>
    {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
  </div>
);

// ── Mobile booking card ───────────────────────────────────────────────────────

const BookingCard = ({ b }: { b: typeof bookings[0] }) => (
  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <div className="flex items-center justify-between">
      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500, background: "#f1f5f9", borderRadius: "6px", padding: "2px 7px", fontFamily: "'Poppins', sans-serif" }}>
        #{b.id.slice(0, 8)}
      </span>
      <StatusBadge status={b.status} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>Parent</p>
        <div className="flex items-center gap-1.5">
          <Avatar name={b.parent} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" />
          <span style={{ fontSize: "0.78rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{b.parent}</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>Tutor</p>
        <div className="flex items-center gap-1.5">
          <Avatar name={b.tutor} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
          <span style={{ fontSize: "0.78rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{b.tutor}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-1">
      {b.subjects.map((s) => (
        <span key={s} style={{ background: "#f1f5f9", color: "#475569", borderRadius: "5px", padding: "2px 7px", fontSize: "0.72rem", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{s}</span>
      ))}
    </div>
    <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid #f1f5f9" }}>
      <div className="flex items-center gap-2">
        <ModeChip mode={b.mode} />
        <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "'Poppins', sans-serif" }}>{b.numberOfKids} kid{b.numberOfKids !== 1 ? "s" : ""}</span>
      </div>
      <div className="text-right">
        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>{b.totalPrice}</p>
        <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "'Poppins', sans-serif" }}>{b.createdAt}</p>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Page header */}
      <div className="mb-5">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>Dashboard</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>Monday, March 16, 2026 — Welcome back, Admin</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl p-4 transition-all duration-200"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon style={{ width: 18, height: 18, color: card.color }} />
                </div>
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: card.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: card.up ? "#16a34a" : "#ef4444", fontSize: "0.65rem", fontWeight: 600 }}>
                  <TrendingUp style={{ width: 9, height: 9 }} />{card.change}
                </span>
              </div>
              <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.1 }}>{card.value}</p>
              <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 3 }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Pure SVG line chart — no Recharts, no duplicate key warnings */}
        <div className="lg:col-span-2 rounded-2xl p-4 lg:p-5" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Bookings Over Time</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Last 7 months</p>
            </div>
            <span className="px-3 py-1 rounded-full" style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.72rem", fontWeight: 600 }}>Monthly</span>
          </div>
          {/* Custom legend */}
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 3, borderRadius: 2, background: "#0d9488" }} />
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Poppins', sans-serif" }}>Monthly Bookings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="3"><line x1="0" y1="1.5" x2="10" y2="1.5" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3 2" /></svg>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Poppins', sans-serif" }}>Revenue (Birr)</span>
            </div>
          </div>
          <DualLineChart />
        </div>

        {/* Subject breakdown — plain CSS bars */}
        <div className="rounded-2xl p-4 lg:p-5" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div className="mb-4">
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>By Subject</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Bookings breakdown</p>
          </div>
          <div className="flex flex-col gap-3">
            {subjectData.map((d) => (
              <div key={d.subject}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{d.subject}</span>
                  <span style={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>{d.count}</span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 6, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((d.count / subjectMax) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #0d9488, #14b8a6)", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <div className="flex items-center justify-between px-4 lg:px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Recent Bookings</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Latest booking requests across the platform</p>
          </div>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#0d9488", fontWeight: 600, fontSize: "0.75rem", background: "rgba(13,148,136,0.08)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            onClick={() => navigate("/bookings")}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(13,148,136,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(13,148,136,0.08)")}
          >
            View All <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-3 p-4 lg:hidden">
          {bookings.map((b) => <BookingCard key={b.id} b={b} />)}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block w-full">
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col className="hidden xl:table-column" style={{ width: "9%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "17%" }} />
              <col className="hidden xl:table-column" style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col className="hidden xl:table-column" style={{ width: "9%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th className="hidden xl:table-cell" style={thStyle}>Booking ID</th>
                <th style={thStyle}>Parent</th>
                <th style={thStyle}>Tutor</th>
                <th style={thStyle}>Subject(s)</th>
                <th className="hidden xl:table-cell" style={{ ...thStyle, textAlign: "center" }}># Kids</th>
                <th style={thStyle}>Mode</th>
                <th style={thStyle}>Total Price</th>
                <th style={thStyle}>Status</th>
                <th className="hidden xl:table-cell" style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr
                  key={b.id}
                  style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="hidden xl:table-cell" style={tdStyle}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500, background: "#f1f5f9", borderRadius: "6px", padding: "2px 6px", fontFamily: "'Poppins', sans-serif" }}>
                      #{b.id.slice(0, 8)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={b.parent} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" />
                      <span className="truncate" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{b.parent}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={b.tutor} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
                      <span className="truncate" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{b.tutor}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex flex-wrap gap-1">
                      {b.subjects.map((s) => (
                        <span key={s} style={{ background: "#f1f5f9", color: "#475569", borderRadius: "5px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: 500, whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="hidden xl:table-cell" style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>{b.numberOfKids}</span>
                  </td>
                  <td style={tdStyle}><ModeChip mode={b.mode} /></td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif", whiteSpace: "nowrap" }}>{b.totalPrice}</span>
                  </td>
                  <td style={tdStyle}><StatusBadge status={b.status} /></td>
                  <td className="hidden xl:table-cell" style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.75rem", fontFamily: "'Poppins', sans-serif", whiteSpace: "nowrap" }}>
                    {b.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Table style helpers ───────────────────────────────────────────────────────

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
  overflow: "hidden",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 12px",
  fontFamily: "'Poppins', sans-serif",
  overflow: "hidden",
};