import React, { useState, useMemo, useRef } from "react";
import {
  CalendarDays, Clock, MapPin, Users, Plus, Trash2, X,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, XCircle,
  CalendarOff, GraduationCap, Info, Phone, BookOpen, Ban,
  UserCheck, Save, TriangleAlert, Upload, FileText,
  IdCard, Award, Search,
  ShieldCheck, ShieldX, ClipboardList, Wifi, Building2,
  UserPlus, BadgeCheck, Footprints,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type UserType      = "tutor" | "parent";
type VerifStatus   = "pending" | "approved" | "rejected";
type BookingStatus = "confirmed" | "pending" | "cancelled";
type DocType       = "national_id" | "education_certificate";
type WalkInStatus  = "in_progress" | "verified";

interface OnlineDoc {
  id: string;
  doc_type: DocType;
  filename: string;
  size: string;
  submitted_at: string;
}

interface OnlineSubmission {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_type: UserType;
  submitted_at: string;
  status: VerifStatus;
  rejection_reason?: string;
  documents: OnlineDoc[];
}

interface InPersonUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  subjects?: string[];
}

interface UploadedDoc {
  doc_type: DocType;
  filename: string;
}

interface SlotBooking {
  id: string;
  slot_id: string;
  user: InPersonUser;
  status: BookingStatus;
  booked_at: string;
  verified: boolean;
  uploaded_docs: UploadedDoc[];
}

interface VerificationSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  location: string;
  notes: string;
  bookings: SlotBooking[];
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  created_at: string;
}

// Existing platform user selected for a walk-in
interface PlatformUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  subjects?: string;
}

interface WalkInRecord {
  id: string;
  user: PlatformUser;
  walked_in_at: string;
  walked_in_date: string;
  status: WalkInStatus;
  verified_at?: string;
  uploaded_docs: UploadedDoc[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing platform users available for walk-in selection
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORM_USERS: PlatformUser[] = [
  { id: "pu-001", full_name: "Abebe Kebede",    email: "abebe.kebede@gmail.com",    phone: "+251 911 100 001", user_type: "tutor",  subjects: "Mathematics, Physics"   },
  { id: "pu-002", full_name: "Tigist Alemu",    email: "tigist.alemu@gmail.com",    phone: "+251 922 100 002", user_type: "parent"                                      },
  { id: "pu-003", full_name: "Dawit Tadesse",   email: "dawit.tadesse@gmail.com",   phone: "+251 933 100 003", user_type: "tutor",  subjects: "Biology, Chemistry"      },
  { id: "pu-004", full_name: "Hiwot Girma",     email: "hiwot.girma@gmail.com",     phone: "+251 944 100 004", user_type: "parent"                                      },
  { id: "pu-005", full_name: "Yonas Haile",     email: "yonas.haile@gmail.com",     phone: "+251 955 100 005", user_type: "tutor",  subjects: "English Literature"      },
  { id: "pu-006", full_name: "Marta Bekele",    email: "marta.bekele@gmail.com",    phone: "+251 966 100 006", user_type: "parent"                                      },
  { id: "pu-007", full_name: "Solomon Taye",    email: "solomon.taye@gmail.com",    phone: "+251 977 100 007", user_type: "tutor",  subjects: "History, Civics"         },
  { id: "pu-008", full_name: "Rahel Desta",     email: "rahel.desta@gmail.com",     phone: "+251 988 100 008", user_type: "parent"                                      },
  { id: "pu-009", full_name: "Berhane Assefa",  email: "berhane.assefa@gmail.com",  phone: "+251 911 100 009", user_type: "tutor",  subjects: "Computer Science, Math"  },
  { id: "pu-010", full_name: "Selamawit Worku", email: "selam.worku@gmail.com",     phone: "+251 922 100 010", user_type: "parent"                                      },
  { id: "pu-011", full_name: "Girma Lemma",     email: "girma.lemma@gmail.com",     phone: "+251 933 100 011", user_type: "tutor",  subjects: "Physics, Mathematics"    },
  { id: "pu-012", full_name: "Aster Habtamu",   email: "aster.habtamu@gmail.com",   phone: "+251 944 100 012", user_type: "parent"                                      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const seedOnline: OnlineSubmission[] = [
  {
    id: "vs-001", user_id: "u101", user_name: "Alem Habtamu", user_email: "alem.habtamu@gmail.com",
    user_phone: "+251 911 234 567", user_type: "tutor", submitted_at: "Mar 20, 2026 – 09:14 AM",
    status: "pending",
    documents: [
      { id: "d1", doc_type: "national_id",           filename: "alem_national_id.jpg",    size: "1.8 MB", submitted_at: "Mar 20, 2026" },
      { id: "d2", doc_type: "education_certificate", filename: "alem_bsc_certificate.pdf", size: "3.2 MB", submitted_at: "Mar 20, 2026" },
    ],
  },
  {
    id: "vs-002", user_id: "u102", user_name: "Meron Tesfaye", user_email: "meron.tesfaye@gmail.com",
    user_phone: "+251 922 345 678", user_type: "parent", submitted_at: "Mar 21, 2026 – 02:45 PM",
    status: "pending",
    documents: [
      { id: "d3", doc_type: "national_id", filename: "meron_id_card.jpg", size: "2.1 MB", submitted_at: "Mar 21, 2026" },
    ],
  },
  {
    id: "vs-003", user_id: "u103", user_name: "Yonas Bekele", user_email: "yonas.bekele@gmail.com",
    user_phone: "+251 933 456 789", user_type: "tutor", submitted_at: "Mar 19, 2026 – 11:30 AM",
    status: "approved",
    documents: [
      { id: "d4", doc_type: "national_id",           filename: "yonas_id.png",            size: "0.9 MB", submitted_at: "Mar 19, 2026" },
      { id: "d5", doc_type: "education_certificate", filename: "yonas_masters_degree.pdf", size: "4.1 MB", submitted_at: "Mar 19, 2026" },
    ],
  },
  {
    id: "vs-004", user_id: "u104", user_name: "Tigist Wolde", user_email: "tigist.wolde@gmail.com",
    user_phone: "+251 944 567 890", user_type: "parent", submitted_at: "Mar 22, 2026 – 08:05 AM",
    status: "pending",
    documents: [
      { id: "d6", doc_type: "national_id", filename: "tigist_kebele_id.jpg", size: "1.4 MB", submitted_at: "Mar 22, 2026" },
    ],
  },
  {
    id: "vs-005", user_id: "u105", user_name: "Kaleb Desta", user_email: "kaleb.desta@gmail.com",
    user_phone: "+251 955 678 901", user_type: "tutor", submitted_at: "Mar 18, 2026 – 04:20 PM",
    status: "rejected",
    rejection_reason: "Education certificate is expired (issued 2015, over 10 years old). Please re-upload a valid certificate.",
    documents: [
      { id: "d7", doc_type: "national_id",           filename: "kaleb_id.jpg",          size: "1.1 MB", submitted_at: "Mar 18, 2026" },
      { id: "d8", doc_type: "education_certificate", filename: "kaleb_diploma_2015.pdf", size: "2.8 MB", submitted_at: "Mar 18, 2026" },
    ],
  },
  {
    id: "vs-006", user_id: "u106", user_name: "Hana Girma", user_email: "hana.girma@gmail.com",
    user_phone: "+251 966 789 012", user_type: "parent", submitted_at: "Mar 17, 2026 – 01:00 PM",
    status: "rejected",
    rejection_reason: "The submitted ID photo is blurry and unreadable. Please re-upload a clear, well-lit photo.",
    documents: [
      { id: "d9", doc_type: "national_id", filename: "hana_id_blurry.jpg", size: "0.3 MB", submitted_at: "Mar 17, 2026" },
    ],
  },
  {
    id: "vs-007", user_id: "u107", user_name: "Biruk Alemu", user_email: "biruk.alemu@gmail.com",
    user_phone: "+251 977 890 123", user_type: "tutor", submitted_at: "Mar 23, 2026 – 07:50 AM",
    status: "pending",
    documents: [
      { id: "d10", doc_type: "national_id",           filename: "biruk_passport.jpg",     size: "2.5 MB", submitted_at: "Mar 23, 2026" },
      { id: "d11", doc_type: "education_certificate", filename: "biruk_bsc_comp_sci.pdf",  size: "5.0 MB", submitted_at: "Mar 23, 2026" },
    ],
  },
  {
    id: "vs-008", user_id: "u108", user_name: "Selam Tadesse", user_email: "selam.tadesse@gmail.com",
    user_phone: "+251 988 901 234", user_type: "parent", submitted_at: "Mar 23, 2026 – 10:30 AM",
    status: "pending",
    documents: [
      { id: "d12", doc_type: "national_id", filename: "selam_national_id.jpg", size: "1.7 MB", submitted_at: "Mar 23, 2026" },
    ],
  },
];

const seedWalkIns: WalkInRecord[] = [
  {
    id: "wi-001",
    user: { id: "wi-u001", full_name: "Dawit Haile", email: "dawit.haile@gmail.com", phone: "+251 911 111 222", user_type: "tutor", subjects: "Mathematics, Physics" },
    walked_in_at: "Mar 22, 2026 – 10:05 AM", walked_in_date: "2026-03-22",
    status: "verified", verified_at: "Mar 22, 2026 – 10:34 AM",
    uploaded_docs: [
      { doc_type: "national_id",           filename: "dawit_national_id.jpg"     },
      { doc_type: "education_certificate", filename: "dawit_bsc_mathematics.pdf" },
    ],
  },
  {
    id: "wi-002",
    user: { id: "wi-u002", full_name: "Rahel Mengistu", email: "rahel.mengistu@gmail.com", phone: "+251 922 333 444", user_type: "parent" },
    walked_in_at: "Mar 23, 2026 – 09:20 AM", walked_in_date: "2026-03-23",
    status: "verified", verified_at: "Mar 23, 2026 – 09:38 AM",
    uploaded_docs: [
      { doc_type: "national_id", filename: "rahel_kebele_id.jpg" },
    ],
  },
  {
    id: "wi-003",
    user: { id: "wi-u003", full_name: "Tesfaye Girma", email: "tesfaye.girma@gmail.com", phone: "+251 933 555 666", user_type: "tutor", subjects: "English Literature" },
    walked_in_at: "Mar 23, 2026 – 11:45 AM", walked_in_date: "2026-03-23",
    status: "in_progress",
    uploaded_docs: [
      { doc_type: "national_id", filename: "tesfaye_id.png" },
    ],
  },
];

const IP_USERS: Record<string, InPersonUser> = {
  u011: { id: "u011", full_name: "Daniel Osei",      email: "daniel.osei@gmail.com",     phone: "+251 933 234 567", user_type: "tutor",  subjects: ["Mathematics","Science"]  },
  u012: { id: "u012", full_name: "Abena Asante",     email: "abena.asante@gmail.com",    phone: "+251 944 345 678", user_type: "tutor",  subjects: ["English","History"]      },
  u013: { id: "u013", full_name: "Samuel Boateng",   email: "samuel.boateng@gmail.com",  phone: "+251 955 456 789", user_type: "tutor",  subjects: ["Science","Biology"]      },
  u014: { id: "u014", full_name: "Linda Owusu",      email: "linda.owusu@gmail.com",     phone: "+251 966 567 890", user_type: "parent" },
  u015: { id: "u015", full_name: "Yaw Darko",        email: "yaw.darko@gmail.com",       phone: "+251 977 678 901", user_type: "parent" },
  u016: { id: "u016", full_name: "Fatima Al-Hassan", email: "fatima.alhassan@gmail.com", phone: "+251 988 789 012", user_type: "tutor",  subjects: ["French","English"]       },
  u017: { id: "u017", full_name: "Kojo Mensah",      email: "kojo.mensah@gmail.com",     phone: "+251 911 890 123", user_type: "tutor",  subjects: ["Physics","Mathematics"]  },
};

const seedSlots: VerificationSlot[] = [
  {
    id: "slot-001", date: "2026-03-17", start_time: "09:00", end_time: "10:00",
    capacity: 5, location: "Gobez Office – Room A, Bole Sub-City, Addis Ababa",
    notes: "Bring original ID and degree certificate.",
    bookings: [
      { id: "sb-001", slot_id: "slot-001", user: IP_USERS.u011, status: "confirmed", booked_at: "Mar 14, 2026 – 10:22 AM", verified: false, uploaded_docs: [] },
      { id: "sb-002", slot_id: "slot-001", user: IP_USERS.u014, status: "confirmed", booked_at: "Mar 14, 2026 – 11:45 AM", verified: true,  uploaded_docs: [{ doc_type: "national_id", filename: "linda_id.jpg" }] },
      { id: "sb-003", slot_id: "slot-001", user: IP_USERS.u013, status: "pending",   booked_at: "Mar 15, 2026 – 09:10 AM", verified: false, uploaded_docs: [] },
    ],
  },
  {
    id: "slot-002", date: "2026-03-17", start_time: "14:00", end_time: "15:30",
    capacity: 4, location: "Gobez Office – Room B, Bole Sub-City, Addis Ababa", notes: "",
    bookings: [
      { id: "sb-004", slot_id: "slot-002", user: IP_USERS.u016, status: "confirmed", booked_at: "Mar 15, 2026 – 02:30 PM", verified: false, uploaded_docs: [] },
    ],
  },
  {
    id: "slot-003", date: "2026-03-24", start_time: "09:00", end_time: "11:00",
    capacity: 8, location: "Gobez Office – Conference Room, Bole Sub-City, Addis Ababa",
    notes: "Group session. Arrive 15 min early.",
    bookings: [
      { id: "sb-005", slot_id: "slot-003", user: IP_USERS.u017, status: "confirmed", booked_at: "Mar 10, 2026 – 08:00 AM", verified: false, uploaded_docs: [] },
      { id: "sb-006", slot_id: "slot-003", user: IP_USERS.u015, status: "confirmed", booked_at: "Mar 11, 2026 – 03:20 PM", verified: false, uploaded_docs: [] },
      { id: "sb-007", slot_id: "slot-003", user: IP_USERS.u012, status: "confirmed", booked_at: "Mar 12, 2026 – 11:05 AM", verified: false, uploaded_docs: [] },
    ],
  },
  {
    id: "slot-004", date: "2026-03-26", start_time: "14:00", end_time: "16:00",
    capacity: 4, location: "Gobez Office – Room B, Bole Sub-City, Addis Ababa", notes: "",
    bookings: [
      { id: "sb-010", slot_id: "slot-004", user: IP_USERS.u013, status: "confirmed", booked_at: "Mar 16, 2026 – 08:15 AM", verified: false, uploaded_docs: [] },
      { id: "sb-011", slot_id: "slot-004", user: IP_USERS.u016, status: "confirmed", booked_at: "Mar 16, 2026 – 09:40 AM", verified: false, uploaded_docs: [] },
    ],
  },
  {
    id: "slot-005", date: "2026-04-02", start_time: "09:00", end_time: "10:00",
    capacity: 5, location: "Gobez Office – Room A, Bole Sub-City, Addis Ababa",
    notes: "First verification slot of April.", bookings: [],
  },
];

const seedBlockedDates: BlockedDate[] = [
  { id: "bd-001", date: "2026-03-18", reason: "Ethiopian Holiday – Victory of Adwa Commemoration", created_at: "Mar 5, 2026"  },
  { id: "bd-002", date: "2026-03-21", reason: "Office Maintenance & Deep Cleaning",                 created_at: "Mar 10, 2026" },
  { id: "bd-003", date: "2026-03-30", reason: "Ethiopian Easter Preparations – Office Closed",       created_at: "Mar 12, 2026" },
  { id: "bd-004", date: "2026-04-10", reason: "Good Friday – Federal Public Holiday",               created_at: "Mar 14, 2026" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtDateLong(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtDateMed(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowDisplay() {
  return new Date().toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).replace(",", " –");
}
function uid() { return "id-" + Math.random().toString(36).slice(2, 9); }
function initials(name: string) { return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

function getCalendarDays(year: number, month: number): (string | null)[] {
  const off = (new Date(year, month, 1).getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(off).fill(null);
  for (let d = 1; d <= dim; d++)
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  return cells;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW    = ["Mo","Tu","We","Th","Fr","Sa","Su"];

const requiredDocs: Record<UserType, DocType[]> = {
  tutor:  ["national_id", "education_certificate"],
  parent: ["national_id"],
};
const docLabels: Record<DocType, string> = {
  national_id:           "National ID / Kebele ID",
  education_certificate: "Education Certificate",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, userType }: { name: string; userType: UserType }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: userType === "tutor"
          ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
          : "linear-gradient(135deg,#0d9488,#14b8a6)",
        color: "white", fontSize: "0.62rem", fontWeight: 700,
      }}>
      {initials(name)}
    </div>
  );
}

function UserTypeBadge({ t }: { t: UserType }) {
  const isTutor = t === "tutor";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: isTutor ? "rgba(124,58,237,0.1)" : "rgba(13,148,136,0.1)",
               color: isTutor ? "#7c3aed" : "#0d9488", fontSize: "0.62rem", fontWeight: 700 }}>
      {isTutor ? <GraduationCap style={{ width: 10, height: 10 }} /> : <Users style={{ width: 10, height: 10 }} />}
      {isTutor ? "Tutor" : "Parent"}
    </span>
  );
}

function BookingBadge({ s }: { s: BookingStatus }) {
  const cfg = {
    confirmed: { color: "#16a34a", bg: "rgba(34,197,94,0.1)",  label: "Confirmed", Icon: CheckCircle },
    pending:   { color: "#d97706", bg: "rgba(245,158,11,0.1)", label: "Pending",   Icon: AlertCircle },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  label: "Cancelled", Icon: XCircle     },
  }[s];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: 600, whiteSpace: "nowrap" }}>
      <cfg.Icon style={{ width: 10, height: 10 }} />{cfg.label}
    </span>
  );
}

function inputSx(err?: boolean): React.CSSProperties {
  return {
    width: "100%", borderRadius: 10, border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
    padding: "9px 12px", fontSize: "0.82rem", color: "#0f172a", background: "#f8fafc",
    fontFamily: "'Poppins', sans-serif", outline: "none", boxSizing: "border-box",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter bar + Search bar — at module scope per arch rules
// ─────────────────────────────────────────────────────────────────────────────
function FilterBar({ value, setValue, opts }: {
  value: string;
  setValue: (v: any) => void;
  opts: { id: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {opts.map(f => (
        <button key={f.id} onClick={() => setValue(f.id)}
          className="px-3 py-1.5 rounded-xl"
          style={{
            background: value === f.id ? "rgba(13,148,136,0.1)" : "#f8fafc",
            color: value === f.id ? "#0d9488" : "#64748b",
            border: value === f.id ? "1.5px solid rgba(13,148,136,0.25)" : "1.5px solid #e2e8f0",
            fontWeight: value === f.id ? 700 : 500, fontSize: "0.75rem",
            cursor: "pointer", fontFamily: "'Poppins', sans-serif",
          }}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 w-full sm:max-w-xs">
      <Search style={{ width: 15, height: 15, color: "#94a3b8", position: "absolute",
                       left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                 borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white",
                 fontSize: "0.82rem", color: "#0f172a", outline: "none",
                 fontFamily: "'Poppins', sans-serif", boxSizing: "border-box" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rejection Modal
// ─────────────────────────────────────────────────────────────────────────────
function RejectModal({ userName, onCancel, onConfirm }: {
  userName: string; onCancel: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [err,    setErr]    = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="rounded-2xl overflow-hidden"
        style={{ width: "min(480px,100%)", background: "white",
                 boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "'Poppins', sans-serif",
                 animation: "fadeUp 0.2s ease-out" }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <ShieldX style={{ width: 16, height: 16, color: "#ef4444" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Reject Verification</h2>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>{userName}</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <TriangleAlert style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5 }}>
              The user will be notified with the reason and can re-submit their documents.
            </p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: 6, fontFamily: "'Poppins', sans-serif" }}>
              Rejection Reason *
            </label>
            <textarea value={reason} onChange={e => { setReason(e.target.value); setErr(""); }} rows={4}
              placeholder="e.g. Photo is blurry, document is expired…"
              style={{ ...inputSx(!!err), resize: "vertical", lineHeight: 1.6 }} />
            {err && <p style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 3 }}>{err}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { if (!reason.trim()) { setErr("Please provide a reason."); return; } onConfirm(reason.trim()); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "white", border: "none", cursor: "pointer",
                       fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Poppins', sans-serif",
                       boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
              <ShieldX style={{ width: 15, height: 15 }} /> Confirm Rejection
            </button>
            <button onClick={onCancel}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                       background: "#f8fafc", color: "#64748b", cursor: "pointer",
                       fontWeight: 600, fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeUp { from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1} }`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Online Submission Card
// ─────────────────────────────────────────────────────────────────────────────
function OnlineCard({ sub, onApprove, onReject }: {
  sub: OnlineSubmission;
  onApprove: (id: string) => void;
  onReject:  (id: string, reason: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const required    = requiredDocs[sub.user_type];
  const submitted   = sub.documents.map(d => d.doc_type);
  const missing     = required.filter(r => !submitted.includes(r));
  const isIncomplete = missing.length > 0 && sub.status === "pending";

  const statusCfg = {
    pending:  { color: "#d97706", bg: "rgba(245,158,11,0.1)",  label: "Pending",  Icon: AlertCircle },
    approved: { color: "#16a34a", bg: "rgba(34,197,94,0.1)",   label: "Approved", Icon: CheckCircle },
    rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Rejected", Icon: XCircle     },
  }[sub.status];

  return (
    <>
      <div className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "white", border: "1.5px solid #f1f5f9",
                 boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontFamily: "'Poppins', sans-serif" }}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar name={sub.user_name} userType={sub.user_type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{sub.user_name}</span>
              <UserTypeBadge t={sub.user_type} />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: "0.68rem", fontWeight: 700 }}>
                <statusCfg.Icon style={{ width: 11, height: 11 }} />{statusCfg.label}
              </span>
              {isIncomplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#d97706", fontSize: "0.62rem", fontWeight: 700 }}>
                  <AlertCircle style={{ width: 9, height: 9 }} />INCOMPLETE
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{sub.user_email}</p>
            <div className="flex items-center gap-1 mt-1 flex-wrap" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
              <Phone style={{ width: 10, height: 10 }} /> {sub.user_phone}
              <span className="mx-1.5" style={{ color: "#e2e8f0" }}>·</span>
              <Clock style={{ width: 10, height: 10 }} /> {sub.submitted_at}
            </div>
          </div>
        </div>
        {/* Docs */}
        <div>
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em",
                      textTransform: "uppercase", marginBottom: 8 }}>Submitted Documents</p>
          <div className="flex flex-col gap-2">
            {sub.documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: doc.doc_type === "national_id" ? "rgba(13,148,136,0.1)" : "rgba(124,58,237,0.1)" }}>
                  {doc.doc_type === "national_id"
                    ? <IdCard style={{ width: 14, height: 14, color: "#0d9488" }} />
                    : <Award  style={{ width: 14, height: 14, color: "#7c3aed" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a" }}>{docLabels[doc.doc_type]}</p>
                  <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{doc.filename} · {doc.size}</p>
                </div>
                <FileText style={{ width: 13, height: 13, color: "#94a3b8" }} />
              </div>
            ))}
            {missing.map(dt => (
              <div key={dt} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: "rgba(245,158,11,0.05)", border: "1px dashed rgba(245,158,11,0.4)" }}>
                <AlertCircle style={{ width: 14, height: 14, color: "#d97706" }} />
                <p style={{ fontSize: "0.72rem", color: "#d97706", fontWeight: 600 }}>Missing: {docLabels[dt]}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Rejection reason */}
        {sub.status === "rejected" && sub.rejection_reason && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <ShieldX style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 700, marginBottom: 2 }}>Rejection Reason</p>
              <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5 }}>{sub.rejection_reason}</p>
            </div>
          </div>
        )}
        {/* Actions */}
        {sub.status === "pending" && (
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => onApprove(sub.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a",
                       border: "1.5px solid rgba(22,163,74,0.2)", cursor: "pointer",
                       fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Poppins', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(22,163,74,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(22,163,74,0.08)")}>
              <ShieldCheck style={{ width: 15, height: 15 }} /> Approve
            </button>
            <button onClick={() => setShowReject(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: "rgba(239,68,68,0.07)", color: "#ef4444",
                       border: "1.5px solid rgba(239,68,68,0.2)", cursor: "pointer",
                       fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Poppins', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}>
              <ShieldX style={{ width: 15, height: 15 }} /> Reject
            </button>
          </div>
        )}
      </div>
      {showReject && (
        <RejectModal userName={sub.user_name} onCancel={() => setShowReject(false)}
          onConfirm={reason => { onReject(sub.id, reason); setShowReject(false); }} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Walk-In Modal  — search existing platform users, select one
// ─────────────────────────────────────────────────────────────────────────────
function NewWalkInModal({ existingIds, onClose, onSave }: {
  existingIds: Set<string>;
  onClose: () => void;
  onSave:  (r: WalkInRecord) => void;
}) {
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [err,      setErr]      = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORM_USERS;
    return PLATFORM_USERS.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  }, [query]);

  const save = () => {
    if (!selected) { setErr("Please select a user first."); return; }
    onSave({
      id: "wi-" + uid(),
      user: selected,
      walked_in_at: nowDisplay(),
      walked_in_date: todayStr(),
      status: "in_progress",
      uploaded_docs: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ width: "min(500px,100%)", maxHeight: "88vh", background: "white",
                 boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "'Poppins', sans-serif",
                 animation: "fadeUp 0.2s ease-out" }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(13,148,136,0.12),rgba(20,184,166,0.12))" }}>
              <Footprints style={{ width: 18, height: 18, color: "#0d9488" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>New Walk-In Verification</h2>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>
                Find the user's existing account and start verification
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 pt-4">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)" }}>
            <Info style={{ width: 13, height: 13, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.55 }}>
              The user already has an account. Search by name, email or phone, then select them.
              You'll upload their physical documents on the next step.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search style={{ width: 15, height: 15, color: "#94a3b8", position: "absolute",
                             left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setErr(""); }}
              placeholder="Search by name, email or phone…"
              style={{ ...inputSx(), paddingLeft: 36 }} autoFocus />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users style={{ width: 24, height: 24, color: "#cbd5e1" }} />
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No users match your search.</p>
            </div>
          ) : (
            results.map(u => {
              const alreadyIn = existingIds.has(u.id);
              const isSel     = selected?.id === u.id;
              return (
                <button key={u.id}
                  onClick={() => { if (!alreadyIn) { setSelected(u); setErr(""); } }}
                  disabled={alreadyIn}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-all"
                  style={{
                    background: isSel
                      ? "rgba(13,148,136,0.08)"
                      : alreadyIn ? "#f8fafc" : "white",
                    border: isSel
                      ? "1.5px solid rgba(13,148,136,0.3)"
                      : `1.5px solid ${alreadyIn ? "#f1f5f9" : "#e2e8f0"}`,
                    cursor: alreadyIn ? "not-allowed" : "pointer",
                    opacity: alreadyIn ? 0.5 : 1,
                  }}>
                  <Avatar name={u.full_name} userType={u.user_type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: "0.85rem", fontWeight: 700,
                                     color: isSel ? "#0d9488" : "#0f172a" }}>{u.full_name}</span>
                      <UserTypeBadge t={u.user_type} />
                      {alreadyIn && (
                        <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 600 }}>
                          Already added
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 1 }}>{u.email}</p>
                    <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                      <span className="flex items-center gap-1"><Phone style={{ width: 10, height: 10 }} />{u.phone}</span>
                      {u.user_type === "tutor" && u.subjects && (
                        <span className="flex items-center gap-1"><BookOpen style={{ width: 10, height: 10 }} />{u.subjects}</span>
                      )}
                    </div>
                  </div>
                  {isSel && <CheckCircle style={{ width: 18, height: 18, color: "#0d9488", flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>

        {/* Selected preview + doc requirement */}
        {selected && (
          <div className="px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.2)" }}>
              <ShieldCheck style={{ width: 13, height: 13, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: "0.72rem", color: "#0d9488", fontWeight: 700 }}>
                  Selected: {selected.full_name}
                </p>
                <p style={{ fontSize: "0.68rem", color: "#475569", marginTop: 2 }}>
                  Will need to upload: {requiredDocs[selected.user_type].map(d => docLabels[d]).join(" + ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {err && <p style={{ fontSize: "0.68rem", color: "#ef4444", textAlign: "center", padding: "0 24px" }}>{err}</p>}

        {/* Footer */}
        <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button onClick={save}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ background: selected ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "#e2e8f0",
                     color: selected ? "white" : "#94a3b8", border: "none",
                     cursor: selected ? "pointer" : "not-allowed",
                     fontWeight: 700, fontSize: "0.88rem", fontFamily: "'Poppins', sans-serif",
                     boxShadow: selected ? "0 4px 14px rgba(13,148,136,0.3)" : "none" }}>
            <UserPlus style={{ width: 16, height: 16 }} />
            {selected ? `Start Walk-In for ${selected.full_name.split(" ")[0]}` : "Select a user first"}
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                     background: "#f8fafc", color: "#64748b", cursor: "pointer",
                     fontWeight: 600, fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>
            Cancel
          </button>
        </div>
        <style>{`@keyframes fadeUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Walk-In Card
// ─────────────────────────────────────────────────────────────────────────────
function WalkInCard({ rec, onUpload, onVerify, onDelete }: {
  rec:      WalkInRecord;
  onUpload: (id: string, doc: UploadedDoc) => void;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded,   setExpanded]   = useState(rec.status === "in_progress");
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const required      = requiredDocs[rec.user.user_type];
  const uploadedTypes = rec.uploaded_docs.map(d => d.doc_type);
  const allUploaded   = required.every(r => uploadedTypes.includes(r));
  const missing       = required.filter(r => !uploadedTypes.includes(r));

  const handleFile = (docType: DocType, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onUpload(rec.id, { doc_type: docType, filename: f.name });
    e.target.value = "";
  };

  const isVerified = rec.status === "verified";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "white",
        border: `1.5px solid ${isVerified ? "rgba(13,148,136,0.25)" : "rgba(245,158,11,0.3)"}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontFamily: "'Poppins', sans-serif",
      }}>

      {/* Card body */}
      <div className="p-5 flex flex-col gap-3">

        {/* Row 1: avatar + info + delete */}
        <div className="flex items-start gap-3">
          <Avatar name={rec.user.full_name} userType={rec.user.user_type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{rec.user.full_name}</span>
              <UserTypeBadge t={rec.user.user_type} />
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", fontSize: "0.68rem", fontWeight: 700 }}>
                  <BadgeCheck style={{ width: 11, height: 11 }} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#d97706", fontSize: "0.68rem", fontWeight: 700 }}>
                  <AlertCircle style={{ width: 11, height: 11 }} /> In Progress
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{rec.user.email}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
              <span className="flex items-center gap-1"><Phone style={{ width: 10, height: 10 }} />{rec.user.phone}</span>
              <span className="flex items-center gap-1"><Clock style={{ width: 10, height: 10 }} />{rec.walked_in_at}</span>
              {rec.user.user_type === "tutor" && rec.user.subjects && (
                <span className="flex items-center gap-1"><BookOpen style={{ width: 10, height: 10 }} />{rec.user.subjects}</span>
              )}
            </div>
          </div>
          {/* delete button */}
          {confirmDel ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onDelete(rec.id)}
                className="px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626",
                         border: "1.5px solid rgba(239,68,68,0.2)", cursor: "pointer",
                         fontWeight: 700, fontSize: "0.68rem", fontFamily: "'Poppins', sans-serif" }}>
                Delete
              </button>
              <button onClick={() => setConfirmDel(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 3 }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="p-1.5 rounded-xl flex-shrink-0"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#ef4444"; el.style.background = "rgba(239,68,68,0.06)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = "#cbd5e1"; el.style.background = "none"; }}>
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Uploaded docs summary */}
        {rec.uploaded_docs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {rec.uploaded_docs.map(d => (
              <div key={d.doc_type} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.12)" }}>
                <CheckCircle style={{ width: 12, height: 12, color: "#0d9488", flexShrink: 0 }} />
                <span style={{ fontSize: "0.72rem", color: "#0d9488", fontWeight: 600 }}>{docLabels[d.doc_type]}</span>
                <span style={{ fontSize: "0.65rem", color: "#94a3b8", marginLeft: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.filename}</span>
              </div>
            ))}
            {!isVerified && missing.map(dt => (
              <div key={dt} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(245,158,11,0.05)", border: "1px dashed rgba(245,158,11,0.35)" }}>
                <AlertCircle style={{ width: 12, height: 12, color: "#d97706", flexShrink: 0 }} />
                <span style={{ fontSize: "0.72rem", color: "#d97706", fontWeight: 600 }}>Missing: {docLabels[dt]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Verified at */}
        {isVerified && rec.verified_at && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
            <BadgeCheck style={{ width: 13, height: 13, color: "#0d9488", flexShrink: 0 }} />
            <span style={{ fontSize: "0.72rem", color: "#0d9488", fontWeight: 600 }}>Verified at {rec.verified_at}</span>
          </div>
        )}

        {/* Toggle button (in_progress only) */}
        {!isVerified && (
          <button onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
            style={{
              background: expanded ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.05)",
              border: "1.5px solid rgba(13,148,136,0.2)", color: "#0d9488",
              cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.13)")}
            onMouseLeave={e => (e.currentTarget.style.background = expanded ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.05)")}>
            <Upload style={{ width: 14, height: 14 }} />
            {expanded ? "Hide Upload Panel" : "Upload Documents & Verify"}
          </button>
        )}
      </div>

      {/* Upload panel */}
      {expanded && !isVerified && (
        <div className="px-5 pb-5 flex flex-col gap-3" style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <p style={{ fontSize: "0.72rem", color: "#475569", fontWeight: 600 }}>
            Scan / upload documents handed over by this {rec.user.user_type}:
          </p>

          {required.map(docType => {
            const uploaded = rec.uploaded_docs.find(d => d.doc_type === docType);
            const refKey   = `${rec.id}-${docType}`;
            return (
              <div key={docType} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: uploaded ? "rgba(13,148,136,0.04)" : "#f8fafc",
                  border: `1.5px solid ${uploaded ? "rgba(13,148,136,0.2)" : "#e2e8f0"}`,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: docType === "national_id" ? "rgba(13,148,136,0.1)" : "rgba(124,58,237,0.1)" }}>
                  {docType === "national_id"
                    ? <IdCard style={{ width: 15, height: 15, color: "#0d9488" }} />
                    : <Award  style={{ width: 15, height: 15, color: "#7c3aed" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a" }}>{docLabels[docType]}</p>
                  {uploaded
                    ? <p style={{ fontSize: "0.65rem", color: "#0d9488", marginTop: 1 }}>✓ {uploaded.filename}</p>
                    : <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 1 }}>No file uploaded yet</p>}
                </div>
                <input ref={el => { fileRefs.current[refKey] = el; }} type="file"
                  accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }}
                  onChange={e => handleFile(docType, e)} />
                <button onClick={() => fileRefs.current[refKey]?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: uploaded ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.06)",
                           border: "1.5px solid rgba(13,148,136,0.2)", color: "#0d9488",
                           cursor: "pointer", fontWeight: 600, fontSize: "0.68rem",
                           fontFamily: "'Poppins', sans-serif" }}>
                  <Upload style={{ width: 11, height: 11 }} />
                  {uploaded ? "Re-upload" : "Choose File"}
                </button>
              </div>
            );
          })}

          <button onClick={() => { onVerify(rec.id); setExpanded(false); }}
            disabled={!allUploaded}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mt-1"
            style={{
              background: allUploaded ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "#e2e8f0",
              color: allUploaded ? "white" : "#94a3b8", border: "none",
              cursor: allUploaded ? "pointer" : "not-allowed",
              fontWeight: 700, fontSize: "0.88rem", fontFamily: "'Poppins', sans-serif",
              boxShadow: allUploaded ? "0 4px 14px rgba(13,148,136,0.3)" : "none",
              transition: "all 0.2s",
            }}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            {allUploaded ? "Mark as Verified" : "Upload all documents first"}
          </button>
          {!allUploaded && (
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", textAlign: "center" }}>
              Still needed: {missing.map(r => docLabels[r]).join(" and ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendee Panel (appointment slots)
// ─────────────────────────────────────────────────────────────────────────────
function AttendeePanel({ slot, onClose, onVerify, onUploadDoc }: {
  slot: VerificationSlot; onClose: () => void;
  onVerify:    (slotId: string, bookingId: string) => void;
  onUploadDoc: (slotId: string, bookingId: string, doc: UploadedDoc) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const confirmed = slot.bookings.filter(b => b.status === "confirmed").length;
  const pending   = slot.bookings.filter(b => b.status === "pending").length;
  const cancelled = slot.bookings.filter(b => b.status === "cancelled").length;

  const handleFileChange = (bookingId: string, docType: DocType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadDoc(slot.id, bookingId, { doc_type: docType, filename: file.name });
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full flex flex-col overflow-hidden"
        style={{ width: "min(520px,100vw)", background: "white",
                 boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                 fontFamily: "'Poppins', sans-serif", animation: "slideIn 0.22s ease-out" }}>

        <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 style={{ width: 14, height: 14, color: "#0d9488" }} />
                <span style={{ fontSize: "0.63rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  In-Person Verification — Appointment
                </span>
              </div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.05rem" }}>
                {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>{fmtDateLong(slot.date)}</p>
              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                <MapPin style={{ width: 10, height: 10 }} />{slot.location}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {[
              { label: `${confirmed} Confirmed`, color: "#16a34a", bg: "rgba(34,197,94,0.1)"  },
              { label: `${pending} Pending`,     color: "#d97706", bg: "rgba(245,158,11,0.1)" },
              { label: `${cancelled} Cancelled`, color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
              { label: `${slot.bookings.filter(b => b.verified).length} Verified`, color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
            ].map(c => (
              <span key={c.label} className="px-2.5 py-1 rounded-full"
                style={{ background: c.bg, color: c.color, fontSize: "0.68rem", fontWeight: 700 }}>{c.label}</span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {slot.bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.08)" }}>
                <Users style={{ width: 22, height: 22, color: "#0d9488" }} />
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>No one has booked this slot yet.</p>
            </div>
          ) : (
            slot.bookings.map(b => {
              const req     = requiredDocs[b.user.user_type];
              const utypes  = b.uploaded_docs.map(d => d.doc_type);
              const allUp   = req.every(r => utypes.includes(r));
              const isOpen  = expanded === b.id;
              return (
                <div key={b.id} className="rounded-2xl overflow-hidden"
                  style={{ border: `1.5px solid ${b.verified ? "rgba(13,148,136,0.3)" : "#f1f5f9"}`,
                           background: b.verified ? "rgba(13,148,136,0.02)" : "white" }}>
                  <div className="p-4 flex items-start gap-3">
                    <Avatar name={b.user.full_name} userType={b.user.user_type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{b.user.full_name}</span>
                        <UserTypeBadge t={b.user.user_type} />
                        <BookingBadge s={b.status} />
                        {b.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(13,148,136,0.12)", color: "#0d9488", fontSize: "0.62rem", fontWeight: 700 }}>
                            <CheckCircle style={{ width: 9, height: 9 }} />VERIFIED
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 2 }}>{b.user.email}</p>
                      <div className="flex items-center gap-1 mt-1" style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                        <Phone style={{ width: 10, height: 10 }} /> {b.user.phone}
                        {b.user.subjects && (
                          <><span className="mx-1.5" style={{ color: "#e2e8f0" }}>·</span>
                          <BookOpen style={{ width: 10, height: 10 }} />
                          <span className="ml-0.5">{b.user.subjects.join(", ")}</span></>
                        )}
                      </div>
                    </div>
                    {!b.verified && (
                      <button onClick={() => setExpanded(isOpen ? null : b.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
                        style={{ background: isOpen ? "rgba(13,148,136,0.1)" : "#f8fafc",
                                 border: `1.5px solid ${isOpen ? "rgba(13,148,136,0.25)" : "#e2e8f0"}`,
                                 color: isOpen ? "#0d9488" : "#64748b", cursor: "pointer",
                                 fontWeight: 600, fontSize: "0.72rem", fontFamily: "'Poppins', sans-serif" }}>
                        <Upload style={{ width: 12, height: 12 }} />
                        {isOpen ? "Close" : "Upload & Verify"}
                      </button>
                    )}
                  </div>
                  {isOpen && !b.verified && (
                    <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid #f8fafc", paddingTop: 12 }}>
                      <p style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600 }}>Upload documents handed over in person:</p>
                      {req.map(docType => {
                        const uploaded = b.uploaded_docs.find(d => d.doc_type === docType);
                        const refKey   = `${b.id}-${docType}`;
                        return (
                          <div key={docType} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: uploaded ? "rgba(13,148,136,0.05)" : "#f8fafc",
                                     border: `1.5px solid ${uploaded ? "rgba(13,148,136,0.2)" : "#e2e8f0"}` }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: docType === "national_id" ? "rgba(13,148,136,0.1)" : "rgba(124,58,237,0.1)" }}>
                              {docType === "national_id"
                                ? <IdCard style={{ width: 13, height: 13, color: "#0d9488" }} />
                                : <Award  style={{ width: 13, height: 13, color: "#7c3aed" }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a" }}>{docLabels[docType]}</p>
                              {uploaded
                                ? <p style={{ fontSize: "0.65rem", color: "#0d9488" }}>✓ {uploaded.filename}</p>
                                : <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>No file selected</p>}
                            </div>
                            <input ref={el => { fileRefs.current[refKey] = el; }} type="file"
                              accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }}
                              onChange={e => handleFileChange(b.id, docType, e)} />
                            <button onClick={() => fileRefs.current[refKey]?.click()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
                              style={{ background: "rgba(13,148,136,0.08)", border: "1.5px solid rgba(13,148,136,0.2)",
                                       color: "#0d9488", cursor: "pointer", fontWeight: 600, fontSize: "0.68rem",
                                       fontFamily: "'Poppins', sans-serif" }}>
                              <Upload style={{ width: 11, height: 11 }} />
                              {uploaded ? "Re-upload" : "Upload"}
                            </button>
                          </div>
                        );
                      })}
                      <button onClick={() => { onVerify(slot.id, b.id); setExpanded(null); }}
                        disabled={!allUp}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mt-1"
                        style={{ background: allUp ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "#e2e8f0",
                                 color: allUp ? "white" : "#94a3b8", border: "none",
                                 cursor: allUp ? "pointer" : "not-allowed",
                                 fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Poppins', sans-serif",
                                 boxShadow: allUp ? "0 4px 14px rgba(13,148,136,0.3)" : "none" }}>
                        <ShieldCheck style={{ width: 15, height: 15 }} />
                        {allUp ? "Mark as Verified" : "Upload all required docs first"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Slot Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddSlotModal({ prefillDate, blockedDates, onClose, onSave }: {
  prefillDate: string | null; blockedDates: BlockedDate[];
  onClose: () => void; onSave: (s: VerificationSlot) => void;
}) {
  const [date,     setDate]  = useState(prefillDate ?? "");
  const [start,    setStart] = useState("09:00");
  const [end,      setEnd]   = useState("10:00");
  const [capacity, setCap]   = useState(5);
  const [location, setLoc]   = useState("Gobez Office – Room A, Bole Sub-City, Addis Ababa");
  const [notes,    setNotes] = useState("");
  const [errs,     setErrs]  = useState<Record<string, string>>({});
  const blockedSet = useMemo(() => new Set(blockedDates.map(b => b.date)), [blockedDates]);

  const save = () => {
    const e: Record<string, string> = {};
    if (!date)             e.date  = "Date is required.";
    else if (blockedSet.has(date)) e.date = "This date is blocked.";
    if (!start)            e.start = "Required.";
    if (!end)              e.end   = "Required.";
    else if (end <= start) e.end   = "Must be after start.";
    if (capacity < 1)      e.cap   = "Min 1.";
    if (!location.trim())  e.loc   = "Required.";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({ id: "slot-" + uid(), date, start_time: start, end_time: end,
             capacity, location: location.trim(), notes: notes.trim(), bookings: [] });
  };

  const F = ({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", color: "#475569",
                      fontWeight: 600, marginBottom: 5, fontFamily: "'Poppins', sans-serif" }}>{label}</label>
      {children}
      {err && <p style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 3 }}>{err}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ width: "min(520px,100%)", maxHeight: "90vh", background: "white",
                 boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: "'Poppins', sans-serif",
                 animation: "fadeUp 0.2s ease-out" }}>
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.1)" }}>
              <Plus style={{ width: 16, height: 16, color: "#0d9488" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Add Verification Slot</h2>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>Create an in-person appointment slot</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <F label="Date *" err={errs.date}><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSx(!!errs.date)} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Start Time *" err={errs.start}><input type="time" value={start} onChange={e => setStart(e.target.value)} style={inputSx(!!errs.start)} /></F>
            <F label="End Time *"   err={errs.end}><input type="time" value={end}   onChange={e => setEnd(e.target.value)}   style={inputSx(!!errs.end)}   /></F>
          </div>
          <F label="Capacity *" err={errs.cap}>
            <input type="number" min={1} max={50} value={capacity}
              onChange={e => setCap(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...inputSx(!!errs.cap), width: 120 }} />
          </F>
          <F label="Location *" err={errs.loc}>
            <input type="text" value={location} onChange={e => setLoc(e.target.value)}
              placeholder="e.g. Gobez Office – Room A" style={inputSx(!!errs.loc)} />
          </F>
          <F label="Notes (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Instructions, documents to bring…" style={{ ...inputSx(), resize: "vertical", lineHeight: 1.6 }} />
          </F>
        </div>
        <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button onClick={save} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
            style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white", border: "none", cursor: "pointer",
                     fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Poppins', sans-serif",
                     boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
            <Save style={{ width: 15, height: 15 }} /> Save Slot
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                     background: "#f8fafc", color: "#64748b", cursor: "pointer",
                     fontWeight: 600, fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Blocked Date Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddBlockedDateModal({ onClose, onSave }: { onClose: () => void; onSave: (b: BlockedDate) => void }) {
  const [date, setDate]     = useState("");
  const [reason, setReason] = useState("");
  const [errs, setErrs]     = useState<Record<string, string>>({});

  const save = () => {
    const e: Record<string, string> = {};
    if (!date)          e.date   = "Required.";
    if (!reason.trim()) e.reason = "Required.";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({ id: "bd-" + uid(), date, reason: reason.trim(),
             created_at: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl overflow-hidden"
        style={{ width: "min(420px,100%)", background: "white",
                 boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: "'Poppins', sans-serif",
                 animation: "fadeUp 0.2s ease-out" }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <CalendarOff style={{ width: 16, height: 16, color: "#ef4444" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Block a Date</h2>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>Prevent bookings on this date</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#475569", fontWeight: 600, marginBottom: 5, fontFamily: "'Poppins', sans-serif" }}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSx(!!errs.date)} />
            {errs.date && <p style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 3 }}>{errs.date}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#475569", fontWeight: 600, marginBottom: 5, fontFamily: "'Poppins', sans-serif" }}>Reason *</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Public Holiday, Office Maintenance…" style={inputSx(!!errs.reason)} />
            {errs.reason && <p style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 3 }}>{errs.reason}</p>}
          </div>
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <TriangleAlert style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: "0.7rem", color: "#475569", lineHeight: 1.5 }}>Users will not be able to book slots on blocked dates.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "white", border: "none", cursor: "pointer",
                       fontWeight: 700, fontSize: "0.85rem", fontFamily: "'Poppins', sans-serif",
                       boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
              <CalendarOff style={{ width: 15, height: 15 }} /> Block Date
            </button>
            <button onClick={onClose}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                       background: "#f8fafc", color: "#64748b", cursor: "pointer",
                       fontWeight: 600, fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slot Card
// ─────────────────────────────────────────────────────────────────────────────
function SlotCard({ slot, onView, onDelete }: {
  slot: VerificationSlot; onView: (s: VerificationSlot) => void; onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const confirmed = slot.bookings.filter(b => b.status === "confirmed").length;
  const pending   = slot.bookings.filter(b => b.status === "pending").length;
  const cancelled = slot.bookings.filter(b => b.status === "cancelled").length;
  const active    = confirmed + pending;
  const verified  = slot.bookings.filter(b => b.verified).length;
  const isFull    = active >= slot.capacity;
  const pct       = Math.min((active / slot.capacity) * 100, 100);
  const barColor  = pct >= 100 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#0d9488";

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "white", border: `1.5px solid ${isFull ? "rgba(239,68,68,0.2)" : "#f1f5f9"}`,
               boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock style={{ width: 14, height: 14, color: "#0d9488" }} />
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
              {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin style={{ width: 11, height: 11, color: "#94a3b8" }} />
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{slot.location}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full"
          style={{ background: isFull ? "rgba(239,68,68,0.1)" : "rgba(13,148,136,0.1)",
                   color: isFull ? "#dc2626" : "#0d9488", fontSize: "0.68rem", fontWeight: 700 }}>
          {isFull ? "FULL" : `${slot.capacity - active} OPEN`}
        </span>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 500 }}>Capacity</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: barColor }}>{active} / {slot.capacity}</span>
        </div>
        <div className="w-full rounded-full" style={{ height: 6, background: "#f1f5f9" }}>
          <div className="rounded-full" style={{ width: `${pct}%`, height: 6, background: barColor, transition: "width 0.5s" }} />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", fontSize: "0.7rem", fontWeight: 600 }}>
          <CheckCircle style={{ width: 11, height: 11 }} /> {confirmed} confirmed
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: "rgba(245,158,11,0.08)", color: "#d97706", fontSize: "0.7rem", fontWeight: 600 }}>
          <AlertCircle style={{ width: 11, height: 11 }} /> {pending} pending
        </span>
        {cancelled > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: "0.7rem", fontWeight: 600 }}>
            <XCircle style={{ width: 11, height: 11 }} /> {cancelled} cancelled
          </span>
        )}
        {verified > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488", fontSize: "0.7rem", fontWeight: 600 }}>
            <ShieldCheck style={{ width: 11, height: 11 }} /> {verified} verified
          </span>
        )}
      </div>
      {slot.notes && (
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
          <Info style={{ width: 12, height: 12, color: "#94a3b8", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.55 }}>{slot.notes}</p>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onView(slot)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl"
          style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488",
                   border: "1.5px solid rgba(13,148,136,0.15)", cursor: "pointer",
                   fontWeight: 600, fontSize: "0.78rem", fontFamily: "'Poppins', sans-serif" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(13,148,136,0.08)")}>
          <UserCheck style={{ width: 14, height: 14 }} /> Attendees ({slot.bookings.length})
        </button>
        {confirmDel ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(slot.id)} className="px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626",
                       border: "1.5px solid rgba(239,68,68,0.2)", cursor: "pointer",
                       fontWeight: 700, fontSize: "0.72rem", fontFamily: "'Poppins', sans-serif" }}>Confirm</button>
            <button onClick={() => setConfirmDel(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="p-2 rounded-xl"
            style={{ background: "#f8fafc", border: "1.5px solid #f1f5f9", cursor: "pointer", color: "#94a3b8" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(239,68,68,0.08)"; el.style.color = "#ef4444"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f8fafc"; el.style.color = "#94a3b8"; }}>
            <Trash2 style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Calendar
// ─────────────────────────────────────────────────────────────────────────────
function CalendarWidget({ year, month, selectedDate, slotsMap, blockedSet, onPrev, onNext, onSelect }: {
  year: number; month: number; selectedDate: string | null;
  slotsMap: Map<string, number>; blockedSet: Set<string>;
  onPrev: () => void; onNext: () => void; onSelect: (d: string) => void;
}) {
  const cells = getCalendarDays(year, month);
  const today = todayStr();
  return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
        <button onClick={onPrev} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{MONTHS[month]} {year}</span>
        <button onClick={onNext} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {DOW.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.04em" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {cells.map((ds, i) => {
          if (!ds) return <div key={`e-${i}`} />;
          const isSel = ds === selectedDate, isBlk = blockedSet.has(ds), isTdy = ds === today, cnt = slotsMap.get(ds) ?? 0;
          return (
            <button key={ds} onClick={() => !isBlk && onSelect(ds)}
              style={{ width: "100%", aspectRatio: "1", borderRadius: 8, border: "none",
                       cursor: isBlk ? "not-allowed" : "pointer",
                       display: "flex", flexDirection: "column", alignItems: "center",
                       justifyContent: "center", gap: 2, padding: 0,
                       background: isSel ? "linear-gradient(135deg,#0d9488,#14b8a6)"
                         : isBlk ? "rgba(239,68,68,0.08)" : isTdy ? "rgba(13,148,136,0.08)" : "transparent",
                       outline: isTdy && !isSel ? "1.5px solid rgba(13,148,136,0.4)" : "none" }}
              onMouseEnter={e => { if (!isSel && !isBlk) (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => {
                if (!isSel && !isBlk && !isTdy) (e.currentTarget as HTMLElement).style.background = "transparent";
                else if (!isSel && isTdy)       (e.currentTarget as HTMLElement).style.background = "rgba(13,148,136,0.08)";
              }}>
              <span style={{ fontSize: "0.72rem", fontWeight: isTdy || isSel ? 700 : 400,
                             color: isSel ? "white" : isBlk ? "#ef4444" : isTdy ? "#0d9488" : "#475569", lineHeight: 1 }}>
                {new Date(ds + "T00:00:00").getDate()}
              </span>
              {cnt > 0 && !isBlk && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : "#0d9488" }} />}
              {isBlk && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#ef4444" }} />}
            </button>
          );
        })}
      </div>
      <div className="px-4 pb-4 flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid #f8fafc", paddingTop: 10 }}>
        {[{ color: "#0d9488", label: "Has slots", outline: false }, { color: "#ef4444", label: "Blocked", outline: false }, { color: "#0d9488", label: "Today", outline: true }].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.outline ? "transparent" : l.color, border: l.outline ? `2px solid ${l.color}` : "none" }} />
            <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
type MainTab = "online" | "walkin" | "appointments" | "blocked";

export function VerificationAppointments() {
  const [mainTab,      setMainTab]     = useState<MainTab>("online");

  // online
  const [submissions,  setSubmissions] = useState<OnlineSubmission[]>(seedOnline);
  const [onlineFilter, setOnlineFilter]= useState<"all"|VerifStatus|UserType>("all");
  const [onlineSearch, setOnlineSearch]= useState("");

  // walk-ins
  const [walkIns,       setWalkIns]      = useState<WalkInRecord[]>(seedWalkIns);
  const [showNewWalkIn, setShowNewWalkIn]= useState(false);
  const [wiSearch,      setWiSearch]     = useState("");
  const [wiFilter,      setWiFilter]     = useState<"all"|WalkInStatus|UserType>("all");

  // slots
  const [slots,        setSlots]       = useState<VerificationSlot[]>(seedSlots);
  const [blockedDates, setBlocked]     = useState<BlockedDate[]>(seedBlockedDates);
  const [selectedDate, setSelected]    = useState<string | null>("2026-03-24");
  const [calYear,      setCalYear]     = useState(2026);
  const [calMonth,     setCalMonth]    = useState(2);
  const [attendeeSlot, setAttendeeSlot]= useState<VerificationSlot | null>(null);
  const [showAddSlot,  setShowAddSlot] = useState(false);
  const [showAddBlock, setShowAddBlock]= useState(false);
  const [blockConfirm, setBlockConfirm]= useState<string | null>(null);

  const blockedSet = useMemo(() => new Set(blockedDates.map(b => b.date)), [blockedDates]);
  const slotsMap   = useMemo(() => {
    const m = new Map<string, number>();
    slots.forEach(s => m.set(s.date, (m.get(s.date) ?? 0) + 1));
    return m;
  }, [slots]);
  const selectedDateSlots = useMemo(
    () => slots.filter(s => s.date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, selectedDate]
  );

  const filteredOnline = useMemo(() => {
    let list = submissions;
    if (onlineFilter !== "all") list = list.filter(s => s.status === onlineFilter || s.user_type === onlineFilter);
    if (onlineSearch.trim()) { const q = onlineSearch.toLowerCase(); list = list.filter(s => s.user_name.toLowerCase().includes(q) || s.user_email.toLowerCase().includes(q)); }
    return list;
  }, [submissions, onlineFilter, onlineSearch]);

  const filteredWalkIns = useMemo(() => {
    let list = walkIns;
    if (wiFilter !== "all") list = list.filter(w => w.status === wiFilter || w.user.user_type === wiFilter);
    if (wiSearch.trim()) {
      const q = wiSearch.toLowerCase();
      list = list.filter(w => w.user.full_name.toLowerCase().includes(q) || w.user.email.toLowerCase().includes(q));
    }
    return list;
  }, [walkIns, wiFilter, wiSearch]);

  // actions
  const approveSubmission = (id: string) => setSubmissions(p => p.map(s => s.id === id ? { ...s, status: "approved", rejection_reason: undefined } : s));
  const rejectSubmission  = (id: string, reason: string) => setSubmissions(p => p.map(s => s.id === id ? { ...s, status: "rejected", rejection_reason: reason } : s));

  const walkInUserIds = useMemo(() => new Set(walkIns.map(w => w.user.id)), [walkIns]);

  const addWalkIn       = (r: WalkInRecord) => { setWalkIns(p => [r, ...p]); setShowNewWalkIn(false); };
  const deleteWalkIn    = (id: string) => setWalkIns(p => p.filter(w => w.id !== id));
  const uploadWalkInDoc = (id: string, doc: UploadedDoc) =>
    setWalkIns(p => p.map(w => w.id !== id ? w : { ...w, uploaded_docs: [...w.uploaded_docs.filter(d => d.doc_type !== doc.doc_type), doc] }));
  const verifyWalkIn    = (id: string) =>
    setWalkIns(p => p.map(w => w.id !== id ? w : { ...w, status: "verified", verified_at: nowDisplay() }));

  const prevMonth  = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth  = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const addSlot    = (slot: VerificationSlot) => { setSlots(p => [...p, slot]); setShowAddSlot(false); setSelected(slot.date); };
  const deleteSlot = (id: string) => { setSlots(p => p.filter(s => s.id !== id)); setAttendeeSlot(null); };

  const verifyBooking = (slotId: string, bookingId: string) => {
    const upd = (sl: VerificationSlot) => sl.id !== slotId ? sl : { ...sl, bookings: sl.bookings.map(b => b.id !== bookingId ? b : { ...b, verified: true }) };
    setSlots(p => p.map(upd));
    setAttendeeSlot(p => p ? upd(p) : null);
  };
  const uploadDoc = (slotId: string, bookingId: string, doc: UploadedDoc) => {
    const upd = (sl: VerificationSlot) => sl.id !== slotId ? sl : { ...sl, bookings: sl.bookings.map(b => b.id !== bookingId ? b : { ...b, uploaded_docs: [...b.uploaded_docs.filter(d => d.doc_type !== doc.doc_type), doc] }) };
    setSlots(p => p.map(upd));
    setAttendeeSlot(p => p ? upd(p) : null);
  };

  // stats
  const pendingOnline   = submissions.filter(s => s.status === "pending").length;
  const approvedOnline  = submissions.filter(s => s.status === "approved").length;
  const rejectedOnline  = submissions.filter(s => s.status === "rejected").length;
  const wiInProgress    = walkIns.filter(w => w.status === "in_progress").length;
  const wiVerified      = walkIns.filter(w => w.status === "verified").length;
  const apptVerified    = slots.reduce((n, s) => n + s.bookings.filter(b => b.verified).length, 0);
  const totalBlocked    = blockedDates.length;

  const ONLINE_FILTERS: {id:"all"|VerifStatus|UserType; label:string}[] = [
    {id:"all",label:"All"},{id:"pending",label:"Pending"},{id:"approved",label:"Approved"},
    {id:"rejected",label:"Rejected"},{id:"tutor",label:"Tutors"},{id:"parent",label:"Parents"},
  ];
  const WI_FILTERS: {id:"all"|WalkInStatus|UserType; label:string}[] = [
    {id:"all",label:"All"},{id:"in_progress",label:"In Progress"},{id:"verified",label:"Verified"},
    {id:"tutor",label:"Tutors"},{id:"parent",label:"Parents"},
  ];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="mb-5">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
          Verification Center
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
          Review online submissions, verify walk-ins, and manage in-person appointment slots
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        {[
          { label: "Pending Online",   value: pendingOnline,  color: "#d97706", bg: "rgba(245,158,11,0.08)",  icon: AlertCircle  },
          { label: "Approved Online",  value: approvedOnline, color: "#16a34a", bg: "rgba(34,197,94,0.08)",   icon: ShieldCheck  },
          { label: "Rejected Online",  value: rejectedOnline, color: "#ef4444", bg: "rgba(239,68,68,0.08)",   icon: ShieldX      },
          { label: "Walk-In Progress", value: wiInProgress,   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  icon: Footprints   },
          { label: "Walk-In Verified", value: wiVerified,     color: "#0d9488", bg: "rgba(13,148,136,0.08)",  icon: BadgeCheck   },
          { label: "Appt. Verified",   value: apptVerified,   color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  icon: UserCheck    },
          { label: "Blocked Dates",    value: totalBlocked,   color: "#64748b", bg: "rgba(100,116,139,0.08)", icon: CalendarOff  },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-3"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon style={{ width: 14, height: 14, color }} />
            </div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.1 }}>{value}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.6rem", marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-2xl flex-wrap"
        style={{ background: "white", border: "1px solid #f1f5f9", width: "fit-content" }}>
        {[
          { id: "online"       as MainTab, label: "Online Requests",   icon: Wifi,        badge: pendingOnline > 0 ? pendingOnline : null },
          { id: "walkin"       as MainTab, label: "Walk-In",           icon: Footprints,  badge: wiInProgress > 0 ? wiInProgress : null   },
          { id: "appointments" as MainTab, label: "Appointment Slots", icon: Building2,   badge: null },
          { id: "blocked"      as MainTab, label: "Blocked Dates",     icon: CalendarOff, badge: null },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{ background: mainTab === t.id ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "transparent",
                     color: mainTab === t.id ? "white" : "#64748b", border: "none", cursor: "pointer",
                     fontWeight: mainTab === t.id ? 700 : 500, fontSize: "0.82rem",
                     fontFamily: "'Poppins', sans-serif",
                     boxShadow: mainTab === t.id ? "0 3px 10px rgba(13,148,136,0.25)" : "none" }}>
            <t.icon style={{ width: 15, height: 15 }} />
            {t.label}
            {t.badge !== null && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: mainTab === t.id ? "rgba(255,255,255,0.25)" : "#ef4444",
                         color: "white", fontSize: "0.6rem", fontWeight: 700 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ONLINE ── */}
      {mainTab === "online" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            <SearchBar value={onlineSearch} onChange={setOnlineSearch} placeholder="Search by name or email…" />
            <FilterBar value={onlineFilter} setValue={setOnlineFilter} opts={ONLINE_FILTERS} />
          </div>
          {filteredOnline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
              style={{ background: "white", border: "1px solid #f1f5f9" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.08)" }}>
                <ClipboardList style={{ width: 26, height: 26, color: "#0d9488" }} />
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No submissions match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOnline.map(sub => (
                <OnlineCard key={sub.id} sub={sub} onApprove={approveSubmission} onReject={rejectSubmission} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WALK-IN ── */}
      {mainTab === "walkin" && (
        <div>
          {/* Banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5"
            style={{ background: "rgba(13,148,136,0.05)", border: "1.5px solid rgba(13,148,136,0.15)" }}>
            <Footprints style={{ width: 16, height: 16, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0d9488" }}>Walk-In Verification</p>
              <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.6, marginTop: 2 }}>
                For users who prefer to bring their documents in person instead of uploading online.
                Search their existing account → upload the physical documents they hand you → click <strong>Mark as Verified</strong>.
                Tutors require <strong>National ID + Education Certificate</strong>; parents require <strong>National ID only</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <SearchBar value={wiSearch} onChange={setWiSearch} placeholder="Search walk-ins…" />
              <FilterBar value={wiFilter} setValue={setWiFilter} opts={WI_FILTERS} />
            </div>
            <button onClick={() => setShowNewWalkIn(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                       border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                       fontFamily: "'Poppins', sans-serif", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
              <UserPlus style={{ width: 15, height: 15 }} /> New Walk-In
            </button>
          </div>

          {filteredWalkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
              style={{ background: "white", border: "1px solid #f1f5f9" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.08)" }}>
                <Footprints style={{ width: 28, height: 28, color: "#0d9488" }} />
              </div>
              <div className="text-center">
                <p style={{ color: "#0f172a", fontWeight: 600, fontSize: "0.9rem" }}>No walk-in records</p>
                <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 4 }}>
                  {wiFilter !== "all" || wiSearch ? "No results match your filters." : "Click \"New Walk-In\" to find a user's account and begin verification."}
                </p>
              </div>
              {wiFilter === "all" && !wiSearch && (
                <button onClick={() => setShowNewWalkIn(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                           border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                           fontFamily: "'Poppins', sans-serif", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
                  <UserPlus style={{ width: 15, height: 15 }} /> Register Walk-In
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredWalkIns.map(rec => (
                <WalkInCard key={rec.id} rec={rec}
                  onUpload={uploadWalkInDoc} onVerify={verifyWalkIn} onDelete={deleteWalkIn} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── APPOINTMENT SLOTS ── */}
      {mainTab === "appointments" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button onClick={() => setShowAddSlot(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                       border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                       fontFamily: "'Poppins', sans-serif", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
              <Plus style={{ width: 15, height: 15 }} /> Add Slot
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <CalendarWidget year={calYear} month={calMonth} selectedDate={selectedDate}
              slotsMap={slotsMap} blockedSet={blockedSet}
              onPrev={prevMonth} onNext={nextMonth} onSelect={setSelected} />
            <div>
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>{fmtDateLong(selectedDate)}</p>
                      {blockedSet.has(selectedDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.68rem", fontWeight: 700 }}>
                          <Ban style={{ width: 10, height: 10 }} /> Blocked Date
                        </span>
                      )}
                    </div>
                    <button onClick={() => setShowAddSlot(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ background: "rgba(13,148,136,0.08)", color: "#0d9488",
                               border: "1.5px solid rgba(13,148,136,0.2)", cursor: "pointer",
                               fontWeight: 600, fontSize: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                      <Plus style={{ width: 13, height: 13 }} /> Add slot for this date
                    </button>
                  </div>
                  {selectedDateSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl"
                      style={{ background: "white", border: "1px dashed #e2e8f0" }}>
                      <CalendarDays style={{ width: 28, height: 28, color: "#cbd5e1" }} />
                      <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>No slots for {fmtDateMed(selectedDate)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedDateSlots.map(s => (
                        <SlotCard key={s.id} slot={s} onView={slot => setAttendeeSlot(slot)} onDelete={deleteSlot} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
                  style={{ background: "white", border: "1px dashed #e2e8f0" }}>
                  <CalendarDays style={{ width: 28, height: 28, color: "#cbd5e1" }} />
                  <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Select a date from the calendar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCKED DATES ── */}
      {mainTab === "blocked" && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button onClick={() => setShowAddBlock(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "white",
                       border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                       fontFamily: "'Poppins', sans-serif", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
              <Plus style={{ width: 15, height: 15 }} /> Block a Date
            </button>
          </div>
          {blockedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
              style={{ background: "white", border: "1px solid #f1f5f9" }}>
              <CalendarDays style={{ width: 28, height: 28, color: "#cbd5e1" }} />
              <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>No blocked dates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {blockedDates.map(bd => (
                <div key={bd.id} className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "white", border: "1.5px solid rgba(239,68,68,0.15)",
                           boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(239,68,68,0.1)" }}>
                      <CalendarOff style={{ width: 16, height: 16, color: "#ef4444" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{fmtDateLong(bd.date)}</p>
                      <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>Added {bd.created_at}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.55 }}>{bd.reason}</p>
                  {blockConfirm === bd.id ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setBlocked(p => p.filter(b => b.id !== bd.id)); setBlockConfirm(null); }}
                        className="flex-1 py-2 rounded-xl"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626",
                                 border: "1.5px solid rgba(239,68,68,0.2)", cursor: "pointer",
                                 fontWeight: 700, fontSize: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                        Confirm Remove
                      </button>
                      <button onClick={() => setBlockConfirm(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6 }}>
                        <X style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setBlockConfirm(bd.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-fit"
                      style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b",
                               cursor: "pointer", fontWeight: 600, fontSize: "0.75rem",
                               fontFamily: "'Poppins', sans-serif" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(239,68,68,0.08)"; el.style.color = "#ef4444"; el.style.borderColor = "rgba(239,68,68,0.2)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#f8fafc"; el.style.color = "#64748b"; el.style.borderColor = "#e2e8f0"; }}>
                      <Trash2 style={{ width: 13, height: 13 }} /> Remove Block
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Panels */}
      {attendeeSlot && (
        <AttendeePanel slot={attendeeSlot} onClose={() => setAttendeeSlot(null)}
          onVerify={verifyBooking} onUploadDoc={uploadDoc} />
      )}
      {showNewWalkIn && (
        <NewWalkInModal existingIds={walkInUserIds} onClose={() => setShowNewWalkIn(false)} onSave={addWalkIn} />
      )}
      {showAddSlot && (
        <AddSlotModal prefillDate={selectedDate} blockedDates={blockedDates}
          onClose={() => setShowAddSlot(false)} onSave={addSlot} />
      )}
      {showAddBlock && (
        <AddBlockedDateModal onClose={() => setShowAddBlock(false)}
          onSave={bd => { setBlocked(p => [...p, bd]); setShowAddBlock(false); }} />
      )}
    </div>
  );
}
