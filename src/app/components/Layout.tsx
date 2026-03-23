import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router";
import {
  LayoutDashboard, Settings, LogOut, GraduationCap, Menu, X,
  Library, Users, TrendingUp, Flag, CalendarCheck, Headphones,
  BookOpen, Wallet, Gavel, Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ForcePasswordChange } from "./ForcePasswordChange";

// ── Nav groups ─────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Main Menu",
    roles: ["admin"] as string[],
    items: [
      { to: "/dashboard",    label: "Dashboard",          icon: LayoutDashboard },
      { to: "/bookings",     label: "Bookings",           icon: BookOpen        },
      { to: "/users",        label: "User Management",    icon: Users           },
      { to: "/catalog",      label: "Catalog Management", icon: Library         },
      { to: "/appointments", label: "Appointments",       icon: CalendarCheck   },
    ],
  },
  {
    label: "Finance",
    roles: ["admin"] as string[],
    items: [
      { to: "/financials", label: "Financial Overview", icon: TrendingUp },
      { to: "/payouts",    label: "Payout History",     icon: Wallet     },
    ],
  },
  {
    label: "Support & Reports",
    roles: ["admin", "customer_support"] as string[],
    items: [
      { to: "/support",  label: "Customer Support",   icon: Headphones },
      { to: "/reports",  label: "Reports",            icon: Flag       },
      { to: "/disputes", label: "Disputes & Refunds", icon: Gavel      },
    ],
  },
  {
    label: "Settings",
    roles: ["admin", "customer_support"] as string[],
    items: [
      { to: "/account-settings", label: "Account Settings", icon: Settings },
    ],
  },
];

// Paths that customer_support agents are allowed to visit
const CS_ALLOWED = new Set(["/support", "/reports", "/disputes", "/account-settings"]);

// ── Role badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        background: isAdmin ? "rgba(13,148,136,0.12)" : "rgba(124,58,237,0.1)",
        color: isAdmin ? "#0d9488" : "#7c3aed",
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.03em",
      }}
    >
      <Shield style={{ width: 9, height: 9 }} />
      {isAdmin ? "Admin" : "Support"}
    </span>
  );
}

// ── SidebarContent — defined at module scope to avoid React hook issues ────────
function SidebarContent({
  pathname, onNavClick, onLogout, role, agentName, agentInitials,
}: {
  pathname: string;
  onNavClick: () => void;
  onLogout: () => void;
  role: string;
  agentName: string;
  agentInitials: string;
}) {
  const visibleGroups = NAV_GROUPS.filter(g => g.roles.includes(role));

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#e2e8f0" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", boxShadow: "0 4px 12px rgba(13,148,136,0.35)" }}
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", letterSpacing: "0.01em" }}>
          Gobez Admin
        </span>
      </div>

      {/* Signed-in agent chip */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)", color: "white", fontSize: "0.65rem", fontWeight: 700 }}
          >
            {agentInitials}
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {agentName}
            </p>
            <RoleBadge role={role} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-4 overflow-y-auto">
        {visibleGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1" style={{ fontSize: "0.6rem", fontWeight: 700, color: "#cbd5e1",
                                               letterSpacing: "0.09em", textTransform: "uppercase" }}>
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={{
                      background: active ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "transparent",
                      color: active ? "white" : "#475569",
                      fontWeight: active ? 600 : 500,
                      fontSize: "0.82rem",
                      textDecoration: "none",
                      boxShadow: active ? "0 4px 12px rgba(13,148,136,0.25)" : "none",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0d9488"; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; } }}
                  >
                    <Icon style={{ width: "17px", height: "17px", flexShrink: 0 }} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "#e2e8f0" }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
          style={{ background: "transparent", color: "#ef4444", fontWeight: 500, fontSize: "0.875rem",
                   border: "none", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut style={{ width: "18px", height: "18px" }} />
          Logout
        </button>
      </div>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export function Layout() {
  const { agent, logout, mustChangePassword } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Auth guard: no flash, no useEffect ──────────────────────────────────────
  if (!agent) return <Navigate to="/" replace />;

  // ── Role guard: CS agents redirected synchronously ─────────────────────────
  if (agent.role === "customer_support" && !CS_ALLOWED.has(location.pathname)) {
    return <Navigate to="/support" replace />;
  }

  const handleLogout = () => { logout(); navigate("/"); };

  const sidebarProps = {
    pathname:      location.pathname,
    onNavClick:    () => setMobileOpen(false),
    onLogout:      handleLogout,
    role:          agent.role,
    agentName:     agent.name,
    agentInitials: agent.initials,
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Poppins', sans-serif", background: "#f0f4f8" }}>
      <div className="hidden md:block flex-shrink-0" style={{ width: "240px" }} />

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-30"
        style={{ width: "240px", background: "white", borderRight: "1px solid #e2e8f0", boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen z-50 md:hidden transition-transform duration-300"
        style={{
          width: "240px", background: "white", borderRight: "1px solid #e2e8f0",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile topbar */}
        <div
          className="flex md:hidden items-center gap-3 px-4 py-3 sticky top-0 z-20"
          style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0d9488" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Gobez Admin</span>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Force-password-change overlay — blocks all interaction until resolved */}
      {mustChangePassword && <ForcePasswordChange />}
    </div>
  );
}
