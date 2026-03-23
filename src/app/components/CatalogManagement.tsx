import { useState } from "react";
import {
  BookOpen,
  Layers,
  Hash,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Search,
  AlertCircle,
} from "lucide-react";

// ── Types matching DB schema ───────────────────────────────────────────────────

interface Subject {
  id: number;
  name: string;
}

interface TutorLevel {
  id: number;
  name: string;
  description: string;
}

interface Grade {
  id: number;
  grade_number: number;
  level_id: number;
}

// ── Mock seed data ─────────────────────────────────────────────────────────────

const seedSubjects: Subject[] = [
  { id: 1, name: "Mathematics" },
  { id: 2, name: "English" },
  { id: 3, name: "Science" },
  { id: 4, name: "History" },
  { id: 5, name: "French" },
  { id: 6, name: "Coding" },
  { id: 7, name: "Geography" },
  { id: 8, name: "Biology" },
];

const seedLevels: TutorLevel[] = [
  { id: 1, name: "Primary", description: "Elementary school level — Grades 1 to 6" },
  { id: 2, name: "Middle School", description: "Middle school — Grades 7 to 8" },
  { id: 3, name: "High School", description: "High school — Grades 9 to 12" },
  { id: 4, name: "University", description: "Undergraduate and postgraduate tuition" },
];

const seedGrades: Grade[] = [
  { id: 1, grade_number: 1, level_id: 1 },
  { id: 2, grade_number: 2, level_id: 1 },
  { id: 3, grade_number: 3, level_id: 1 },
  { id: 4, grade_number: 4, level_id: 1 },
  { id: 5, grade_number: 5, level_id: 1 },
  { id: 6, grade_number: 6, level_id: 1 },
  { id: 7, grade_number: 7, level_id: 2 },
  { id: 8, grade_number: 8, level_id: 2 },
  { id: 9, grade_number: 9, level_id: 3 },
  { id: 10, grade_number: 10, level_id: 3 },
  { id: 11, grade_number: 11, level_id: 3 },
  { id: 12, grade_number: 12, level_id: 3 },
];

// ── Shared UI helpers ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "0.83rem",
  fontFamily: "'Poppins', sans-serif",
  color: "#0f172a",
  outline: "none",
  background: "#f8fafc",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontFamily: "'Poppins', sans-serif",
};

const btnPrimary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Poppins', sans-serif",
  boxShadow: "0 3px 10px rgba(13,148,136,0.25)",
};

const btnDanger: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 10px",
  background: "rgba(239,68,68,0.08)",
  color: "#ef4444",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Poppins', sans-serif",
};

const btnEdit: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 10px",
  background: "rgba(13,148,136,0.08)",
  color: "#0d9488",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Poppins', sans-serif",
};

// ── Modal wrapper ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl p-6"
        style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────

function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel}>
      <div className="flex gap-3 mb-5" style={{ background: "#fff7f7", borderRadius: 12, padding: "12px 14px" }}>
        <AlertCircle style={{ width: 18, height: 18, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: "0.82rem", color: "#475569", fontFamily: "'Poppins', sans-serif", lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: "#0f172a" }}>"{label}"</strong>? This action cannot be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          style={{ ...btnEdit, background: "#f1f5f9", color: "#475569" }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{ ...btnDanger, background: "#ef4444", color: "white", padding: "7px 16px" }}
        >
          <Trash2 style={{ width: 13, height: 13 }} /> Delete
        </button>
      </div>
    </Modal>
  );
}

// ── SUBJECTS TAB ──────────────────────────────────────────────────────────────

function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>(seedSubjects);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [error, setError] = useState("");
  const nextId = () => Math.max(0, ...subjects.map((s) => s.id)) + 1;

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: "" }); setError(""); setModal("add"); };
  const openEdit = (s: Subject) => { setSelected(s); setForm({ name: s.name }); setError(""); setModal("edit"); };
  const openDelete = (s: Subject) => { setSelected(s); setModal("delete"); };

  const save = () => {
    if (!form.name.trim()) { setError("Subject name is required."); return; }
    const dup = subjects.find((s) => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.id !== selected?.id);
    if (dup) { setError("A subject with this name already exists."); return; }
    if (modal === "add") {
      setSubjects((prev) => [...prev, { id: nextId(), name: form.name.trim() }]);
    } else if (modal === "edit" && selected) {
      setSubjects((prev) => prev.map((s) => s.id === selected.id ? { ...s, name: form.name.trim() } : s));
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (selected) setSubjects((prev) => prev.filter((s) => s.id !== selected.id));
    setModal(null);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <Search style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif", color: "#0f172a", width: "100%" }}
          />
        </div>
        <button style={btnPrimary} onClick={openAdd}>
          <Plus style={{ width: 15, height: 15 }} /> Add Subject
        </button>
      </div>

      {/* Grid of subject pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(13,148,136,0.1)" }}>
                <BookOpen style={{ width: 14, height: 14, color: "#0d9488" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>{s.name}</p>
                <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "'Poppins', sans-serif" }}>ID #{s.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button style={btnEdit} onClick={() => openEdit(s)} title="Edit">
                <Pencil style={{ width: 12, height: 12 }} />
              </button>
              <button style={btnDanger} onClick={() => openDelete(s)} title="Delete">
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12" style={{ color: "#94a3b8", fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>
            No subjects found.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Subject" : "Edit Subject"} onClose={() => setModal(null)}>
          <div className="mb-4">
            <label style={labelStyle}>Subject Name</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => { setForm({ name: e.target.value }); setError(""); }}
              placeholder="e.g. Mathematics"
              autoFocus
            />
            {error && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(null)} style={{ ...btnEdit, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={save} style={btnPrimary}>
              <Check style={{ width: 14, height: 14 }} /> {modal === "add" ? "Create" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === "delete" && selected && (
        <DeleteConfirm label={selected.name} onConfirm={confirmDelete} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}

// ── TUTOR LEVELS TAB ──────────────────────────────────────────────────────────
// DB: tutor_levels (id, name, description)
// Tutors choose a level and set an hourly_rate per level via tutor_selected_levels

function LevelsTab() {
  const [levels, setLevels] = useState<TutorLevel[]>(seedLevels);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<TutorLevel | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const nextId = () => Math.max(0, ...levels.map((l) => l.id)) + 1;

  const openAdd = () => { setForm({ name: "", description: "" }); setErrors({}); setModal("add"); };
  const openEdit = (l: TutorLevel) => { setSelected(l); setForm({ name: l.name, description: l.description }); setErrors({}); setModal("edit"); };
  const openDelete = (l: TutorLevel) => { setSelected(l); setModal("delete"); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Level name is required.";
    else if (levels.find((l) => l.name.toLowerCase() === form.name.trim().toLowerCase() && l.id !== selected?.id))
      e.name = "A level with this name already exists.";
    if (!form.description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    if (modal === "add") {
      setLevels((prev) => [...prev, { id: nextId(), name: form.name.trim(), description: form.description.trim() }]);
    } else if (modal === "edit" && selected) {
      setLevels((prev) => prev.map((l) => l.id === selected.id ? { ...l, name: form.name.trim(), description: form.description.trim() } : l));
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (selected) setLevels((prev) => prev.filter((l) => l.id !== selected.id));
    setModal(null);
  };

  const levelColors = ["#0d9488", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button style={btnPrimary} onClick={openAdd}>
          <Plus style={{ width: 15, height: 15 }} /> Add Level
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {levels.map((l, i) => {
          const color = levelColors[i % levelColors.length];
          return (
            <div
              key={l.id}
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <Layers style={{ width: 18, height: 18, color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>{l.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "'Poppins', sans-serif" }}>ID #{l.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button style={btnEdit} onClick={() => openEdit(l)}><Pencil style={{ width: 12, height: 12 }} /></button>
                  <button style={btnDanger} onClick={() => openDelete(l)}><Trash2 style={{ width: 12, height: 12 }} /></button>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "'Poppins', sans-serif", lineHeight: 1.5 }}>
                {l.description}
              </p>
            </div>
          );
        })}
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Tutor Level" : "Edit Tutor Level"} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-4 mb-5">
            <div>
              <label style={labelStyle}>Level Name</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: undefined })); }}
                placeholder="e.g. Primary"
                autoFocus
              />
              {errors.name && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>{errors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                value={form.description}
                onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((er) => ({ ...er, description: undefined })); }}
                placeholder="Describe this academic level…"
              />
              {errors.description && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>{errors.description}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(null)} style={{ ...btnEdit, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={save} style={btnPrimary}>
              <Check style={{ width: 14, height: 14 }} /> {modal === "add" ? "Create" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <DeleteConfirm label={selected.name} onConfirm={confirmDelete} onCancel={() => setModal(null)} />
      )}
    </div>
  );
}

// ── GRADES TAB ────────────────────────────────────────────────────────────────
// DB: grades (id, grade_number unique, level_id → tutor_levels.id)

function GradesTab() {
  const [grades, setGrades] = useState<Grade[]>(seedGrades);
  const [levels] = useState<TutorLevel[]>(seedLevels);
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Grade | null>(null);
  const [form, setForm] = useState({ grade_number: "", level_id: "" });
  const [errors, setErrors] = useState<{ grade_number?: string; level_id?: string }>({});
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const nextId = () => Math.max(0, ...grades.map((g) => g.id)) + 1;

  const getLevelName = (id: number) => levels.find((l) => l.id === id)?.name ?? "Unknown";

  const filtered = filterLevel === "all" ? grades : grades.filter((g) => g.level_id === filterLevel);
  const sorted = [...filtered].sort((a, b) => a.grade_number - b.grade_number);

  const openAdd = () => { setForm({ grade_number: "", level_id: levels[0]?.id?.toString() ?? "" }); setErrors({}); setModal("add"); };
  const openEdit = (g: Grade) => { setSelected(g); setForm({ grade_number: g.grade_number.toString(), level_id: g.level_id.toString() }); setErrors({}); setModal("edit"); };
  const openDelete = (g: Grade) => { setSelected(g); setModal("delete"); };

  const validate = () => {
    const e: typeof errors = {};
    const num = parseInt(form.grade_number);
    if (!form.grade_number || isNaN(num) || num < 1) e.grade_number = "Enter a valid grade number (≥ 1).";
    else if (grades.find((g) => g.grade_number === num && g.id !== selected?.id)) e.grade_number = "This grade number already exists.";
    if (!form.level_id) e.level_id = "Please select a level.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const num = parseInt(form.grade_number);
    const lvl = parseInt(form.level_id);
    if (modal === "add") {
      setGrades((prev) => [...prev, { id: nextId(), grade_number: num, level_id: lvl }]);
    } else if (modal === "edit" && selected) {
      setGrades((prev) => prev.map((g) => g.id === selected.id ? { ...g, grade_number: num, level_id: lvl } : g));
    }
    setModal(null);
  };

  const confirmDelete = () => {
    if (selected) setGrades((prev) => prev.filter((g) => g.id !== selected.id));
    setModal(null);
  };

  const levelColors: Record<number, { bg: string; color: string }> = {
    1: { bg: "rgba(13,148,136,0.1)", color: "#0d9488" },
    2: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
    3: { bg: "rgba(245,158,11,0.1)", color: "#d97706" },
    4: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Level filter */}
        <div className="relative">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            style={{ ...inputStyle, width: "auto", paddingRight: 32, appearance: "none", cursor: "pointer" }}
          >
            <option value="all">All Levels</option>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <ChevronDown style={{ width: 14, height: 14, color: "#64748b", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
        <div className="flex-1" />
        <button style={btnPrimary} onClick={openAdd}>
          <Plus style={{ width: 15, height: 15 }} /> Add Grade
        </button>
      </div>

      {/* Grouped by level */}
      {levels.filter((l) => filterLevel === "all" || l.id === filterLevel).map((level) => {
        const lvlGrades = sorted.filter((g) => g.level_id === level.id);
        if (lvlGrades.length === 0) return null;
        const lc = levelColors[level.id] ?? { bg: "rgba(100,116,139,0.1)", color: "#475569" };
        return (
          <div key={level.id} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full"
                style={{ background: lc.bg, color: lc.color, fontSize: "0.72rem", fontWeight: 700, fontFamily: "'Poppins', sans-serif", letterSpacing: "0.04em" }}
              >
                {level.name}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "'Poppins', sans-serif" }}>
                {lvlGrades.length} grade{lvlGrades.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lvlGrades.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl p-3 flex flex-col items-center gap-2"
                  style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: lc.bg }}
                  >
                    <Hash style={{ width: 16, height: 16, color: lc.color }} />
                  </div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: "'Poppins', sans-serif" }}>
                    Grade {g.grade_number}
                  </p>
                  <div className="flex gap-1">
                    <button style={{ ...btnEdit, padding: "3px 7px" }} onClick={() => openEdit(g)} title="Edit">
                      <Pencil style={{ width: 11, height: 11 }} />
                    </button>
                    <button style={{ ...btnDanger, padding: "3px 7px" }} onClick={() => openDelete(g)} title="Delete">
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="text-center py-12" style={{ color: "#94a3b8", fontSize: "0.82rem", fontFamily: "'Poppins', sans-serif" }}>
          No grades found for the selected level.
        </div>
      )}

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Grade" : "Edit Grade"} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-4 mb-5">
            <div>
              <label style={labelStyle}>Grade Number</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={form.grade_number}
                onChange={(e) => { setForm((f) => ({ ...f, grade_number: e.target.value })); setErrors((er) => ({ ...er, grade_number: undefined })); }}
                placeholder="e.g. 7"
                autoFocus
              />
              {errors.grade_number && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>{errors.grade_number}</p>}
            </div>
            <div>
              <label style={labelStyle}>Tutor Level</label>
              <div className="relative">
                <select
                  style={{ ...inputStyle, paddingRight: 32, appearance: "none", cursor: "pointer" }}
                  value={form.level_id}
                  onChange={(e) => { setForm((f) => ({ ...f, level_id: e.target.value })); setErrors((er) => ({ ...er, level_id: undefined })); }}
                >
                  <option value="">Select a level…</option>
                  {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <ChevronDown style={{ width: 14, height: 14, color: "#64748b", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
              {errors.level_id && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>{errors.level_id}</p>}
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 5, fontFamily: "'Poppins', sans-serif" }}>
                Links to <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>tutor_levels.id</code> — tutors select levels with hourly rates.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(null)} style={{ ...btnEdit, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={save} style={btnPrimary}>
              <Check style={{ width: 14, height: 14 }} /> {modal === "add" ? "Create" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <DeleteConfirm
          label={`Grade ${selected.grade_number} (${getLevelName(selected.level_id)})`}
          onConfirm={confirmDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const TABS = [
  { key: "subjects", label: "Subjects", icon: BookOpen, description: "Subjects tutors can teach, selectable per booking." },
  { key: "levels", label: "Tutor Levels", icon: Layers, description: "Academic levels (e.g. Primary, JHS, SHS). Tutors set an hourly rate per level." },
  { key: "grades", label: "Grades", icon: Hash, description: "Specific grade numbers linked to a tutor level. Parents select grades when booking." },
] as const;

type TabKey = typeof TABS[number]["key"];

export function CatalogManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("subjects");
  const current = TABS.find((t) => t.key === activeTab)!;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
          Catalog Management
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: 2 }}>
          Manage the subjects, academic levels, and grades that tutors and parents can choose from.
        </p>
      </div>

      {/* Tabs — scrollable on small screens */}
      <div className="overflow-x-auto pb-1 mb-6">
        <div
          className="flex gap-1 p-1 rounded-2xl w-fit min-w-full sm:min-w-0"
          style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = key === activeTab;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-150 flex-1 sm:flex-none justify-center sm:justify-start"
                style={{
                  background: active ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "transparent",
                  color: active ? "white" : "#64748b",
                  fontWeight: active ? 600 : 500,
                  fontSize: "0.8rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: active ? "0 3px 10px rgba(13,148,136,0.25)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                <span className="hidden xs:inline sm:inline">{label}</span>
                <span className="xs:hidden sm:hidden">{label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start sm:items-center gap-3 mb-5 px-4 py-3 rounded-xl"
        style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}
      >
        <current.icon style={{ width: 16, height: 16, color: "#0d9488", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: "0.78rem", color: "#475569", fontFamily: "'Poppins', sans-serif", lineHeight: 1.5 }}>
          {current.description}
        </p>
      </div>

      {/* Tab content */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", minHeight: 400 }}
      >
        {activeTab === "subjects" && <SubjectsTab />}
        {activeTab === "levels" && <LevelsTab />}
        {activeTab === "grades" && <GradesTab />}
      </div>
    </div>
  );
}