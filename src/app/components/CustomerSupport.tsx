import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, X, Clock, CheckCircle, AlertCircle, XCircle,
  MessageSquare, Send, Users, GraduationCap, MoreVertical,
  Inbox, RefreshCw, ArrowLeft, Zap, CreditCard, CalendarClock,
  ShieldAlert, HelpCircle, Laptop, Star, ThumbsUp, Phone, Mail,
  UserCheck, Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────
type TicketStatus   = "open" | "in_progress" | "waiting" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type TicketCategory = "billing" | "booking" | "account" | "technical" | "verification" | "refund" | "general";
type UserRole       = "parent" | "tutor";

interface SupportUser {
  id: string; full_name: string; email: string; phone: string;
  role: UserRole; avatar_initials: string;
}

interface SupportMessage {
  id: string; ticket_id: string;
  sender_role: "user" | "agent";
  sender_name: string;
  agent_id?: string;   // which agent sent this
  body: string; created_at: string;
}

interface SupportTicket {
  id: string; user: SupportUser; subject: string;
  category: TicketCategory; priority: TicketPriority; status: TicketStatus;
  messages: SupportMessage[];
  created_at: string; updated_at: string; resolved_at: string | null;
  rating: number | null;
  assigned_to: string | null;        // agent id
  assigned_to_name: string | null;   // display name
}

// ── Static display map for seed messages (agent ids are hardcoded in seed data)
const AGENTS: Record<string, { name: string; initials: string; role: string }> = {
  "agent-001": { name: "Alex Haile",   initials: "AH", role: "admin"            },
  "agent-002": { name: "Sara Bekele",  initials: "SB", role: "customer_support" },
  "agent-003": { name: "Mike Tadesse", initials: "MT", role: "customer_support" },
};

// ── Seed users ────────────────────────────────────────────────────────────────
const mkUser = (id: string, name: string, email: string, phone: string, role: UserRole): SupportUser => ({
  id, full_name: name, email, phone, role,
  avatar_initials: name.split(" ").map(n => n[0]).join("").slice(0, 2),
});

const USERS: SupportUser[] = [
  mkUser("u001", "Sarah Johnson",    "sarah.johnson@gmail.com",    "+251 911 234 567", "parent"),
  mkUser("u002", "Kwame Mensah",     "kwame.mensah@yahoo.com",     "+251 922 345 678", "parent"),
  mkUser("u004", "David Acheampong", "david.acheampong@gmail.com", "+251 944 567 890", "parent"),
  mkUser("u005", "Ama Serwaa",       "ama.serwaa@gmail.com",       "+251 955 678 901", "parent"),
  mkUser("u007", "Nana Yaa Boateng", "nana.boateng@gmail.com",     "+251 977 890 123", "parent"),
  mkUser("u009", "Helen Tadesse",    "helen.tadesse@gmail.com",    "+251 911 012 345", "parent"),
  mkUser("u011", "Daniel Osei",      "daniel.osei@gmail.com",      "+251 933 234 567", "tutor"),
  mkUser("u012", "Abena Asante",     "abena.asante@gmail.com",     "+251 944 345 678", "tutor"),
  mkUser("u013", "Samuel Boateng",   "samuel.boateng@gmail.com",   "+251 955 456 789", "tutor"),
  mkUser("u016", "Fatima Al-Hassan", "fatima.alhassan@gmail.com",  "+251 988 789 012", "tutor"),
  mkUser("u017", "Kojo Mensah",      "kojo.mensah@gmail.com",      "+251 911 890 123", "tutor"),
];
const u = (id: string) => USERS.find(us => us.id === id)!;

// ── Seed tickets (some pre-assigned, some unassigned) ─────────────────────────
const seedTickets: SupportTicket[] = [
  {
    id: "TKT-0041", user: u("u001"), subject: "Unable to complete payment for booking #b9e2a871",
    category: "billing", priority: "urgent", status: "open", rating: null,
    assigned_to: null, assigned_to_name: null,
    created_at: "Mar 20, 2026 – 09:14 AM", updated_at: "Mar 20, 2026 – 09:14 AM", resolved_at: null,
    messages: [
      { id: "m1", ticket_id: "TKT-0041", sender_role: "user", sender_name: "Sarah Johnson",
        body: "Hello, I've been trying to pay for my booking with Daniel Osei (booking #b9e2a871) since yesterday morning. Every time I enter my card details and click Pay, I get a red error saying 'Transaction declined' but I can see the charge attempt on my bank app. It has happened 3 times now and I am worried my card is being double-charged. Please help urgently — my child's first session is scheduled for tomorrow.",
        created_at: "Mar 20, 2026 – 09:14 AM" },
    ],
  },
  {
    id: "TKT-0040", user: u("u011"), subject: "My tutor profile verification status not updated after appointment",
    category: "verification", priority: "high", status: "in_progress", rating: null,
    assigned_to: "agent-002", assigned_to_name: "Sara Bekele",
    created_at: "Mar 19, 2026 – 02:30 PM", updated_at: "Mar 20, 2026 – 10:05 AM", resolved_at: null,
    messages: [
      { id: "m2", ticket_id: "TKT-0040", sender_role: "user", sender_name: "Daniel Osei",
        body: "I attended the in-person verification session on March 17th at 9 AM (slot-001 at the Bole office). I brought all my documents — national ID, degree certificate, and a reference letter. The admin at the desk scanned everything. However, my profile still shows 'Pending Verification' and tutors with unverified profiles are not appearing in parent searches. It has now been 3 days. When will this be updated?",
        created_at: "Mar 19, 2026 – 02:30 PM" },
      { id: "m3", ticket_id: "TKT-0040", sender_role: "agent", sender_name: "Sara Bekele", agent_id: "agent-002",
        body: "Hi Daniel, thank you for attending the verification session and for following up. We have confirmed your attendance in our system and your documents are currently being reviewed by our verification team. This process typically takes 2–3 business days. We expect your profile to be updated by end of day March 21. We apologize for the inconvenience and appreciate your patience.",
        created_at: "Mar 20, 2026 – 10:05 AM" },
    ],
  },
  {
    id: "TKT-0039", user: u("u002"), subject: "Requesting refund for cancelled session — tutor no-show",
    category: "refund", priority: "high", status: "in_progress", rating: null,
    assigned_to: "agent-001", assigned_to_name: "Alex Haile",
    created_at: "Mar 18, 2026 – 11:00 AM", updated_at: "Mar 19, 2026 – 04:15 PM", resolved_at: null,
    messages: [
      { id: "m4", ticket_id: "TKT-0039", sender_role: "user", sender_name: "Kwame Mensah",
        body: "On March 16th I had a confirmed booking with tutor Samuel Boateng for an English session. He did not show up and did not send any message. I waited over 30 minutes and tried calling the number on his profile — no answer. I was charged Birr 180 for the session. I would like a full refund as this was entirely the tutor's fault.",
        created_at: "Mar 18, 2026 – 11:00 AM" },
      { id: "m5", ticket_id: "TKT-0039", sender_role: "agent", sender_name: "Alex Haile", agent_id: "agent-001",
        body: "Hello Kwame, we are very sorry for this experience. We have reviewed the booking records and confirmed that the session was not marked as started, which is consistent with a no-show. We have initiated the refund process for Birr 180 to your original payment method. Please allow 5–7 business days for it to appear. We are also investigating the tutor's account.",
        created_at: "Mar 19, 2026 – 04:15 PM" },
    ],
  },
  {
    id: "TKT-0038", user: u("u012"), subject: "How do I add a new subject to my tutor profile?",
    category: "account", priority: "low", status: "resolved", rating: 5,
    assigned_to: "agent-002", assigned_to_name: "Sara Bekele",
    created_at: "Mar 17, 2026 – 08:45 AM", updated_at: "Mar 17, 2026 – 09:20 AM", resolved_at: "Mar 17, 2026 – 09:20 AM",
    messages: [
      { id: "m6", ticket_id: "TKT-0038", sender_role: "user", sender_name: "Abena Asante",
        body: "I want to add 'French' to my list of subjects. I have been teaching French for 3 years and just got certified. I tried going to Edit Profile but I only see the subjects I added when I registered. Is there a way to add more or do I need to contact support?",
        created_at: "Mar 17, 2026 – 08:45 AM" },
      { id: "m7", ticket_id: "TKT-0038", sender_role: "agent", sender_name: "Sara Bekele", agent_id: "agent-002",
        body: "Hello Abena! Great news — adding a new subject is simple. Go to your Profile → Edit Profile → scroll down to the 'Subjects' section → click the '+' icon → search for 'French' and select it → then click Save Changes. Let us know if this worked!",
        created_at: "Mar 17, 2026 – 09:05 AM" },
      { id: "m8", ticket_id: "TKT-0038", sender_role: "user", sender_name: "Abena Asante",
        body: "That worked perfectly, thank you! Found it right away.",
        created_at: "Mar 17, 2026 – 09:18 AM" },
    ],
  },
  {
    id: "TKT-0037", user: u("u004"), subject: "App crashes when I try to open booking history on mobile",
    category: "technical", priority: "medium", status: "waiting", rating: null,
    assigned_to: "agent-003", assigned_to_name: "Mike Tadesse",
    created_at: "Mar 16, 2026 – 03:20 PM", updated_at: "Mar 17, 2026 – 11:00 AM", resolved_at: null,
    messages: [
      { id: "m9", ticket_id: "TKT-0037", sender_role: "user", sender_name: "David Acheampong",
        body: "Whenever I tap 'Booking History' in the app, it just closes and goes back to the home screen. It has been doing this for 2 days. I'm on a Samsung Galaxy A53 running Android 13. I've tried clearing the cache and reinstalling the app but the problem is still there. I need to check my past invoices for tax purposes.",
        created_at: "Mar 16, 2026 – 03:20 PM" },
      { id: "m10", ticket_id: "TKT-0037", sender_role: "agent", sender_name: "Mike Tadesse", agent_id: "agent-003",
        body: "Hi David, thank you for the detailed report. We have escalated this to our mobile development team with your device information. While we work on the fix, you can access your booking history from our web version at gobez.et/dashboard. Could you also let us know which app version you are using? You can find it in Settings → About.",
        created_at: "Mar 17, 2026 – 11:00 AM" },
    ],
  },
  {
    id: "TKT-0036", user: u("u005"), subject: "Booked wrong tutor by mistake — can I switch?",
    category: "booking", priority: "medium", status: "resolved", rating: 4,
    assigned_to: "agent-003", assigned_to_name: "Mike Tadesse",
    created_at: "Mar 15, 2026 – 06:00 PM", updated_at: "Mar 16, 2026 – 08:30 AM", resolved_at: "Mar 16, 2026 – 08:30 AM",
    messages: [
      { id: "m11", ticket_id: "TKT-0036", sender_role: "user", sender_name: "Ama Serwaa",
        body: "I accidentally booked Samuel Boateng instead of Daniel Osei for a Maths session this Saturday. The session is still 3 days away. Is it possible to cancel and rebook the correct tutor without losing my money?",
        created_at: "Mar 15, 2026 – 06:00 PM" },
      { id: "m12", ticket_id: "TKT-0036", sender_role: "agent", sender_name: "Mike Tadesse", agent_id: "agent-003",
        body: "Hello Ama, since the session is more than 48 hours away, you can cancel it penalty-free directly from your Bookings page. Once cancelled, the full amount (Birr 90) will be returned to your wallet balance within 24 hours and you can use it to book Daniel Osei. Let us know if you need any help!",
        created_at: "Mar 16, 2026 – 08:30 AM" },
    ],
  },
  {
    id: "TKT-0035", user: u("u016"), subject: "Payout for last week hasn't arrived in my bank account",
    category: "billing", priority: "high", status: "open", rating: null,
    assigned_to: null, assigned_to_name: null,
    created_at: "Mar 20, 2026 – 07:55 AM", updated_at: "Mar 20, 2026 – 07:55 AM", resolved_at: null,
    messages: [
      { id: "m13", ticket_id: "TKT-0035", sender_role: "user", sender_name: "Fatima Al-Hassan",
        body: "My weekly payout for the period March 9–15 was supposed to arrive on March 18. Today is March 20 and I still have not received it. The amount shows as 'Sent' in my tutor dashboard (Birr 1,240). My bank is CBE and I have double-checked that the account number on my profile is correct. Please advise.",
        created_at: "Mar 20, 2026 – 07:55 AM" },
    ],
  },
  {
    id: "TKT-0034", user: u("u009"), subject: "I can't reset my password — not receiving the email",
    category: "account", priority: "medium", status: "closed", rating: 5,
    assigned_to: "agent-001", assigned_to_name: "Alex Haile",
    created_at: "Mar 13, 2026 – 10:10 AM", updated_at: "Mar 14, 2026 – 02:00 PM", resolved_at: "Mar 14, 2026 – 02:00 PM",
    messages: [
      { id: "m14", ticket_id: "TKT-0034", sender_role: "user", sender_name: "Helen Tadesse",
        body: "I forgot my password and clicked 'Forgot Password'. I entered my email (helen.tadesse@gmail.com) and it says the email was sent, but I have checked my inbox and spam folder and nothing has arrived. I have tried 4 times in the last hour.",
        created_at: "Mar 13, 2026 – 10:10 AM" },
      { id: "m15", ticket_id: "TKT-0034", sender_role: "agent", sender_name: "Alex Haile", agent_id: "agent-001",
        body: "Hi Helen, we can see the emails were sent but our logs show they may be delayed by your provider. We have manually triggered a new reset link which should bypass the queue. Please check your inbox in the next 5 minutes. If it still doesn't arrive, reply here and we will reset your password directly.",
        created_at: "Mar 14, 2026 – 01:45 PM" },
      { id: "m16", ticket_id: "TKT-0034", sender_role: "user", sender_name: "Helen Tadesse",
        body: "Got it! The email just came through. All sorted, thank you so much.",
        created_at: "Mar 14, 2026 – 02:00 PM" },
    ],
  },
  {
    id: "TKT-0033", user: u("u017"), subject: "My profile photo is not uploading",
    category: "technical", priority: "low", status: "resolved", rating: 3,
    assigned_to: null, assigned_to_name: null,
    created_at: "Mar 12, 2026 – 04:30 PM", updated_at: "Mar 13, 2026 – 09:00 AM", resolved_at: "Mar 13, 2026 – 09:00 AM",
    messages: [
      { id: "m17", ticket_id: "TKT-0033", sender_role: "user", sender_name: "Kojo Mensah",
        body: "I am trying to upload a profile photo but it just spins and never finishes. My photo is a JPEG about 3.5 MB.",
        created_at: "Mar 12, 2026 – 04:30 PM" },
      { id: "m18", ticket_id: "TKT-0033", sender_role: "agent", sender_name: "Sara Bekele", agent_id: "agent-002",
        body: "Hi Kojo, our image upload limit is 2 MB. Please compress your photo before uploading — you can use a free tool like squoosh.app to reduce the file size. Once under 2 MB it should upload instantly. Let us know if it works!",
        created_at: "Mar 13, 2026 – 09:00 AM" },
    ],
  },
];

// ── Config ─────────────────────────────────────────────────────────────────────
const statusCfg: Record<TicketStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  open:        { label: "Open",        color: "#2563eb", bg: "rgba(37,99,235,0.1)",   icon: <Inbox      style={{ width: 11, height: 11 }} /> },
  in_progress: { label: "In Progress", color: "#d97706", bg: "rgba(245,158,11,0.1)",  icon: <RefreshCw  style={{ width: 11, height: 11 }} /> },
  waiting:     { label: "Waiting",     color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  icon: <Clock      style={{ width: 11, height: 11 }} /> },
  resolved:    { label: "Resolved",    color: "#16a34a", bg: "rgba(34,197,94,0.1)",   icon: <CheckCircle style={{ width: 11, height: 11 }} /> },
  closed:      { label: "Closed",      color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: <XCircle    style={{ width: 11, height: 11 }} /> },
};

const priorityCfg: Record<TicketPriority, { label: string; color: string; bg: string; dot: string }> = {
  low:    { label: "Low",    color: "#64748b", bg: "rgba(100,116,139,0.08)", dot: "#94a3b8" },
  medium: { label: "Medium", color: "#d97706", bg: "rgba(245,158,11,0.08)", dot: "#f59e0b" },
  high:   { label: "High",   color: "#dc2626", bg: "rgba(220,38,38,0.08)",  dot: "#ef4444" },
  urgent: { label: "Urgent", color: "#7f1d1d", bg: "rgba(127,29,29,0.1)",   dot: "#dc2626" },
};

const categoryCfg: Record<TicketCategory, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  billing:      { label: "Billing",      color: "#0284c7", bg: "rgba(2,132,199,0.08)",   icon: <CreditCard    style={{ width: 12, height: 12 }} /> },
  booking:      { label: "Booking",      color: "#0d9488", bg: "rgba(13,148,136,0.08)",  icon: <CalendarClock style={{ width: 12, height: 12 }} /> },
  account:      { label: "Account",      color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  icon: <Users         style={{ width: 12, height: 12 }} /> },
  technical:    { label: "Technical",    color: "#475569", bg: "rgba(71,85,105,0.08)",   icon: <Laptop        style={{ width: 12, height: 12 }} /> },
  verification: { label: "Verification", color: "#b45309", bg: "rgba(180,83,9,0.08)",    icon: <ShieldAlert   style={{ width: 12, height: 12 }} /> },
  refund:       { label: "Refund",       color: "#dc2626", bg: "rgba(220,38,38,0.08)",   icon: <Zap           style={{ width: 12, height: 12 }} /> },
  general:      { label: "General",      color: "#64748b", bg: "rgba(100,116,139,0.08)", icon: <HelpCircle    style={{ width: 12, height: 12 }} /> },
};

const QUICK_REPLIES = [
  "Thank you for reaching out. We are looking into this and will update you shortly.",
  "We have escalated this issue to our technical team. You will hear back within 24 hours.",
  "The refund has been initiated and should appear within 5–7 business days.",
  "Could you please provide more details so we can assist you better?",
  "We are happy to confirm this has been resolved. Please let us know if you need anything else.",
];

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

// ── Sub-components ─────────────────────────────────────────────────────────────
function Avatar({ name, role, size = 32 }: { name: string; role: UserRole; size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size,
        background: role === "tutor" ? "linear-gradient(135deg,#8b5cf6,#a78bfa)" : "linear-gradient(135deg,#0d9488,#14b8a6)",
        color: "white", fontSize: size * 0.26, fontWeight: 700, ...poppins }}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
    </div>
  );
}

function AgentAvatar({ agentId, size = 30, displayMap = AGENTS }: { agentId: string; size?: number; displayMap?: Record<string, { name: string; initials: string; role: string }> }) {
  const agent = displayMap[agentId] ?? AGENTS[agentId];
  const isAdmin = agent?.role === "admin";
  return (
    <div className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size,
        background: isAdmin ? "linear-gradient(135deg,#1e293b,#334155)" : "linear-gradient(135deg,#0d9488,#2dd4bf)",
        color: "white", fontSize: size * 0.26, fontWeight: 700, ...poppins }}>
      {agent?.initials ?? "??"}
    </div>
  );
}

function AssigneeBadge({ agentId, agentName, currentId }: { agentId: string; agentName: string; currentId: string }) {
  const isMe = agentId === currentId;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: isMe ? "rgba(13,148,136,0.12)" : "rgba(100,116,139,0.08)",
               color: isMe ? "#0d9488" : "#64748b",
               fontSize: "0.62rem", fontWeight: 700, ...poppins, whiteSpace: "nowrap" }}>
      <UserCheck style={{ width: 10, height: 10 }} />
      {isMe ? "You" : agentName}
    </span>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const s = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, fontSize: "0.68rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
      {s.icon}{s.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: TicketPriority }) {
  const p = priorityCfg[priority];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
      style={{ background: p.bg, color: p.color, fontSize: "0.65rem", fontWeight: 700, ...poppins }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dot, display: "inline-block", flexShrink: 0 }} />
      {p.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const c = categoryCfg[category];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color, fontSize: "0.67rem", fontWeight: 600, ...poppins, whiteSpace: "nowrap" }}>
      {c.icon}{c.label}
    </span>
  );
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} style={{ width: 11, height: 11,
          color: i <= rating ? "#f59e0b" : "#e2e8f0",
          fill:  i <= rating ? "#f59e0b" : "#e2e8f0" }} />
      ))}
    </div>
  );
}

// ── Ticket List Row ────────────────────────────────────────────────────────────
function TicketRow({
  ticket, active, onClick, currentAgentId,
}: {
  ticket: SupportTicket; active: boolean; onClick: () => void; currentAgentId: string;
}) {
  const lastMsg = ticket.messages[ticket.messages.length - 1];
  const unread  = ticket.status === "open" || ticket.status === "waiting";
  return (
    <div onClick={onClick} className="px-4 py-3.5 cursor-pointer transition-colors relative"
      style={{ background: active ? "rgba(13,148,136,0.06)" : "transparent",
               borderLeft: active ? "3px solid #0d9488" : "3px solid transparent",
               borderBottom: "1px solid #f8fafc" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#fafbff"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

      <div className="flex items-start gap-3">
        <Avatar name={ticket.user.full_name} role={ticket.user.role} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span style={{ fontSize: "0.8rem", fontWeight: unread ? 700 : 500, color: "#0f172a", ...poppins,
                           overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ticket.user.full_name}
            </span>
            <span style={{ fontSize: "0.62rem", color: "#94a3b8", ...poppins, whiteSpace: "nowrap", flexShrink: 0 }}>
              {ticket.updated_at.split(" – ")[0]}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#334155", fontWeight: unread ? 600 : 400, ...poppins,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ticket.subject}
          </p>
          <p style={{ fontSize: "0.68rem", color: "#94a3b8", ...poppins,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
            {lastMsg?.body.slice(0, 70)}…
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityDot priority={ticket.priority} />
            {ticket.assigned_to
              ? <AssigneeBadge agentId={ticket.assigned_to} agentName={ticket.assigned_to_name!} currentId={currentAgentId} />
              : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.08)", color: "#d97706",
                           fontSize: "0.62rem", fontWeight: 600, ...poppins }}>
                  Unassigned
                </span>
              )
            }
          </div>
        </div>
      </div>
      {unread && (
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d9488",
                      position: "absolute", top: 14, right: 14 }} />
      )}
    </div>
  );
}

// ── Conversation Panel ─────────────────────────────────────────────────────────
function ConversationPanel({
  ticket, onUpdate, onBack, currentAgentId, currentAgentName, isAdmin, agentMap,
}: {
  ticket: SupportTicket;
  onUpdate: (id: string, patch: Partial<SupportTicket>) => void;
  onBack: () => void;
  currentAgentId: string;
  currentAgentName: string;
  isAdmin: boolean;
  agentMap: Record<string, { name: string; initials: string; role: string }>;
}) {
  const [reply, setReply]           = useState("");
  const [showQuick, setShowQuick]   = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages.length]);

  const isAssignedToMe = ticket.assigned_to === currentAgentId;
  const canReply       = isAssignedToMe; // only assigned agent can reply

  const handleAssignToMe = () => {
    onUpdate(ticket.id, {
      assigned_to: currentAgentId,
      assigned_to_name: currentAgentName,
      status: ticket.status === "open" ? "in_progress" : ticket.status,
      updated_at: "Just now",
    });
  };

  const handleSend = () => {
    if (!reply.trim() || !canReply) return;
    setSending(true);
    const newMsg: SupportMessage = {
      id: "m-" + Date.now(), ticket_id: ticket.id,
      sender_role: "agent", sender_name: currentAgentName, agent_id: currentAgentId,
      body: reply.trim(), created_at: "Just now",
    };
    setTimeout(() => {
      onUpdate(ticket.id, {
        messages: [...ticket.messages, newMsg],
        status: ticket.status === "open" ? "in_progress" : ticket.status,
        updated_at: "Just now",
      });
      setReply(""); setSending(false);
    }, 400);
  };

  const setStatus = (status: TicketStatus) => {
    onUpdate(ticket.id, {
      status,
      resolved_at: (status === "resolved" || status === "closed") ? "Mar 23, 2026" : ticket.resolved_at,
      updated_at: "Just now",
    });
    setShowActions(false);
  };

  const setPriority = (priority: TicketPriority) => {
    onUpdate(ticket.id, { priority, updated_at: "Just now" });
  };

  return (
    <div className="flex flex-col h-full" style={{ ...poppins }}>

      {/* Header */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="md:hidden flex-shrink-0 mt-0.5"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0d9488", padding: 2 }}>
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>

          <Avatar name={ticket.user.full_name} role={ticket.user.role} size={38} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                    {ticket.user.full_name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: ticket.user.role === "tutor" ? "rgba(139,92,246,0.08)" : "rgba(13,148,136,0.08)",
                             color: ticket.user.role === "tutor" ? "#7c3aed" : "#0d9488",
                             fontSize: "0.62rem", fontWeight: 700 }}>
                    {ticket.user.role === "tutor" ? <GraduationCap style={{ width: 10, height: 10 }} /> : <Users style={{ width: 10, height: 10 }} />}
                    {ticket.user.role === "tutor" ? "Tutor" : "Parent"}
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#334155", marginTop: 2, fontWeight: 500 }}>{ticket.subject}</p>
                <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 1 }}>
                  {ticket.id} · Opened {ticket.created_at}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  <CategoryBadge category={ticket.category} />
                  <StatusBadge status={ticket.status} />
                  <PriorityDot priority={ticket.priority} />
                  {ticket.rating && <RatingStars rating={ticket.rating} />}
                </div>
                {isAssignedToMe && (
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowActions(v => !v)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", cursor: "pointer", color: "#64748b" }}>
                      <MoreVertical style={{ width: 15, height: 15 }} />
                    </button>
                    {showActions && (
                      <div className="absolute right-0 top-9 z-20 rounded-xl overflow-hidden"
                        style={{ background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
                                 border: "1px solid #f1f5f9", minWidth: 200 }}>
                        <div className="px-3 py-2" style={{ borderBottom: "1px solid #f8fafc" }}>
                          <p style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Set Status</p>
                        </div>
                        {(Object.entries(statusCfg) as [TicketStatus, typeof statusCfg[TicketStatus]][]).map(([k, v]) => (
                          <button key={k} onClick={() => setStatus(k)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                            style={{ background: ticket.status === k ? v.bg : "transparent",
                                     color: ticket.status === k ? v.color : "#475569",
                                     border: "none", cursor: "pointer", textAlign: "left",
                                     fontSize: "0.78rem", fontWeight: ticket.status === k ? 700 : 400, ...poppins }}
                            onMouseEnter={e => { if (ticket.status !== k) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                            onMouseLeave={e => { if (ticket.status !== k) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            {v.icon} {v.label}
                          </button>
                        ))}
                        <div className="px-3 py-2" style={{ borderTop: "1px solid #f8fafc" }}>
                          <p style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Set Priority</p>
                        </div>
                        {(Object.entries(priorityCfg) as [TicketPriority, typeof priorityCfg[TicketPriority]][]).map(([k, v]) => (
                          <button key={k} onClick={() => { setPriority(k); setShowActions(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                            style={{ background: ticket.priority === k ? v.bg : "transparent",
                                     color: ticket.priority === k ? v.color : "#475569",
                                     border: "none", cursor: "pointer", textAlign: "left",
                                     fontSize: "0.78rem", fontWeight: ticket.priority === k ? 700 : 400, ...poppins }}
                            onMouseEnter={e => { if (ticket.priority !== k) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                            onMouseLeave={e => { if (ticket.priority !== k) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: v.dot, display: "inline-block", flexShrink: 0 }} />
                            {v.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment strip */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="flex items-center gap-1" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                <Mail style={{ width: 10, height: 10 }} />{ticket.user.email}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: "0.68rem", color: "#64748b" }}>
                <Phone style={{ width: 10, height: 10 }} />{ticket.user.phone}
              </span>

              {/* Assignee info + assign button */}
              <div className="flex items-center gap-2">
                {ticket.assigned_to ? (
                  <span className="flex items-center gap-1.5"
                    style={{ fontSize: "0.68rem", color: ticket.assigned_to === currentAgentId ? "#0d9488" : "#64748b", fontWeight: 600 }}>
                    <UserCheck style={{ width: 11, height: 11 }} />
                    Assigned to {ticket.assigned_to === currentAgentId ? "you" : ticket.assigned_to_name}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.68rem", color: "#d97706", fontWeight: 600 }}>Unassigned</span>
                )}

                {/* Show "Assign to me" if unassigned OR if admin and not assigned to themselves */}
                {(!ticket.assigned_to || (isAdmin && ticket.assigned_to !== currentAgentId)) && (
                  <button onClick={handleAssignToMe}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)",
                             fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.18)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(13,148,136,0.1)")}>
                    <UserCheck style={{ width: 11, height: 11 }} />
                    {ticket.assigned_to ? "Re-assign to me" : "Assign to me"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" style={{ background: "#f8fafc" }}>
        {ticket.messages.map((msg, i) => {
          const isAgent = msg.sender_role === "agent";
          const isMine  = isAgent && msg.agent_id === currentAgentId;
          return (
            <div key={msg.id} className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
              {isAgent
                ? <AgentAvatar agentId={msg.agent_id ?? "agent-001"} size={30} displayMap={agentMap} />
                : <Avatar name={ticket.user.full_name} role={ticket.user.role} size={30} />}
              <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column",
                            alignItems: isMine ? "flex-end" : "flex-start" }}>
                <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginBottom: 4, ...poppins, fontWeight: 500 }}>
                  {isAgent ? msg.sender_name : ticket.user.full_name} · {msg.created_at}
                  {isAgent && msg.agent_id && (
                    <span style={{ marginLeft: 4, color: msg.agent_id === currentAgentId ? "#0d9488" : "#94a3b8" }}>
                      {msg.agent_id === currentAgentId ? "· You" : ""}
                    </span>
                  )}
                </p>
                <div className="rounded-2xl px-4 py-3"
                  style={{
                    background: isMine ? "linear-gradient(135deg,#0d9488,#14b8a6)"
                              : isAgent ? "#e2e8f0"
                              : "white",
                    color: isMine ? "white" : "#1e293b",
                    borderRadius: isMine ? "18px 18px 4px 18px"
                                : isAgent ? "18px 18px 18px 4px"
                                : "18px 18px 18px 4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.65, ...poppins }}>{msg.body}</p>
                </div>
                {isMine && i === ticket.messages.length - 1 && ticket.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <ThumbsUp style={{ width: 11, height: 11, color: "#f59e0b" }} />
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8", ...poppins }}>User rated this response</span>
                    <RatingStars rating={ticket.rating} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(ticket.status === "resolved" || ticket.status === "closed") && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", fontSize: "0.7rem", fontWeight: 600, ...poppins }}>
              <CheckCircle style={{ width: 12, height: 12 }} />
              Ticket {ticket.status} on {ticket.resolved_at}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box or locked state */}
      <div className="px-5 py-4 flex-shrink-0" style={{ background: "white", borderTop: "1px solid #f1f5f9" }}>
        {canReply ? (
          <>
            {showQuick && (
              <div className="mb-3 flex flex-col gap-1.5 rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase",
                             letterSpacing: "0.06em", marginBottom: 4, ...poppins }}>Quick Replies</p>
                {QUICK_REPLIES.map((qr, i) => (
                  <button key={i} onClick={() => { setReply(qr); setShowQuick(false); }}
                    className="text-left px-3 py-2 rounded-lg transition-colors"
                    style={{ background: "white", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.75rem", color: "#334155", ...poppins }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                    {qr}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}>
                <textarea value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(); }}
                  placeholder="Type a reply… (Ctrl+Enter to send)"
                  rows={3}
                  style={{ width: "100%", border: "none", outline: "none", padding: "12px 14px",
                           background: "transparent", fontSize: "0.82rem", color: "#0f172a",
                           resize: "none", lineHeight: 1.6, boxSizing: "border-box", ...poppins }} />
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <button onClick={() => setShowQuick(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors"
                    style={{ background: showQuick ? "rgba(13,148,136,0.1)" : "transparent",
                             color: showQuick ? "#0d9488" : "#94a3b8", border: "none", cursor: "pointer",
                             fontSize: "0.7rem", fontWeight: 600, ...poppins }}>
                    <Zap style={{ width: 12, height: 12 }} /> Quick Reply
                  </button>
                  <span style={{ fontSize: "0.62rem", color: "#cbd5e1", ...poppins }}>Ctrl+Enter to send</span>
                </div>
              </div>
              <button onClick={handleSend} disabled={!reply.trim() || sending}
                className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all"
                style={{ width: 46, height: 46,
                  background: reply.trim() && !sending ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "#f1f5f9",
                  color: reply.trim() && !sending ? "white" : "#94a3b8",
                  border: "none", cursor: reply.trim() && !sending ? "pointer" : "default",
                  boxShadow: reply.trim() && !sending ? "0 4px 14px rgba(13,148,136,0.3)" : "none" }}>
                {sending
                  ? <RefreshCw style={{ width: 18, height: 18, animation: "spin 0.8s linear infinite" }} />
                  : <Send style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </>
        ) : (
          /* Locked state — not assigned to this agent */
          <div className="flex items-center gap-3 py-2 px-4 rounded-2xl"
            style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(100,116,139,0.1)" }}>
              <Lock style={{ width: 16, height: 16, color: "#94a3b8" }} />
            </div>
            <div className="flex-1 min-w-0">
              {ticket.assigned_to && ticket.assigned_to !== currentAgentId ? (
                <>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", ...poppins }}>
                    Assigned to {ticket.assigned_to_name}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1, ...poppins }}>
                    {isAdmin
                      ? "Re-assign this ticket to yourself to reply."
                      : "This ticket is handled by another agent."}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569", ...poppins }}>
                    Ticket not assigned
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1, ...poppins }}>
                    Assign this ticket to yourself to start replying.
                  </p>
                </>
              )}
            </div>
            {(!ticket.assigned_to || (isAdmin && ticket.assigned_to !== currentAgentId)) && (
              <button onClick={handleAssignToMe}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all"
                style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", color: "white",
                         border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                         boxShadow: "0 3px 10px rgba(13,148,136,0.28)", ...poppins }}>
                <UserCheck style={{ width: 13, height: 13 }} />
                Assign to me
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyConversation() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "#f8fafc" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.08)" }}>
        <MessageSquare style={{ width: 28, height: 28, color: "#0d9488" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1rem", ...poppins }}>Select a ticket</p>
        <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 4, ...poppins }}>
          Choose a support ticket from the list to view the conversation
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CustomerSupport() {
  const { agent, staffUsers }       = useAuth();

  // Merge live staff into the display map so newly created agents show correctly
  const agentDisplayMap = useMemo(() => {
    const map: Record<string, { name: string; initials: string; role: string }> = { ...AGENTS };
    staffUsers.forEach(s => { map[s.id] = { name: s.name, initials: s.initials, role: s.role }; });
    return map;
  }, [staffUsers]);
  const [tickets, setTickets]       = useState<SupportTicket[]>(seedTickets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [filterStatus,   setFStatus]   = useState<TicketStatus | "all">("all");
  const [filterCategory, setFCategory] = useState<TicketCategory | "all">("all");
  const [filterPriority, setFPriority] = useState<TicketPriority | "all">("all");
  const [filterRole,     setFRole]     = useState<UserRole | "all">("all");
  const [filterAssign,   setFAssign]   = useState<"all" | "mine" | "unassigned">("all");
  const [mobileView,     setMobileView] = useState<"list" | "chat">("list");

  const currentAgentId   = agent?.id   ?? "";
  const currentAgentName = agent?.name ?? "";
  const isAdmin          = agent?.role === "admin";

  const selected = tickets.find(t => t.id === selectedId) ?? null;

  // Visibility rules:
  // - admin: sees ALL tickets
  // - customer_support: sees only unassigned OR assigned to themselves
  const visible = useMemo(() => {
    if (isAdmin) return tickets;
    return tickets.filter(t => !t.assigned_to || t.assigned_to === currentAgentId);
  }, [tickets, isAdmin, currentAgentId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visible.filter(t => {
      if (filterStatus   !== "all" && t.status    !== filterStatus)   return false;
      if (filterCategory !== "all" && t.category  !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority  !== filterPriority) return false;
      if (filterRole     !== "all" && t.user.role !== filterRole)     return false;
      if (filterAssign === "mine"       && t.assigned_to !== currentAgentId)  return false;
      if (filterAssign === "unassigned" && t.assigned_to !== null)             return false;
      if (q && !t.user.full_name.toLowerCase().includes(q)
            && !t.subject.toLowerCase().includes(q)
            && !t.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visible, search, filterStatus, filterCategory, filterPriority, filterRole, filterAssign, currentAgentId]);

  const handleUpdate = (id: string, patch: Partial<SupportTicket>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("chat");
  };

  const stats = {
    open:        visible.filter(t => t.status === "open").length,
    in_progress: visible.filter(t => t.status === "in_progress").length,
    waiting:     visible.filter(t => t.status === "waiting").length,
    resolved:    visible.filter(t => t.status === "resolved").length,
    urgent:      visible.filter(t => t.priority === "urgent").length,
    mine:        visible.filter(t => t.assigned_to === currentAgentId).length,
  };

  return (
    <div style={{ ...poppins }}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
              Customer Support
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
              {isAdmin
                ? "View all tickets · assign yourself · reply to tickets assigned to you"
                : "Your queue · assign unassigned tickets · reply to your tickets"}
            </p>
          </div>
          {/* Current agent chip */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)", color: "white", fontSize: "0.6rem", fontWeight: 700 }}>
              {agent?.initials}
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#0f172a" }}>{agent?.name}</p>
              <p style={{ fontSize: "0.6rem", color: isAdmin ? "#0d9488" : "#7c3aed", fontWeight: 700 }}>
                {isAdmin ? "Admin" : "Support Agent"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { label: "Open",        value: stats.open,        color: "#2563eb", bg: "rgba(37,99,235,0.08)",   Icon: Inbox       },
          { label: "In Progress", value: stats.in_progress, color: "#d97706", bg: "rgba(245,158,11,0.08)",  Icon: RefreshCw   },
          { label: "Waiting",     value: stats.waiting,     color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  Icon: Clock       },
          { label: "Resolved",    value: stats.resolved,    color: "#16a34a", bg: "rgba(34,197,94,0.08)",   Icon: CheckCircle },
          { label: "Urgent",      value: stats.urgent,      color: "#dc2626", bg: "rgba(220,38,38,0.08)",   Icon: AlertCircle },
          { label: "Mine",        value: stats.mine,        color: "#0d9488", bg: "rgba(13,148,136,0.08)",  Icon: UserCheck   },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="rounded-2xl p-3.5"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon style={{ width: 14, height: 14, color }} />
            </div>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.1 }}>{value}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.62rem", marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="rounded-2xl overflow-hidden flex"
        style={{ background: "white", border: "1px solid #f1f5f9",
                 boxShadow: "0 2px 8px rgba(0,0,0,0.04)", height: "calc(100vh - 330px)", minHeight: 520 }}>

        {/* ── LEFT: Inbox ── */}
        <div className={`flex flex-col flex-shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}
          style={{ width: "100%", maxWidth: 360, borderRight: "1px solid #f1f5f9" }}>

          {/* Search + filters */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-2.5"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
              <Search style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets…"
                style={{ background: "none", border: "none", outline: "none", fontSize: "0.78rem",
                         color: "#0f172a", width: "100%", ...poppins }} />
              {search && (
                <button onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex gap-1.5 flex-wrap">
              {/* Assignment filter — show "All / Mine / Unassigned" */}
              {(["all", "mine", "unassigned"] as const).map(v => (
                <button key={v} onClick={() => setFAssign(v)}
                  className="px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: filterAssign === v ? "rgba(13,148,136,0.1)" : "#f8fafc",
                           color: filterAssign === v ? "#0d9488" : "#64748b",
                           border: filterAssign === v ? "1.5px solid rgba(13,148,136,0.25)" : "1.5px solid #e2e8f0",
                           fontSize: "0.68rem", fontWeight: filterAssign === v ? 700 : 500, cursor: "pointer" }}>
                  {v === "all" ? "All" : v === "mine" ? "Mine" : "Unassigned"}
                </button>
              ))}

              {/* Status */}
              <select value={filterStatus} onChange={e => setFStatus(e.target.value as TicketStatus | "all")}
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "2px 6px",
                         fontSize: "0.68rem", color: "#64748b", cursor: "pointer", outline: "none", ...poppins }}>
                <option value="all">All Status</option>
                {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              {/* Priority */}
              <select value={filterPriority} onChange={e => setFPriority(e.target.value as TicketPriority | "all")}
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "2px 6px",
                         fontSize: "0.68rem", color: "#64748b", cursor: "pointer", outline: "none", ...poppins }}>
                <option value="all">All Priority</option>
                {Object.entries(priorityCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16"
                style={{ color: "#94a3b8", textAlign: "center" }}>
                <Inbox style={{ width: 32, height: 32 }} />
                <p style={{ fontSize: "0.82rem", ...poppins }}>No tickets match your filters</p>
              </div>
            ) : (
              filtered.map(t => (
                <TicketRow key={t.id} ticket={t} active={t.id === selectedId}
                  onClick={() => handleSelect(t.id)} currentAgentId={currentAgentId} />
              ))
            )}
          </div>

          {/* Footer count */}
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderTop: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", ...poppins }}>
              {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} shown
              {!isAdmin && ` · showing your queue`}
            </p>
          </div>
        </div>

        {/* ── RIGHT: Conversation ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {selected ? (
            <ConversationPanel
              ticket={selected}
              onUpdate={handleUpdate}
              onBack={() => setMobileView("list")}
              currentAgentId={currentAgentId}
              currentAgentName={currentAgentName}
              isAdmin={isAdmin}
              agentMap={agentDisplayMap}
            />
          ) : (
            <EmptyConversation />
          )}
        </div>
      </div>
    </div>
  );
}
