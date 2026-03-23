import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

export type AgentRole = "admin" | "customer_support";

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  initials: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  password: string;          // plain-text for demo; hash in production
  role: AgentRole;
  initials: string;
  status: "active" | "suspended";
  mustChangePassword: boolean;
  createdAt: string;
  createdById: string | null;
}

type LoginResult = { success: boolean; error?: string; role?: AgentRole };

interface AuthContextValue {
  agent: Agent | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  staffUsers: StaffUser[];
  createStaff: (data: { name: string; email: string; password: string; role: AgentRole }) => { success: boolean; error?: string };
  updateStaff: (id: string, patch: Partial<StaffUser>) => void;
  deleteStaff: (id: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue>({
  agent: null,
  mustChangePassword: false,
  login: () => ({ success: false }),
  logout: () => {},
  changePassword: () => {},
  staffUsers: [],
  createStaff: () => ({ success: false }),
  updateStaff: () => {},
  deleteStaff: () => ({ success: false }),
});

// ── Seed staff ─────────────────────────────────────────────────────────────────
const SEED_STAFF: StaffUser[] = [
  {
    id: "agent-001",
    name: "Alex Haile",
    email: "admin@gobez.et",
    password: "12345678",
    role: "admin",
    initials: "AH",
    status: "active",
    mustChangePassword: false,
    createdAt: "Jan 1, 2026",
    createdById: null,
  },
];

function makeInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function staffToAgent(s: StaffUser): Agent {
  return { id: s.id, name: s.name, email: s.email, role: s.role, initials: s.initials };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(SEED_STAFF);
  const [agent, setAgent]           = useState<Agent | null>(null);

  // ── useRef so login() always reads the LATEST staffUsers even in stale closures
  const staffRef  = useRef<StaffUser[]>(staffUsers);
  const agentRef  = useRef<Agent | null>(agent);
  staffRef.current = staffUsers;
  agentRef.current = agent;

  const login = useCallback((email: string, password: string): LoginResult => {
    const list  = staffRef.current;
    const staff = list.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!staff)                        return { success: false, error: "No account found for this email address." };
    if (staff.password !== password.trim()) return { success: false, error: "Incorrect password. Please try again." };
    if (staff.status === "suspended")  return { success: false, error: "Your account has been suspended. Contact an administrator." };
    setAgent(staffToAgent(staff));
    return { success: true, role: staff.role };
  }, []);

  const logout = useCallback(() => setAgent(null), []);

  const changePassword = useCallback((newPassword: string) => {
    const current = agentRef.current;
    if (!current) return;
    setStaffUsers(prev =>
      prev.map(s => s.id === current.id ? { ...s, password: newPassword, mustChangePassword: false } : s)
    );
  }, []);

  const createStaff = useCallback((data: { name: string; email: string; password: string; role: AgentRole }) => {
    const existing = staffRef.current.find(s => s.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) return { success: false, error: "An account with this email already exists." };
    const newStaff: StaffUser = {
      id: "agent-" + Date.now(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: data.role,
      initials: makeInitials(data.name),
      status: "active",
      mustChangePassword: true,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdById: agentRef.current?.id ?? null,
    };
    setStaffUsers(prev => [...prev, newStaff]);
    return { success: true };
  }, []);

  const updateStaff = useCallback((id: string, patch: Partial<StaffUser>) => {
    setStaffUsers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteStaff = useCallback((id: string): { success: boolean; error?: string } => {
    if (id === agentRef.current?.id) return { success: false, error: "You cannot delete your own account." };
    setStaffUsers(prev => prev.filter(s => s.id !== id));
    return { success: true };
  }, []);

  const mustChangePassword = !!(agent && staffUsers.find(s => s.id === agent.id)?.mustChangePassword);

  return (
    <AuthContext.Provider value={{
      agent, mustChangePassword, login, logout, changePassword,
      staffUsers, createStaff, updateStaff, deleteStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
