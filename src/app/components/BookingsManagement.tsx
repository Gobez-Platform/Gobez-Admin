import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  CalendarCheck,
  Search,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Wifi,
  MapPin,
  Users,
  GraduationCap,
  ChevronRight,
  Filter,
  BookOpen,
  Phone,
  Mail,
  ArrowLeft,
  Star,
  Banknote,
  CreditCard,
  CalendarDays,
  Hash,
  Info,
  Crown,
  Percent,
  TrendingUp,
  User,
} from "lucide-react";

// ── Schema alignment ─────────────────────────────────────────────────────────
// bookings: id, parent_id, tutor_id, mode, status, total_amount, platform_fee,
//           tutor_payout, created_at, scheduled_date, completed_at
// booking_sessions (junction): id, booking_id, subject_id, grade_id, session_count, price_per_session
// parent_profiles: user_id, full_name, phone
// tutor_profiles: user_id, full_name, phone, plan ("free"|"pro")
// subjects: id, name
// payments: booking_id, amount, status, paid_at

type BookingStatus = "pending" | "accepted" | "active" | "completed" | "cancelled" | "declined";
type SessionMode   = "online" | "in_person";
type TutorPlan     = "free" | "pro";

interface BookingSession {
  id: string;
  subject: string;
  grade: string;
  session_count: number;
  price_per_session: number;
  completed_sessions: number;
}

interface Payment {
  id: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  paid_at: string;
  method: "telebirr" | "cbe_birr" | "amole" | "card";
}

interface Booking {
  id: string;
  // Parent
  parent_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  kids_count: number;
  // Tutor
  tutor_id: string;
  tutor_name: string;
  tutor_phone: string;
  tutor_email: string;
  tutor_plan: TutorPlan;
  // Booking details
  mode: SessionMode;
  status: BookingStatus;
  sessions: BookingSession[];
  // Financials
  total_amount: number;
  platform_revenue: number;  // 15% of total if free, 0 if pro (pro pays subscription)
  tutor_payout: number;
  // Payments
  payments: Payment[];
  amount_paid: number;
  // Dates
  created_at: string;
  scheduled_date: string;
  completed_at: string | null;
  // Rating
  rating: number | null;
  review: string | null;
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const seedBookings: Booking[] = [
  {
    id: "bk-a3f1c2d4", parent_id: "u001", parent_name: "Sarah Johnson",
    parent_phone: "+251 911 234 567", parent_email: "sarah.johnson@gmail.com", kids_count: 1,
    tutor_id: "u011", tutor_name: "Daniel Osei",
    tutor_phone: "+251 933 234 567", tutor_email: "daniel.osei@gmail.com", tutor_plan: "free",
    mode: "online", status: "active",
    sessions: [
      { id: "s1", subject: "Mathematics", grade: "Grade 8", session_count: 8, price_per_session: 90, completed_sessions: 3 },
      { id: "s2", subject: "Science",     grade: "Grade 8", session_count: 4, price_per_session: 90, completed_sessions: 1 },
    ],
    total_amount: 1080, platform_revenue: 162, tutor_payout: 918,
    payments: [
      { id: "py1", amount: 1080, status: "paid", paid_at: "Mar 10, 2026", method: "telebirr" },
    ],
    amount_paid: 1080,
    created_at: "Mar 10, 2026", scheduled_date: "Mar 12, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-b9e2a871", parent_id: "u002", parent_name: "Kwame Mensah",
    parent_phone: "+251 922 345 678", parent_email: "kwame.mensah@yahoo.com", kids_count: 2,
    tutor_id: "u012", tutor_name: "Abena Asante",
    tutor_phone: "+251 944 345 678", tutor_email: "abena.asante@gmail.com", tutor_plan: "pro",
    mode: "in_person", status: "accepted",
    sessions: [
      { id: "s3", subject: "English", grade: "Grade 6", session_count: 6, price_per_session: 110, completed_sessions: 0 },
    ],
    total_amount: 660, platform_revenue: 0, tutor_payout: 660,
    payments: [
      { id: "py2", amount: 660, status: "paid", paid_at: "Mar 12, 2026", method: "cbe_birr" },
    ],
    amount_paid: 660,
    created_at: "Mar 12, 2026", scheduled_date: "Mar 16, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-c4d7f093", parent_id: "u003", parent_name: "Emily Clarke",
    parent_phone: "+251 933 456 789", parent_email: "emily.clarke@outlook.com", kids_count: 1,
    tutor_id: "u013", tutor_name: "Samuel Boateng",
    tutor_phone: "+251 955 456 789", tutor_email: "samuel.boateng@gmail.com", tutor_plan: "free",
    mode: "online", status: "completed",
    sessions: [
      { id: "s4", subject: "Science", grade: "Grade 10", session_count: 4, price_per_session: 100, completed_sessions: 4 },
    ],
    total_amount: 400, platform_revenue: 60, tutor_payout: 340,
    payments: [
      { id: "py3", amount: 400, status: "paid", paid_at: "Mar 8, 2026", method: "telebirr" },
    ],
    amount_paid: 400,
    created_at: "Mar 8, 2026", scheduled_date: "Mar 9, 2026", completed_at: "Mar 11, 2026",
    rating: 5, review: "Samuel was amazing! Very patient and my daughter loved the sessions.",
  },
  {
    id: "bk-d1b5e230", parent_id: "u004", parent_name: "David Acheampong",
    parent_phone: "+251 944 567 890", parent_email: "david.acheampong@gmail.com", kids_count: 3,
    tutor_id: "u014", tutor_name: "Linda Owusu",
    tutor_phone: "+251 966 567 890", tutor_email: "linda.owusu@gmail.com", tutor_plan: "pro",
    mode: "in_person", status: "pending",
    sessions: [
      { id: "s5", subject: "French",  grade: "Grade 9", session_count: 5, price_per_session: 120, completed_sessions: 0 },
      { id: "s6", subject: "History", grade: "Grade 9", session_count: 3, price_per_session: 100, completed_sessions: 0 },
    ],
    total_amount: 900, platform_revenue: 0, tutor_payout: 900,
    payments: [],
    amount_paid: 0,
    created_at: "Mar 13, 2026", scheduled_date: "Mar 20, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-e8c3a119", parent_id: "u005", parent_name: "Ama Serwaa",
    parent_phone: "+251 955 678 901", parent_email: "ama.serwaa@gmail.com", kids_count: 1,
    tutor_id: "u011", tutor_name: "Daniel Osei",
    tutor_phone: "+251 933 234 567", tutor_email: "daniel.osei@gmail.com", tutor_plan: "free",
    mode: "online", status: "completed",
    sessions: [
      { id: "s7", subject: "Mathematics", grade: "Grade 7", session_count: 6, price_per_session: 90, completed_sessions: 6 },
    ],
    total_amount: 540, platform_revenue: 81, tutor_payout: 459,
    payments: [
      { id: "py4", amount: 540, status: "paid", paid_at: "Mar 5, 2026", method: "amole" },
    ],
    amount_paid: 540,
    created_at: "Mar 5, 2026", scheduled_date: "Mar 7, 2026", completed_at: "Mar 13, 2026",
    rating: 4, review: "Great tutor, very knowledgeable. Would book again.",
  },
  {
    id: "bk-f2d9b447", parent_id: "u006", parent_name: "James Opoku",
    parent_phone: "+251 966 789 012", parent_email: "james.opoku@gmail.com", kids_count: 2,
    tutor_id: "u015", tutor_name: "Yaw Darko",
    tutor_phone: "+251 977 678 901", tutor_email: "yaw.darko@gmail.com", tutor_plan: "free",
    mode: "in_person", status: "cancelled",
    sessions: [
      { id: "s8", subject: "Coding", grade: "Grade 10", session_count: 4, price_per_session: 130, completed_sessions: 0 },
    ],
    total_amount: 520, platform_revenue: 0, tutor_payout: 0,
    payments: [
      { id: "py5", amount: 520, status: "refunded", paid_at: "Mar 6, 2026", method: "cbe_birr" },
    ],
    amount_paid: 0,
    created_at: "Mar 6, 2026", scheduled_date: "Mar 10, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-g7f4c882", parent_id: "u007", parent_name: "Nana Yaa Boateng",
    parent_phone: "+251 977 890 123", parent_email: "nana.boateng@gmail.com", kids_count: 1,
    tutor_id: "u012", tutor_name: "Abena Asante",
    tutor_phone: "+251 944 345 678", tutor_email: "abena.asante@gmail.com", tutor_plan: "pro",
    mode: "online", status: "declined",
    sessions: [
      { id: "s9",  subject: "History", grade: "Grade 11", session_count: 3, price_per_session: 110, completed_sessions: 0 },
      { id: "s10", subject: "English", grade: "Grade 11", session_count: 3, price_per_session: 110, completed_sessions: 0 },
    ],
    total_amount: 660, platform_revenue: 0, tutor_payout: 0,
    payments: [],
    amount_paid: 0,
    created_at: "Mar 14, 2026", scheduled_date: "Mar 18, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-h5a2d631", parent_id: "u008", parent_name: "Michael Asare",
    parent_phone: "+251 988 901 234", parent_email: "michael.asare@yahoo.com", kids_count: 2,
    tutor_id: "u014", tutor_name: "Linda Owusu",
    tutor_phone: "+251 966 567 890", tutor_email: "linda.owusu@gmail.com", tutor_plan: "pro",
    mode: "in_person", status: "completed",
    sessions: [
      { id: "s11", subject: "English", grade: "Grade 5", session_count: 8, price_per_session: 95, completed_sessions: 8 },
    ],
    total_amount: 760, platform_revenue: 0, tutor_payout: 760,
    payments: [
      { id: "py6", amount: 760, status: "paid", paid_at: "Mar 7, 2026", method: "card" },
    ],
    amount_paid: 760,
    created_at: "Mar 7, 2026", scheduled_date: "Mar 8, 2026", completed_at: "Mar 15, 2026",
    rating: 3, review: null,
  },
  {
    id: "bk-i1c8f204", parent_id: "u009", parent_name: "Helen Tadesse",
    parent_phone: "+251 911 012 345", parent_email: "helen.tadesse@gmail.com", kids_count: 1,
    tutor_id: "u016", tutor_name: "Fatima Al-Hassan",
    tutor_phone: "+251 988 789 012", tutor_email: "fatima.alhassan@gmail.com", tutor_plan: "free",
    mode: "online", status: "active",
    sessions: [
      { id: "s12", subject: "French", grade: "Grade 8", session_count: 10, price_per_session: 105, completed_sessions: 4 },
    ],
    total_amount: 1050, platform_revenue: 157.5, tutor_payout: 892.5,
    payments: [
      { id: "py7", amount: 1050, status: "paid", paid_at: "Mar 11, 2026", method: "telebirr" },
    ],
    amount_paid: 1050,
    created_at: "Mar 11, 2026", scheduled_date: "Mar 13, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-j3e9b812", parent_id: "u001", parent_name: "Sarah Johnson",
    parent_phone: "+251 911 234 567", parent_email: "sarah.johnson@gmail.com", kids_count: 1,
    tutor_id: "u017", tutor_name: "Kojo Mensah",
    tutor_phone: "+251 911 890 123", tutor_email: "kojo.mensah@gmail.com", tutor_plan: "pro",
    mode: "online", status: "pending",
    sessions: [
      { id: "s13", subject: "Mathematics", grade: "Grade 9", session_count: 5, price_per_session: 150, completed_sessions: 0 },
    ],
    total_amount: 750, platform_revenue: 0, tutor_payout: 750,
    payments: [],
    amount_paid: 0,
    created_at: "Mar 15, 2026", scheduled_date: "Mar 22, 2026", completed_at: null,
    rating: null, review: null,
  },
  {
    id: "bk-k7b2a509", parent_id: "u005", parent_name: "Ama Serwaa",
    parent_phone: "+251 955 678 901", parent_email: "ama.serwaa@gmail.com", kids_count: 1,
    tutor_id: "u013", tutor_name: "Samuel Boateng",
    tutor_phone: "+251 955 456 789", tutor_email: "samuel.boateng@gmail.com", tutor_plan: "free",
    mode: "online", status: "completed",
    sessions: [
      { id: "s14", subject: "Biology", grade: "Grade 11", session_count: 5, price_per_session: 110, completed_sessions: 5 },
    ],
    total_amount: 550, platform_revenue: 82.5, tutor_payout: 467.5,
    payments: [
      { id: "py8", amount: 550, status: "paid", paid_at: "Mar 2, 2026", method: "telebirr" },
    ],
    amount_paid: 550,
    created_at: "Mar 2, 2026", scheduled_date: "Mar 4, 2026", completed_at: "Mar 9, 2026",
    rating: 5, review: "Samuel is excellent. Very thorough explanations.",
  },
];

// ── Config ────────────────────────────────────────────────────────────────────
const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

const statusCfg: Record<BookingStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  pending:   { label: "Pending",   color: "#d97706", bg: "rgba(245,158,11,0.1)",  icon: <Clock      style={{ width: 11, height: 11 }} /> },
  accepted:  { label: "Accepted",  color: "#2563eb", bg: "rgba(37,99,235,0.1)",   icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  active:    { label: "Active",    color: "#0d9488", bg: "rgba(13,148,136,0.1)",  icon: <Activity   style={{ width: 11, height: 11 }} /> },
  completed: { label: "Completed", color: "#16a34a", bg: "rgba(34,197,94,0.1)",   icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <XCircle    style={{ width: 11, height: 11 }} /> },
  declined:  { label: "Declined",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: <AlertCircle style={{ width: 11, height: 11 }} /> },
};

const methodLabel: Record<string, string> = {
  telebirr: "TeleBirr", cbe_birr: "CBE Birr", amole: "Amole", card: "Card",
};

function fmtBirr(n: number) { return `Birr ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 600,
               ...poppins, whiteSpace: "nowrap" }}>
      {s.icon}{s.label}
    </span>
  );
}

function ModeChip({ mode }: { mode: SessionMode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: mode === "online" ? "rgba(37,99,235,0.08)" : "rgba(249,115,22,0.08)",
               color: mode === "online" ? "#2563eb" : "#ea580c",
               fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
      {mode === "online" ? <Wifi style={{ width: 9, height: 9 }} /> : <MapPin style={{ width: 9, height: 9 }} />}
      {mode === "online" ? "Online" : "In-Person"}
    </span>
  );
}

function PlanBadge({ plan }: { plan: TutorPlan }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
      style={{ background: plan === "pro" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.08)",
               color: plan === "pro" ? "#d97706" : "#64748b",
               fontSize: "0.62rem", fontWeight: 700, ...poppins }}>
      {plan === "pro" ? <Crown style={{ width: 9, height: 9 }} /> : <Percent style={{ width: 9, height: 9 }} />}
      {plan === "pro" ? "Pro" : "Free (15%)"}
    </span>
  );
}

function Avatar({ name, gradient, size = 30 }: { name: string; gradient: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: gradient, color: "white",
               fontSize: size * 0.26, fontWeight: 700, ...poppins }}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} style={{ width: 12, height: 12,
          fill: i <= rating ? "#f59e0b" : "#e2e8f0",
          color: i <= rating ? "#f59e0b" : "#e2e8f0" }} />
      ))}
    </div>
  );
}

// ── Detail Slide-in Panel ─────────────────────────────────────────────────────
function BookingDetailPanel({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const totalSessions     = booking.sessions.reduce((s, ss) => s + ss.session_count, 0);
  const completedSessions = booking.sessions.reduce((s, ss) => s + ss.completed_sessions, 0);
  const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full flex flex-col overflow-hidden"
        style={{ width: "min(560px, 100vw)", background: "white",
                 boxShadow: "-8px 0 40px rgba(0,0,0,0.14)", fontFamily: "'Poppins', sans-serif",
                 animation: "slideIn 0.22s ease-out" }}>

        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarCheck style={{ width: 15, height: 15, color: "#0d9488" }} />
                <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700,
                               letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Booking #{booking.id.replace("bk-", "")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={booking.status} />
                <ModeChip mode={booking.mode} />
              </div>
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>
                Created {booking.created_at} · Scheduled {booking.scheduled_date}
              </p>
            </div>
            <button onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, flexShrink: 0 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Parent + Tutor */}
          <div className="grid grid-cols-2 gap-3">
            {/* Parent */}
            <div className="rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.07em",
                          textTransform: "uppercase", marginBottom: 8 }}>Parent</p>
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={booking.parent_name} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" size={34} />
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                    {booking.parent_name}
                  </p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.6rem", fontWeight: 700 }}>
                    <Users style={{ width: 9, height: 9 }} /> {booking.kids_count} kid{booking.kids_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                  <Phone style={{ width: 10, height: 10 }} />{booking.parent_phone}
                </span>
                <span className="flex items-center gap-1.5 truncate" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                  <Mail style={{ width: 10, height: 10 }} />{booking.parent_email}
                </span>
              </div>
            </div>

            {/* Tutor */}
            <div className="rounded-2xl p-4" style={{ background: "#fdf4ff", border: "1px solid rgba(139,92,246,0.15)" }}>
              <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.07em",
                          textTransform: "uppercase", marginBottom: 8 }}>Tutor</p>
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={booking.tutor_name} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" size={34} />
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                    {booking.tutor_name}
                  </p>
                  <PlanBadge plan={booking.tutor_plan} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                  <Phone style={{ width: 10, height: 10 }} />{booking.tutor_phone}
                </span>
                <span className="flex items-center gap-1.5 truncate" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                  <Mail style={{ width: 10, height: 10 }} />{booking.tutor_email}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {(booking.status === "active" || booking.status === "completed") && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(13,148,136,0.04)", border: "1px solid rgba(13,148,136,0.15)" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0d9488" }}>Session Progress</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0d9488" }}>
                  {completedSessions} / {totalSessions} sessions ({pct}%)
                </span>
              </div>
              <div className="w-full rounded-full" style={{ height: 8, background: "#e2e8f0" }}>
                <div className="rounded-full transition-all"
                  style={{ width: `${pct}%`, height: 8,
                           background: pct === 100 ? "#16a34a" : "linear-gradient(90deg, #0d9488, #14b8a6)" }} />
              </div>
            </div>
          )}

          {/* Sessions breakdown */}
          <div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", marginBottom: 10 }}>Sessions Breakdown</p>
            <div className="flex flex-col gap-2">
              {booking.sessions.map(ss => (
                <div key={ss.id} className="rounded-xl p-3 flex items-center justify-between gap-2"
                  style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(13,148,136,0.1)" }}>
                      <BookOpen style={{ width: 13, height: 13, color: "#0d9488" }} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>{ss.subject}</p>
                      <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{ss.grade}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
                      {ss.completed_sessions}/{ss.session_count} sessions
                    </p>
                    <p style={{ fontSize: "0.65rem", color: "#64748b" }}>
                      {fmtBirr(ss.price_per_session)} / session · {fmtBirr(ss.session_count * ss.price_per_session)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", marginBottom: 10 }}>Financial Summary</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
              {[
                { label: "Total Booking Amount", value: fmtBirr(booking.total_amount), color: "#0f172a", bold: true },
                { label: `Amount Paid by Parent`, value: fmtBirr(booking.amount_paid), color: "#16a34a" },
                {
                  label: booking.tutor_plan === "pro"
                    ? "Platform Revenue (Pro subscription — session revenue not shared)"
                    : "Platform Revenue (15% commission — free tutor)",
                  value: booking.tutor_plan === "pro" ? "Via subscription" : fmtBirr(booking.platform_revenue),
                  color: booking.tutor_plan === "pro" ? "#d97706" : "#0d9488",
                },
                { label: "Tutor Payout", value: fmtBirr(booking.tutor_payout), color: "#8b5cf6", bold: true },
              ].map((row, i) => (
                <div key={row.label}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i > 0 ? "1px solid #f8fafc" : "none",
                           background: i === 0 ? "rgba(13,148,136,0.03)" : "white" }}>
                  <span style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 500, ...poppins }}>{row.label}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: row.bold ? 700 : 600, color: row.color, ...poppins, whiteSpace: "nowrap" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform revenue explanation */}
            <div className="mt-2 rounded-xl px-3 py-2.5 flex items-start gap-2"
              style={{ background: booking.tutor_plan === "pro" ? "rgba(245,158,11,0.05)" : "rgba(13,148,136,0.05)",
                       border: `1px solid ${booking.tutor_plan === "pro" ? "rgba(245,158,11,0.2)" : "rgba(13,148,136,0.15)"}` }}>
              <Info style={{ width: 12, height: 12, color: booking.tutor_plan === "pro" ? "#d97706" : "#0d9488",
                             flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: "0.7rem", lineHeight: 1.55, color: "#475569", ...poppins }}>
                {booking.tutor_plan === "pro"
                  ? <><strong>Pro tutor:</strong> {booking.tutor_name} pays Birr 499/month flat. The platform earns from the subscription, and the tutor receives 100% of session payments from this booking.</>
                  : <><strong>Free tutor:</strong> {booking.tutor_name} pays no subscription. The platform takes 15% of every session and the tutor receives the remaining 85%.</>}
              </p>
            </div>
          </div>

          {/* Payments */}
          <div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", marginBottom: 10 }}>Payment Records</p>
            {booking.payments.length === 0 ? (
              <div className="rounded-xl px-4 py-3 text-center"
                style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", ...poppins }}>No payment records yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {booking.payments.map(p => (
                  <div key={p.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: p.status === "refunded" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)" }}>
                        <CreditCard style={{ width: 13, height: 13,
                          color: p.status === "refunded" ? "#ef4444" : "#16a34a" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", ...poppins }}>
                          {fmtBirr(p.amount)}
                        </p>
                        <p style={{ fontSize: "0.65rem", color: "#64748b", ...poppins }}>
                          {methodLabel[p.method]} · {p.paid_at}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full"
                      style={{
                        background: p.status === "paid" ? "rgba(34,197,94,0.1)"
                          : p.status === "refunded" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: p.status === "paid" ? "#16a34a"
                          : p.status === "refunded" ? "#ef4444" : "#d97706",
                        fontSize: "0.65rem", fontWeight: 700, ...poppins,
                      }}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          {booking.rating && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Star style={{ width: 14, height: 14, color: "#f59e0b" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", ...poppins }}>
                  Parent Rating
                </span>
                <RatingStars rating={booking.rating} />
              </div>
              {booking.review && (
                <p style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.6, ...poppins, fontStyle: "italic" }}>
                  "{booking.review}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ── Booking Row ───────────────────────────────────────────────────────────────
function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const totalSessions     = booking.sessions.reduce((s, ss) => s + ss.session_count, 0);
  const completedSessions = booking.sessions.reduce((s, ss) => s + ss.completed_sessions, 0);
  const subjects          = [...new Set(booking.sessions.map(s => s.subject))];

  return (
    <tr onClick={onClick} style={{ cursor: "pointer", transition: "background 0.12s", borderTop: "1px solid #f1f5f9" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#fafbff")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
      <td style={tdStyle}>
        <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, background: "#f1f5f9",
                       borderRadius: 6, padding: "2px 6px", ...poppins }}>
          {booking.id.replace("bk-", "")}
        </span>
      </td>
      <td style={tdStyle}>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={booking.parent_name} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" size={28} />
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0f172a", ...poppins }}>{booking.parent_name}</p>
            <p className="truncate" style={{ fontSize: "0.62rem", color: "#94a3b8", ...poppins }}>{booking.parent_phone}</p>
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={booking.tutor_name} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" size={28} />
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0f172a", ...poppins }}>{booking.tutor_name}</p>
            <PlanBadge plan={booking.tutor_plan} />
          </div>
        </div>
      </td>
      <td style={tdStyle}>
        <div className="flex flex-wrap gap-1">
          {subjects.slice(0, 2).map(s => (
            <span key={s} style={{ background: "#f1f5f9", color: "#475569", borderRadius: 5,
                                   padding: "1px 6px", fontSize: "0.65rem", fontWeight: 500, ...poppins,
                                   whiteSpace: "nowrap" }}>{s}</span>
          ))}
          {subjects.length > 2 && (
            <span style={{ color: "#94a3b8", fontSize: "0.65rem", ...poppins }}>+{subjects.length - 2}</span>
          )}
        </div>
      </td>
      <td style={tdStyle}><ModeChip mode={booking.mode} /></td>
      <td style={tdStyle}>
        <span style={{ fontSize: "0.78rem", color: "#64748b", ...poppins }}>
          {completedSessions}/{totalSessions}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", ...poppins, whiteSpace: "nowrap" }}>
          {fmtBirr(booking.total_amount)}
        </span>
      </td>
      <td style={tdStyle}><StatusBadge status={booking.status} /></td>
      <td style={tdStyle}>
        <span style={{ fontSize: "0.72rem", color: "#94a3b8", ...poppins, whiteSpace: "nowrap" }}>
          {booking.scheduled_date}
        </span>
      </td>
      <td style={tdStyle}>
        <ChevronRight style={{ width: 15, height: 15, color: "#cbd5e1" }} />
      </td>
    </tr>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function BookingCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const subjects = [...new Set(booking.sessions.map(s => s.subject))];
  return (
    <div onClick={onClick} className="rounded-2xl p-4 cursor-pointer transition-all"
      style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: "0.65rem", color: "#64748b", background: "#f1f5f9",
                       padding: "2px 7px", borderRadius: 6, fontWeight: 500, ...poppins }}>
          {booking.id.replace("bk-", "")}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={booking.status} />
          <ChevronRight style={{ width: 14, height: 14, color: "#94a3b8" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", marginBottom: 4, ...poppins }}>Parent</p>
          <div className="flex items-center gap-1.5">
            <Avatar name={booking.parent_name} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" size={26} />
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#0f172a", ...poppins }}>
              {booking.parent_name.split(" ")[0]}
            </span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", marginBottom: 4, ...poppins }}>Tutor</p>
          <div className="flex items-center gap-1.5">
            <Avatar name={booking.tutor_name} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" size={26} />
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#0f172a", ...poppins }}>
              {booking.tutor_name.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {subjects.map(s => (
          <span key={s} style={{ background: "#f1f5f9", color: "#475569", borderRadius: 5,
                                 padding: "1px 6px", fontSize: "0.68rem", fontWeight: 500, ...poppins }}>{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModeChip mode={booking.mode} />
          <PlanBadge plan={booking.tutor_plan} />
        </div>
        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", ...poppins }}>
          {fmtBirr(booking.total_amount)}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const ONGOING_STATUSES: BookingStatus[]  = ["pending", "accepted", "active"];
const HISTORY_STATUSES: BookingStatus[]  = ["completed", "cancelled", "declined"];

export function BookingsManagement() {
  const navigate = useNavigate();
  const [tab,        setTab]        = useState<"ongoing" | "history">("ongoing");
  const [search,     setSearch]     = useState("");
  const [fStatus,    setFStatus]    = useState<BookingStatus | "all">("all");
  const [fMode,      setFMode]      = useState<SessionMode | "all">("all");
  const [fPlan,      setFPlan]      = useState<TutorPlan | "all">("all");
  const [fDate,      setFDate]      = useState("");
  const [selected,   setSelected]   = useState<Booking | null>(null);

  const activeStatuses = tab === "ongoing" ? ONGOING_STATUSES : HISTORY_STATUSES;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return seedBookings.filter(b => {
      if (!activeStatuses.includes(b.status)) return false;
      if (fStatus !== "all" && b.status !== fStatus) return false;
      if (fMode   !== "all" && b.mode   !== fMode)   return false;
      if (fPlan   !== "all" && b.tutor_plan !== fPlan) return false;
      if (fDate   && b.scheduled_date !== fDate && b.created_at !== fDate) {
        // date filter: check if the scheduled_date contains the year-month from fDate
        const fd = new Date(fDate);
        const sd = new Date(b.scheduled_date + " 2026");
        if (!(sd.getMonth() === fd.getMonth() && sd.getFullYear() === fd.getFullYear())) return false;
      }
      if (q && !b.parent_name.toLowerCase().includes(q)
            && !b.tutor_name.toLowerCase().includes(q)
            && !b.parent_phone.includes(q)
            && !b.tutor_phone.includes(q)
            && !b.id.toLowerCase().includes(q)
            && !b.sessions.some(s => s.subject.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tab, search, fStatus, fMode, fPlan, fDate, activeStatuses]);

  // Stats
  const ongoing  = seedBookings.filter(b => ONGOING_STATUSES.includes(b.status));
  const history  = seedBookings.filter(b => HISTORY_STATUSES.includes(b.status));
  const totalRev = seedBookings.reduce((s, b) => s + b.total_amount, 0);
  const platRev  = seedBookings.reduce((s, b) => s + b.platform_revenue, 0);

  const statCards = [
    { label: "Total Bookings", value: seedBookings.length, color: "#0d9488", bg: "rgba(13,148,136,0.08)", icon: CalendarCheck },
    { label: "Ongoing",        value: ongoing.length,      color: "#2563eb", bg: "rgba(37,99,235,0.08)",  icon: Activity      },
    { label: "Completed",      value: history.filter(b => b.status === "completed").length, color: "#16a34a", bg: "rgba(34,197,94,0.08)", icon: CheckCircle },
    { label: "Total Value",    value: fmtBirr(totalRev),   color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", icon: Banknote      },
    { label: "Platform Revenue", value: fmtBirr(platRev),  color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: TrendingUp    },
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
            Bookings
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
            All platform bookings — ongoing sessions and historical records
          </p>
        </div>
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
          style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b",
                   cursor: "pointer", fontSize: "0.78rem", fontWeight: 500, ...poppins }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Dashboard
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        {statCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon style={{ width: 16, height: 16, color }} />
            </div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: typeof value === "string" ? "1rem" : "1.5rem", lineHeight: 1.1 }}>{value}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.68rem", marginTop: 3 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div className="rounded-2xl p-4 mb-4 flex flex-col gap-3"
        style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

        {/* Tab row */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
          {([["ongoing", "Ongoing", ongoing.length], ["history", "History", history.length]] as const).map(([id, label, count]) => (
            <button key={id} onClick={() => { setTab(id); setFStatus("all"); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all"
              style={{
                background: tab === id ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "transparent",
                color: tab === id ? "white" : "#64748b",
                border: "none", cursor: "pointer", fontWeight: tab === id ? 700 : 500,
                fontSize: "0.82rem", ...poppins,
                boxShadow: tab === id ? "0 3px 10px rgba(13,148,136,0.25)" : "none",
              }}>
              {label}
              <span className="px-1.5 py-0.5 rounded-full"
                style={{ background: tab === id ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                         color: tab === id ? "white" : "#64748b",
                         fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
            <input type="text" placeholder="Search name, phone, subject, ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: "none", border: "none", outline: "none",
                       fontSize: "0.8rem", color: "#0f172a", width: "100%", ...poppins }} />
            {search && <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
              <X style={{ width: 13, height: 13 }} /></button>}
          </div>

          {/* Status */}
          <select value={fStatus} onChange={e => setFStatus(e.target.value as BookingStatus | "all")}
            style={selStyle}>
            <option value="all">All Statuses</option>
            {activeStatuses.map(s => (
              <option key={s} value={s}>{statusCfg[s].label}</option>
            ))}
          </select>

          {/* Mode */}
          <select value={fMode} onChange={e => setFMode(e.target.value as SessionMode | "all")}
            style={selStyle}>
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="in_person">In-Person</option>
          </select>

          {/* Plan */}
          <select value={fPlan} onChange={e => setFPlan(e.target.value as TutorPlan | "all")}
            style={selStyle}>
            <option value="all">All Plans</option>
            <option value="free">Free Tutor (15%)</option>
            <option value="pro">Pro Tutor (Birr 499/mo)</option>
          </select>

          {/* Date */}
          <input type="month" value={fDate} onChange={e => setFDate(e.target.value)}
            style={{ ...selStyle, padding: "6px 10px" }} />
          {fDate && <button onClick={() => setFDate("")}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", cursor: "pointer", color: "#94a3b8" }}>
            <X style={{ width: 12, height: 12 }} /></button>}

          <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginLeft: "auto", ...poppins, whiteSpace: "nowrap" }}>
            {filtered.length} of {seedBookings.filter(b => activeStatuses.includes(b.status)).length}
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="rounded-2xl overflow-hidden hidden lg:block"
        style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "9%" }}  />
            <col style={{ width: "8%" }}  />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }}  />
            <col style={{ width: "9%" }}  />
            <col style={{ width: "4%" }}  />
          </colgroup>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Parent", "Tutor", "Subjects", "Mode", "Sessions", "Amount", "Status", "Date", ""].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", ...poppins }}>
                No bookings match your filters.
              </td></tr>
            ) : (
              filtered.map(b => (
                <BookingRow key={b.id} booking={b} onClick={() => setSelected(b)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl py-16 flex flex-col items-center gap-2"
            style={{ background: "white", border: "1.5px dashed #e2e8f0" }}>
            <CalendarCheck style={{ width: 28, height: 28, color: "#e2e8f0" }} />
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", ...poppins }}>No bookings match your filters.</p>
          </div>
        ) : (
          filtered.map(b => <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />)
        )}
      </div>

      {/* Revenue note */}
      <div className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5"
        style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)" }}>
        <Info style={{ width: 14, height: 14, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: "0.72rem", color: "#0f172a", lineHeight: 1.6, ...poppins }}>
          <strong>Revenue model:</strong> Free tutors share <strong>15%</strong> of each session with the platform (tutor keeps 85%).
          Pro tutors pay <strong>Birr 499/month</strong> and keep <strong>100%</strong> of their session earnings.
          Click any row to see the full booking breakdown including payout details.
        </p>
      </div>

      {/* Detail panel */}
      {selected && <BookingDetailPanel booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "9px 12px", textAlign: "left", fontSize: "0.62rem", fontWeight: 600,
  color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase",
  whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif",
};
const tdStyle: React.CSSProperties = { padding: "11px 12px", fontFamily: "'Poppins', sans-serif", overflow: "hidden" };
const selStyle: React.CSSProperties = {
  borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "7px 10px",
  fontSize: "0.78rem", color: "#475569", background: "#f8fafc",
  fontFamily: "'Poppins', sans-serif", cursor: "pointer", outline: "none",
};
