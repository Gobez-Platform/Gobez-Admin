import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, Receipt, PiggyBank, Info, Banknote,
  ArrowUpRight, ArrowDownRight, GraduationCap, FileText,
  Crown, Percent, Users,
} from "lucide-react";

// ── Revenue Model ─────────────────────────────────────────────────────────────
// TWO revenue streams:
//   1. FREE tutors  — Platform takes 15% of every session value
//                     Tutor keeps 85%
//   2. PRO tutors   — Tutor pays Birr 499/month subscription
//                     Tutor keeps 100% of all session earnings
//
// System revenue = (15% × free tutor session value) + (proTutorCount × 499)
// ─────────────────────────────────────────────────────────────────────────────

const FREE_COMMISSION_RATE = 0.15;   // platform takes 15% from free-tutor sessions
const PRO_MONTHLY_FEE      = 499;    // Birr 499/month per pro tutor

// ── Ethiopian Tax Constants ───────────────────────────────────────────────────
// ERCA: VAT 15% (Proc. 285/2002), BPT 30% (Proc. 979/2016), WHT 2%
const VAT_RATE                 = 0.15;
const BUSINESS_PROFIT_TAX_RATE = 0.30;
const WITHHOLDING_RATE         = 0.02;
const OPERATING_EXPENSE_RATE   = 0.38;

// ── Mock Data ─────────────────────────────────────────────────────────────────
// Each entry contains:
//   freeSessionValue  — gross value of sessions taught by free tutors
//   proSessionValue   — gross value of sessions taught by pro tutors
//   proTutorCount     — number of active pro subscribers that period
//   subscriptionRev   — proTutorCount × 499
//   commissionRev     — freeSessionValue × 0.15
//   systemRevenue     — subscriptionRev + commissionRev
//   freeTutorPayout   — freeSessionValue × 0.85
//   proTutorPayout    — proSessionValue (100%)
//   totalPayout       — freeTutorPayout + proTutorPayout

function buildEntry(label: string, freeVal: number, proVal: number, proCount: number) {
  const subscriptionRev = proCount * PRO_MONTHLY_FEE;
  const commissionRev   = Math.round(freeVal * FREE_COMMISSION_RATE);
  const systemRevenue   = subscriptionRev + commissionRev;
  const freeTutorPayout = Math.round(freeVal * (1 - FREE_COMMISSION_RATE));
  const totalPayout     = freeTutorPayout + proVal;
  return { label, freeSessionValue: freeVal, proSessionValue: proVal, proTutorCount: proCount,
           subscriptionRev, commissionRev, systemRevenue, totalPayout };
}

const weeklyData = [
  buildEntry("Mon", 3800,  2100, 12),
  buildEntry("Tue", 3200,  1900, 12),
  buildEntry("Wed", 4600,  2400, 12),
  buildEntry("Thu", 4100,  2200, 12),
  buildEntry("Fri", 5800,  2900, 12),
  buildEntry("Sat", 5200,  2700, 12),
  buildEntry("Sun", 3300,  1600, 12),
];

const monthlyData = [
  buildEntry("Sep", 21000, 11000, 28),
  buildEntry("Oct", 28000, 14000, 32),
  buildEntry("Nov", 25000, 12500, 30),
  buildEntry("Dec", 33000, 16000, 36),
  buildEntry("Jan", 29500, 14500, 34),
  buildEntry("Feb", 39000, 18000, 41),
  buildEntry("Mar", 49000, 22000, 48),
];

const yearlyData = [
  buildEntry("2023", 165000, 74000, 22),
  buildEntry("2024", 218000, 98000, 30),
  buildEntry("2025", 295000, 132000, 40),
  buildEntry("2026", 224000, 101000, 48),
];

type Period = "week" | "month" | "year";

const dataMap: Record<Period, typeof weeklyData> = {
  week: weeklyData, month: monthlyData, year: yearlyData,
};
const periodLabel: Record<Period, string> = {
  week: "This Week", month: "Last 7 Months", year: "By Year",
};

// ── Tutor payout table ─────────────────────────────────────────────────────────
const tutorPayoutData = [
  { name: "Daniel Osei",      plan: "free" as const, sessions: 42, sessionValue: 18900, withheld: 2835,  netPaid: 16065, subFee: 0    },
  { name: "Abena Asante",     plan: "pro"  as const, sessions: 38, sessionValue: 17100, withheld: 0,     netPaid: 17100, subFee: 499  },
  { name: "Samuel Boateng",   plan: "free" as const, sessions: 35, sessionValue: 13650, withheld: 2047,  netPaid: 11603, subFee: 0    },
  { name: "Linda Owusu",      plan: "pro"  as const, sessions: 29, sessionValue: 12180, withheld: 0,     netPaid: 12180, subFee: 499  },
  { name: "Yaw Darko",        plan: "free" as const, sessions: 24, sessionValue: 9600,  withheld: 1440,  netPaid: 8160,  subFee: 0    },
  { name: "Fatima Al-Hassan", plan: "free" as const, sessions: 21, sessionValue: 8400,  withheld: 1260,  netPaid: 7140,  subFee: 0    },
  { name: "Kojo Mensah",      plan: "pro"  as const, sessions: 18, sessionValue: 7200,  withheld: 0,     netPaid: 7200,  subFee: 499  },
  { name: "Grace Asiedu",     plan: "free" as const, sessions: 16, sessionValue: 6400,  withheld: 960,   netPaid: 5440,  subFee: 0    },
];

// ── Tax Calculator ────────────────────────────────────────────────────────────
function computeTax(data: typeof weeklyData) {
  const totalFreeVal     = data.reduce((s, d) => s + d.freeSessionValue, 0);
  const totalProVal      = data.reduce((s, d) => s + d.proSessionValue, 0);
  const totalSubRev      = data.reduce((s, d) => s + d.subscriptionRev, 0);
  const totalCommRev     = data.reduce((s, d) => s + d.commissionRev, 0);
  const totalSystemRev   = data.reduce((s, d) => s + d.systemRevenue, 0);
  const totalPayout      = data.reduce((s, d) => s + d.totalPayout, 0);

  const vatPayable        = Math.round(totalSystemRev * VAT_RATE);
  const netSystemRev      = totalSystemRev - vatPayable;
  const operatingExpenses = Math.round(netSystemRev * OPERATING_EXPENSE_RATE);
  const ebit              = netSystemRev - operatingExpenses;
  const businessProfitTax = Math.round(Math.max(ebit, 0) * BUSINESS_PROFIT_TAX_RATE);
  const withholdingTax    = Math.round(totalFreeVal * (1 - FREE_COMMISSION_RATE) * WITHHOLDING_RATE);
  const netProfit         = ebit - businessProfitTax;

  return {
    totalFreeVal, totalProVal, totalSubRev, totalCommRev, totalSystemRev,
    totalPayout, vatPayable, netSystemRev, operatingExpenses, ebit,
    businessProfitTax, withholdingTax, netProfit,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const fmt = (n: number) => `Birr ${Math.round(n).toLocaleString()}`;
const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
                  padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", ...poppins, fontSize: "0.78rem" }}>
      <p style={{ color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: Birr {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

interface KPICardProps {
  label: string; value: string; sub: string;
  change?: string; up?: boolean;
  icon: React.ElementType; color: string; bg: string;
}
const KPICard = ({ label, value, sub, change, up, icon: Icon, color, bg }: KPICardProps) => (
  <div className="rounded-2xl p-4 transition-all duration-200"
    style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      {change && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
          style={{ background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                   color: up ? "#16a34a" : "#ef4444", fontSize: "0.65rem", fontWeight: 600 }}>
          {up ? <ArrowUpRight style={{ width: 9, height: 9 }} /> : <ArrowDownRight style={{ width: 9, height: 9 }} />}
          {change}
        </span>
      )}
    </div>
    <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.1 }}>{value}</p>
    <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: 2, fontWeight: 500, ...poppins }}>{label}</p>
    <p style={{ color: "#94a3b8", fontSize: "0.65rem", marginTop: 1, ...poppins }}>{sub}</p>
  </div>
);

interface TaxRowProps {
  label: string; value: string; note?: string;
  highlight?: boolean; negative?: boolean; bold?: boolean; isTotal?: boolean;
}
const TaxRow = ({ label, value, note, highlight, negative, bold, isTotal }: TaxRowProps) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
    style={{ background: isTotal ? "rgba(13,148,136,0.07)" : highlight ? "rgba(239,68,68,0.05)" : "transparent",
             borderTop: isTotal ? "none" : "1px solid #f8fafc" }}>
    <div className="flex flex-col">
      <span style={{ fontSize: "0.8rem", color: isTotal ? "#0d9488" : "#0f172a",
                     fontWeight: bold || isTotal ? 700 : 500, ...poppins }}>{label}</span>
      {note && <span style={{ fontSize: "0.67rem", color: "#94a3b8", ...poppins }}>{note}</span>}
    </div>
    <span style={{ fontSize: "0.85rem", fontWeight: bold || isTotal ? 700 : 600,
                   color: isTotal ? "#0d9488" : negative ? "#ef4444" : "#0f172a",
                   ...poppins, whiteSpace: "nowrap" }}>
      {negative ? `− ${value}` : value}
    </span>
  </div>
);

const Avatar = ({ name, gradient }: { name: string; gradient: string }) => (
  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
    style={{ background: gradient, color: "white", fontSize: "0.55rem", fontWeight: 700 }}>
    {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export function FinancialOverview() {
  const [period, setPeriod] = useState<Period>("month");
  const data = dataMap[period];
  const tax  = computeTax(data);

  // Aggregate pro tutor count for the period
  const proTutorCount = data[data.length - 1].proTutorCount;
  const freeTutorSessions = tutorPayoutData.filter(t => t.plan === "free").reduce((s, t) => s + t.sessions, 0);

  const kpiCards: KPICardProps[] = [
    {
      label: "Subscription Revenue",
      value: fmt(tax.totalSubRev),
      sub: `${proTutorCount} pro tutors × Birr 499/mo`,
      change: "+20%", up: true, icon: Crown, color: "#d97706", bg: "rgba(245,158,11,0.08)",
    },
    {
      label: "Commission Revenue",
      value: fmt(tax.totalCommRev),
      sub: `15% of free-tutor sessions`,
      change: "+16%", up: true, icon: Percent, color: "#0d9488", bg: "rgba(13,148,136,0.08)",
    },
    {
      label: "Total System Revenue",
      value: fmt(tax.totalSystemRev),
      sub: "Subscriptions + commissions",
      change: "+18%", up: true, icon: Banknote, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",
    },
    {
      label: "Net Profit (After Tax)",
      value: fmt(Math.max(tax.netProfit, 0)),
      sub: "After VAT & Business Profit Tax",
      change: tax.netProfit > 0 ? "+14%" : "-5%",
      up: tax.netProfit > 0, icon: PiggyBank,
      color: tax.netProfit > 0 ? "#16a34a" : "#ef4444",
      bg: tax.netProfit > 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
            Financial Overview
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
            Revenue from Pro subscriptions &amp; Free-tutor commissions · Ethiopian tax summary
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {(["week", "month", "year"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-lg transition-all duration-150"
              style={{ background: period === p ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "transparent",
                       color: period === p ? "white" : "#64748b",
                       fontWeight: period === p ? 600 : 500, fontSize: "0.78rem",
                       border: "none", cursor: "pointer",
                       boxShadow: period === p ? "0 2px 8px rgba(13,148,136,0.3)" : "none" }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue model explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "white", border: "1.5px solid rgba(245,158,11,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.1)" }}>
            <Crown style={{ width: 18, height: 18, color: "#d97706" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Pro Tutors</p>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>
              Pay <strong>Birr 499/month</strong> flat subscription. Keep <strong>100%</strong> of all session earnings.
              Platform earns the monthly fee regardless of session volume.
            </p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.1)", color: "#d97706", fontSize: "0.68rem", fontWeight: 700 }}>
              <Users style={{ width: 10, height: 10 }} /> {proTutorCount} active this period
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "white", border: "1.5px solid rgba(13,148,136,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(13,148,136,0.1)" }}>
            <Percent style={{ width: 18, height: 18, color: "#0d9488" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Free Tutors</p>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>
              No subscription fee. Platform takes <strong>15%</strong> of every session. Tutor keeps <strong>85%</strong>.
              Revenue scales directly with session volume.
            </p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", fontSize: "0.68rem", fontWeight: 700 }}>
              <GraduationCap style={{ width: 10, height: 10 }} /> {freeTutorSessions} sessions tracked
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {kpiCards.map(card => <KPICard key={card.label} {...card} />)}
      </div>

      {/* Revenue Chart + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Area Chart */}
        <div className="lg:col-span-2 rounded-2xl p-4 lg:p-5"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Revenue Sources Over Time</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>{periodLabel[period]}</p>
            </div>
            <span className="px-3 py-1 rounded-full"
              style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.72rem", fontWeight: 600 }}>
              Birr (ETB)
            </span>
          </div>
          {/* Custom legend — avoids Recharts internal duplicate-key warning */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {[
              { color: "#d97706", label: "Subscription Revenue" },
              { color: "#0d9488", label: "Commission Revenue (15%)" },
              { color: "#8b5cf6", label: "Total Tutor Payouts" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "'Poppins', sans-serif" }}>{l.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Poppins" }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="subscriptionRev" name="Subscription Revenue"
                stroke="#d97706" strokeWidth={2.5} fill="#d97706" fillOpacity={0.1}
                dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="commissionRev" name="Commission Revenue (15%)"
                stroke="#0d9488" strokeWidth={2.5} fill="#0d9488" fillOpacity={0.1}
                dot={{ r: 3, fill: "#0d9488", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="totalPayout" name="Total Tutor Payouts"
                stroke="#8b5cf6" strokeWidth={2.5} fill="#8b5cf6" fillOpacity={0.08}
                dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution breakdown */}
        <div className="rounded-2xl p-4 lg:p-5 flex flex-col gap-4"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div>
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Revenue Mix</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Subscriptions vs commissions</p>
          </div>

          {/* Visual split */}
          {[
            { label: "Pro Subscriptions", value: tax.totalSubRev, color: "#d97706", bg: "rgba(245,158,11,0.08)", icon: Crown   },
            { label: "Free Commissions",  value: tax.totalCommRev, color: "#0d9488", bg: "rgba(13,148,136,0.08)", icon: Percent },
          ].map(item => {
            const pct = tax.totalSystemRev > 0 ? Math.round((item.value / tax.totalSystemRev) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <item.icon style={{ width: 12, height: 12, color: item.color }} />
                    <span style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: 600, ...poppins }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color, ...poppins }}>{pct}%</span>
                </div>
                <div className="w-full rounded-full mb-1" style={{ height: 8, background: "#f1f5f9" }}>
                  <div className="rounded-full" style={{ width: `${pct}%`, height: 8, background: item.color }} />
                </div>
                <p style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins }}>{fmt(item.value)}</p>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            {/* Custom legend for mini bar chart */}
            <div className="flex items-center gap-3 mb-2">
              {[
                { color: "#f59e0b", label: "Subscriptions" },
                { color: "#14b8a6", label: "Commission" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: "0.65rem", color: "#64748b", fontFamily: "'Poppins', sans-serif" }}>{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.slice(-5)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "Poppins" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="subscriptionRev" name="Subscriptions" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="commissionRev"   name="Commission"    fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tax Breakdown + Tutor Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        {/* Ethiopian Tax */}
        <div className="lg:col-span-2 rounded-2xl p-4 lg:p-5"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Ethiopian Tax Breakdown</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>Based on ERCA regulations</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(59,130,246,0.08)", cursor: "default" }}
              title="Ethiopia: VAT 15% (Proc. 285/2002), BPT 30% (Proc. 979/2016), WHT 2%">
              <Info style={{ width: 12, height: 12, color: "#3b82f6" }} />
              <span style={{ fontSize: "0.68rem", color: "#3b82f6", fontWeight: 600 }}>ERCA</span>
            </div>
          </div>
          <div className="flex flex-col">
            <TaxRow label="Pro Subscription Revenue" value={fmt(tax.totalSubRev)} note={`${proTutorCount} tutors × Birr 499`} bold />
            <TaxRow label="Commission Revenue (15%)"  value={fmt(tax.totalCommRev)} note="15% of free-tutor session value" bold />
            <TaxRow label="Total System Revenue"      value={fmt(tax.totalSystemRev)} note="Combined platform income" bold />
            <TaxRow label="VAT Payable (15%)"         value={fmt(tax.vatPayable)} note="Remitted to ERCA — Proc. 285/2002" negative highlight />
            <TaxRow label="Net System Revenue"        value={fmt(tax.netSystemRev)} note="After VAT deduction" bold />
            <TaxRow label="Operating Expenses"        value={fmt(tax.operatingExpenses)} note="Hosting, support, marketing (~38%)" negative />
            <TaxRow label="EBIT (Taxable Income)"     value={fmt(Math.max(tax.ebit, 0))} note="Earnings Before Income Tax" bold />
            <TaxRow label="Business Profit Tax (30%)" value={fmt(tax.businessProfitTax)} note="BPT — Proc. 979/2016, Art. 19" negative highlight />
            <div className="my-2 border-t" style={{ borderColor: "#e2e8f0" }} />
            <TaxRow label="Net Profit"                value={fmt(Math.max(tax.netProfit, 0))} note="After all deductions & taxes" isTotal />
            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText style={{ width: 12, height: 12, color: "#d97706" }} />
                <span style={{ fontSize: "0.72rem", color: "#d97706", fontWeight: 700, ...poppins }}>
                  Free-Tutor Withholding Tax (2%)
                </span>
              </div>
              <p style={{ fontSize: "0.7rem", color: "#92400e", ...poppins }}>
                2% withheld at source from free-tutor payouts per ERCA regulations.
                Pro tutors manage their own tax obligations.<br />
                Total withheld: <strong>{fmt(tax.withholdingTax)}</strong> — remitted to ERCA on behalf of free tutors.
              </p>
            </div>
          </div>
        </div>

        {/* Tutor Payout Table */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div className="px-4 lg:px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Tutor Payout Breakdown</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: 2 }}>
              Pro tutors keep 100% · Free tutors keep 85% (platform takes 15%)
            </p>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 p-4 lg:hidden">
            {tutorPayoutData.map(t => (
              <div key={t.name} className="rounded-xl p-3" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={t.name}
                    gradient={t.plan === "pro" ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #8b5cf6, #a78bfa)"} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{t.name}</span>
                  <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: t.plan === "pro" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.08)",
                             color: t.plan === "pro" ? "#d97706" : "#64748b", fontSize: "0.6rem", fontWeight: 700, ...poppins }}>
                    {t.plan === "pro" ? <Crown style={{ width: 9, height: 9 }} /> : <Percent style={{ width: 9, height: 9 }} />}
                    {t.plan === "pro" ? "Pro" : "Free"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Session Value", fmt(t.sessionValue), "#0f172a"],
                    [t.plan === "pro" ? "Sub Fee" : "Commission", t.plan === "pro" ? fmt(t.subFee) : `-${fmt(t.withheld)}`, t.plan === "pro" ? "#d97706" : "#ef4444"],
                    ["Net Paid", fmt(t.netPaid), "#0d9488"],
                  ].map(([label, val, col]) => (
                    <div key={label as string} className="rounded-lg py-1.5" style={{ background: "#f8fafc" }}>
                      <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", ...poppins }}>{label}</p>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: col as string, ...poppins }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "26%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>Tutor</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Plan</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Sessions</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Session Value</th>
                  <th style={{ ...thStyle, textAlign: "right", color: "#ef4444" }}>Platform Take</th>
                  <th style={{ ...thStyle, textAlign: "right", color: "#0d9488" }}>Net Paid</th>
                </tr>
              </thead>
              <tbody>
                {tutorPayoutData.map((t, i) => (
                  <tr key={t.name}
                    style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={t.name}
                          gradient={t.plan === "pro" ? "linear-gradient(135deg, #d97706, #f59e0b)" : "linear-gradient(135deg, #8b5cf6, #a78bfa)"} />
                        <span className="truncate" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 500, ...poppins }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ background: t.plan === "pro" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.08)",
                                 color: t.plan === "pro" ? "#d97706" : "#64748b",
                                 fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
                        {t.plan === "pro" ? <Crown style={{ width: 9, height: 9 }} /> : <Percent style={{ width: 9, height: 9 }} />}
                        {t.plan === "pro" ? "Pro" : "Free"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.72rem", fontWeight: 600 }}>
                        {t.sessions}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", ...poppins }}>{fmt(t.sessionValue)}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {t.plan === "pro" ? (
                        <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600, ...poppins }}>
                          Sub: {fmt(t.subFee)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ef4444", ...poppins }}>
                          −{fmt(t.withheld)}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0d9488", ...poppins }}>{fmt(t.netPaid)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e2e8f0", background: "rgba(13,148,136,0.03)" }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#0d9488", ...poppins }} colSpan={3}>Total</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", ...poppins }}>
                      {fmt(tutorPayoutData.reduce((s, t) => s + t.sessionValue, 0))}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444", ...poppins }}>
                      −{fmt(tutorPayoutData.filter(t => t.plan === "free").reduce((s, t) => s + t.withheld, 0))}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0d9488", ...poppins }}>
                      {fmt(tutorPayoutData.reduce((s, t) => s + t.netPaid, 0))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Ethiopian Tax Reference */}
      <div className="rounded-2xl p-4 lg:p-5"
        style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.08)" }}>
            <Receipt style={{ width: 16, height: 16, color: "#3b82f6" }} />
          </div>
          <div>
            <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>Ethiopian Tax Reference (ERCA)</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Applicable rates used in the calculations above</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: "VAT",                 rate: "15%", desc: "Value Added Tax on taxable services. Applicable when annual turnover exceeds ETB 1,000,000.", law: "Proc. No. 285/2002 (amended)", color: "#3b82f6", bg: "rgba(59,130,246,0.06)"  },
            { title: "Business Profit Tax", rate: "30%", desc: "Flat corporate income tax on taxable profit for incorporated companies (PLC/SC).",              law: "Proc. No. 979/2016, Art. 19",  color: "#ef4444", bg: "rgba(239,68,68,0.06)"   },
            { title: "Withholding Tax",     rate: "2%",  desc: "Withheld at source from free-tutor payouts. Pro tutors manage their own tax independently.",   law: "ERCA Withholding Regulation",  color: "#f59e0b", bg: "rgba(245,158,11,0.06)" },
            { title: "Turnover Tax",        rate: "2%",  desc: "Alternative to VAT for businesses below the ETB 1,000,000 threshold. Not applicable to Gobez.", law: "Proc. No. 308/2002",           color: "#64748b", bg: "rgba(100,116,139,0.06)"},
          ].map(item => (
            <div key={item.title} className="rounded-xl p-3" style={{ background: item.bg, border: `1px solid ${item.color}22` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: item.color, ...poppins }}>{item.title}</span>
                <span className="px-2 py-0.5 rounded-full"
                  style={{ background: item.color, color: "white", fontSize: "0.72rem", fontWeight: 700 }}>{item.rate}</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5, ...poppins }}>{item.desc}</p>
              <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 6, ...poppins }}>{item.law}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: "9px 12px", textAlign: "left", fontSize: "0.65rem", fontWeight: 600,
  color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase",
  whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif", overflow: "hidden",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 12px", fontFamily: "'Poppins', sans-serif", overflow: "hidden",
};