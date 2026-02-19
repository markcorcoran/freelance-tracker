import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Single user ID — swap for real auth if you add multi-user later
const USER_ID = "default";

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

function LockScreen({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    if (input === APP_PASSWORD) {
      sessionStorage.setItem("unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#f5f4f1", fontFamily: "'DM Sans', sans-serif", gap: 12,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Time Tracker</div>
      <input
        type="password"
        placeholder="Password"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && attempt()}
        autoFocus
        style={{
          padding: "10px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: 220,
          border: `1px solid ${error ? "#dc2626" : "#ddd9d3"}`,
          background: error ? "#fef2f2" : "#fff",
          color: "#1a1a1a", transition: "border 0.2s, background 0.2s",
        }}
      />
      <button onClick={attempt} style={{
        padding: "10px 28px", borderRadius: 10, border: "none",
        background: "linear-gradient(135deg, #16a34a, #118a3e)",
        color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>Enter</button>
      {error && <div style={{ color: "#dc2626", fontSize: 13 }}>Incorrect password</div>}
    </div>
  );
}

const themes = {
  light: {
    bg: "#f5f4f1", card: "#ffffff", cardBorder: "#e5e3de", inputBg: "#f0eeeb",
    inputBorder: "#ddd9d3", text: "#1a1a1a", textMuted: "#777", textFaint: "#aaa",
    accent: "#16a34a", accentGlow: "#16a34a44", danger: "#dc2626", dangerGlow: "#dc262644",
    entryBg: "#ffffff", entryBorder: "#ebe9e5",
    pillActive: "#e8e6e1", pillActiveBorder: "#ccc8c1", pillText: "#1a1a1a",
    pillInactive: "transparent", pillInactiveBorder: "#e5e3de", pillInactiveText: "#999",
    toggleBg: "#f0eeeb", toggleActive: "#e0ddd8", timerOff: "#ddd9d3",
    dashed: "#ccc8c1", barTrack: "#e8e6e1", detailBorder: "#f0eeeb",
    invoicedText: "#bbb", addBorder: "#3b82f633", addLabel: "#3b82f6",
    addBtnActive: "#3b82f6", addBtnOff: "#ddd",
    checkOn: "#16a34a", checkOff: "#ccc8c1", deleteBtn: "#ccc", deleteBtnHover: "#dc2626",
    scrollThumb: "#ddd", datePicker: "none",
    overlay: "rgba(0,0,0,0.3)", editPanel: "#ffffff", editPanelBorder: "#e5e3de",
    quickBtn: "#f0eeeb", quickBtnBorder: "#ddd9d3", quickBtnActive: "#16a34a",
    stepperBg: "#f0eeeb", stepperBorder: "#ddd9d3",
  },
  dark: {
    bg: "#0a0a0b", card: "#111", cardBorder: "#1a1a1a", inputBg: "#0a0a0b",
    inputBorder: "#222", text: "#e8e6e3", textMuted: "#888", textFaint: "#444",
    accent: "#22c55e", accentGlow: "#22c55e44", danger: "#dc2626", dangerGlow: "#dc262644",
    entryBg: "#111", entryBorder: "#1a1a1a",
    pillActive: "#1a1a1a", pillActiveBorder: "#333", pillText: "#e8e6e3",
    pillInactive: "transparent", pillInactiveBorder: "#1a1a1a", pillInactiveText: "#555",
    toggleBg: "#111", toggleActive: "#1e1e1e", timerOff: "#282828",
    dashed: "#282828", barTrack: "#1a1a1a", detailBorder: "#151515",
    invoicedText: "#3a3a3a", addBorder: "#3b82f633", addLabel: "#3b82f6",
    addBtnActive: "#3b82f6", addBtnOff: "#222",
    checkOn: "#22c55e", checkOff: "#282828", deleteBtn: "#282828", deleteBtnHover: "#dc2626",
    scrollThumb: "#222", datePicker: "invert(0.5)",
    overlay: "rgba(0,0,0,0.6)", editPanel: "#181818", editPanelBorder: "#282828",
    quickBtn: "#1a1a1a", quickBtnBorder: "#282828", quickBtnActive: "#22c55e",
    stepperBg: "#1a1a1a", stepperBorder: "#282828",
  },
};

const PRESETS = [
  { label: "10m", secs: 600 },
  { label: "15m", secs: 900 },
  { label: "30m", secs: 1800 },
  { label: "1h", secs: 3600 },
  { label: "2h", secs: 7200 },
];

const fmt = (totalSec) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const fmtHM = (totalSec) => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDecimal = (totalSec) => (totalSec / 3600).toFixed(2);
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtDateShort = (ts) => new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
const fmtDateInput = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtDate = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const parseDuration = (str) => {
  str = str.trim().toLowerCase();
  if (!str) return null;
  const cm = str.match(/^(\d+):(\d+)$/);
  if (cm) return parseInt(cm[1]) * 3600 + parseInt(cm[2]) * 60;
  const hm = str.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+)\s*m)?$/);
  if (hm && (hm[1] || hm[2])) return Math.round(parseFloat(hm[1] || 0) * 3600 + parseInt(hm[2] || 0) * 60);
  const n = parseFloat(str);
  if (!isNaN(n)) return Math.round(n * 60);
  return null;
};

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#6366f1", "#ef4444", "#06b6d4"];

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function loadSettings() {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", USER_ID)
    .maybeSingle();
  if (error) console.error("loadSettings:", error);
  return data;
}

async function upsertSettings(patch) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ id: USER_ID, ...patch }, { onConflict: "id" });
  if (error) console.error("upsertSettings:", error);
}

async function loadEntries() {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", USER_ID)
    .order("start", { ascending: false });
  if (error) console.error("loadEntries:", error);
  return (data || []).map(dbRowToEntry);
}

async function insertEntry(entry) {
  const { error } = await supabase
    .from("time_entries")
    .insert(entryToDbRow(entry));
  if (error) console.error("insertEntry:", error);
}

async function updateEntry(entry) {
  const { error } = await supabase
    .from("time_entries")
    .update(entryToDbRow(entry))
    .eq("id", entry.id)
    .eq("user_id", USER_ID);
  if (error) console.error("updateEntry:", error);
}

async function deleteEntryById(id) {
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", USER_ID);
  if (error) console.error("deleteEntry:", error);
}

// Map DB row → app shape (timestamps stored as bigint ms in DB)
function dbRowToEntry(row) {
  return {
    id: row.id,
    start: row.start,       // bigint stored as number
    end: row.end,
    duration: row.duration,
    label: row.label || "",
    project: row.project || "General",
    invoiced: row.invoiced || false,
  };
}

// Map app shape → DB row
function entryToDbRow(entry) {
  return {
    id: entry.id,
    user_id: USER_ID,
    start: entry.start,
    end: entry.end,
    duration: entry.duration,
    label: entry.label || "",
    project: entry.project || "General",
    invoiced: entry.invoiced || false,
  };
}

// ---------------------------------------------------------------------------

export default function FreelanceTracker() {
  const [unlocked, setUnlocked] = useState(
    !APP_PASSWORD || sessionStorage.getItem("unlocked") === "1"
  );
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState(["General"]);
  const [running, setRunning] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [label, setLabel] = useState("");
  const [activeProject, setActiveProject] = useState("General");
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [addSecs, setAddSecs] = useState(0);
  const [addLabel, setAddLabel] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addCustom, setAddCustom] = useState("");
  const [view, setView] = useState("timer");
  const [loaded, setLoaded] = useState(false);
  const [copiedProject, setCopiedProject] = useState(null);
  const [summaryFilter, setSummaryFilter] = useState("uninvoiced");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [theme, setTheme] = useState("light");
  // Edit panel
  const [editEntry, setEditEntry] = useState(null);
  const [editFields, setEditFields] = useState({});
  const longPressTimer = useRef(null);
  const intervalRef = useRef(null);
  const newProjRef = useRef(null);

  const t = themes[theme];

  // ---------------------------------------------------------------------------
  // Load from Supabase on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const [settings, loadedEntries] = await Promise.all([
          loadSettings(),
          loadEntries(),
        ]);

        if (settings) {
          if (settings.theme) setTheme(settings.theme);
          if (settings.projects && settings.projects.length > 0) setProjects(settings.projects);
          if (settings.running) {
            setRunning(settings.running);
            setLabel(settings.running.label || "");
            setActiveProject(settings.running.project || "General");
          }
        }

        setEntries(loadedEntries);
      } catch (e) {
        console.error("load error:", e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // ---------------------------------------------------------------------------
  // Settings persistence helpers
  // ---------------------------------------------------------------------------
  const saveSettings = useCallback(async (patch) => {
    await upsertSettings(patch);
  }, []);

  const toggleTheme = async () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    await saveSettings({ theme: next });
  };

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (running) {
      const tick = () => setElapsed(Math.floor((Date.now() - running.start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      setElapsed(0);
    }
  }, [running]);

  useEffect(() => {
    if (showNewProject && newProjRef.current) newProjRef.current.focus();
  }, [showNewProject]);

  const startTimer = async () => {
    const r = { start: Date.now(), label: label.trim(), project: activeProject };
    setRunning(r);
    await saveSettings({ running: r });
  };

  const stopTimer = async () => {
    if (!running) return;
    const end = Date.now();
    const dur = Math.floor((end - running.start) / 1000);
    if (dur < 1) {
      setRunning(null);
      await saveSettings({ running: null });
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      start: running.start,
      end,
      duration: dur,
      label: running.label || label.trim() || "",
      project: running.project || "General",
      invoiced: false,
    };
    const ne = [entry, ...entries];
    setEntries(ne);
    setRunning(null);
    setLabel("");
    await Promise.all([
      insertEntry(entry),
      saveSettings({ running: null }),
    ]);
  };

  // ---------------------------------------------------------------------------
  // Entries
  // ---------------------------------------------------------------------------
  const addManualEntry = async () => {
    const secs = addSecs || parseDuration(addCustom);
    if (!secs || secs < 1) return;
    const dateBase = addDate ? new Date(addDate + "T12:00:00") : new Date();
    const start = dateBase.getTime();
    const entry = {
      id: crypto.randomUUID(),
      start,
      end: start + secs * 1000,
      duration: secs,
      label: addLabel.trim(),
      project: activeProject,
      invoiced: false,
    };
    const ne = [entry, ...entries].sort((a, b) => b.start - a.start);
    setEntries(ne);
    setAddSecs(0);
    setAddLabel("");
    setAddDate("");
    setAddCustom("");
    setShowAddEntry(false);
    await insertEntry(entry);
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteEntryById(id);
  };

  const toggleInvoiced = async (id) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, invoiced: !entry.invoiced };
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    await updateEntry(updated);
  };

  const markProjectInvoiced = async (project) => {
    const ids = new Set(
      getFilteredEntries()
        .filter((e) => e.project === project && !e.invoiced)
        .map((e) => e.id)
    );
    const toUpdate = entries.filter((e) => ids.has(e.id)).map((e) => ({ ...e, invoiced: true }));
    setEntries((prev) => prev.map((e) => (ids.has(e.id) ? { ...e, invoiced: true } : e)));
    await Promise.all(toUpdate.map(updateEntry));
  };

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------
  const addProject = async () => {
    const name = newProjectName.trim();
    if (!name || projects.includes(name)) return;
    const np = [...projects, name];
    setProjects(np);
    setActiveProject(name);
    setNewProjectName("");
    setShowNewProject(false);
    await saveSettings({ projects: np });
  };

  const deleteProject = async (name) => {
    if (name === "General") return;
    const np = projects.filter((p) => p !== name);
    const toUpdate = entries.filter((e) => e.project === name).map((e) => ({ ...e, project: "General" }));
    setProjects(np);
    setEntries((prev) => prev.map((e) => (e.project === name ? { ...e, project: "General" } : e)));
    if (activeProject === name) setActiveProject("General");
    await Promise.all([
      saveSettings({ projects: np }),
      ...toUpdate.map(updateEntry),
    ]);
  };

  const getProjectColor = (name) => COLORS[Math.max(0, projects.indexOf(name)) % COLORS.length];

  // ---------------------------------------------------------------------------
  // Edit panel
  // ---------------------------------------------------------------------------
  const openEditPanel = (entry) => {
    setEditEntry(entry);
    setEditFields({
      label: entry.label,
      project: entry.project,
      duration: fmtHM(entry.duration),
      durationSecs: entry.duration,
      date: fmtDateInput(entry.start),
      invoiced: entry.invoiced,
    });
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    const secs = editFields.durationSecs;
    if (!secs || secs < 1) return;
    const dateBase = editFields.date
      ? new Date(editFields.date + "T12:00:00")
      : new Date(editEntry.start);
    const start = dateBase.getTime();
    const updated = {
      ...editEntry,
      label: editFields.label,
      project: editFields.project,
      duration: secs,
      start,
      end: start + secs * 1000,
      invoiced: editFields.invoiced,
    };
    setEntries((prev) => prev.map((e) => (e.id !== editEntry.id ? e : updated)));
    setEditEntry(null);
    await updateEntry(updated);
  };

  const handleLongPressStart = (entry) => {
    longPressTimer.current = setTimeout(() => openEditPanel(entry), 500);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // ---------------------------------------------------------------------------
  // Summary / filters
  // ---------------------------------------------------------------------------
  const getFilteredEntries = () => {
    const now = new Date();
    switch (summaryFilter) {
      case "uninvoiced":
        return entries.filter((e) => !e.invoiced);
      case "week": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return entries.filter((e) => e.start >= d.getTime());
      }
      case "month": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        return entries.filter((e) => e.start >= d.getTime());
      }
      case "custom": {
        const f = customFrom ? new Date(customFrom + "T00:00:00").getTime() : 0;
        const to = customTo ? new Date(customTo + "T23:59:59").getTime() : Infinity;
        return entries.filter((e) => e.start >= f && e.start <= to);
      }
      default:
        return entries;
    }
  };

  const getProjectSummary = () => {
    const filtered = getFilteredEntries();
    const map = {};
    filtered.forEach((e) => {
      if (!map[e.project]) map[e.project] = { total: 0, uninvoiced: 0, count: 0, entries: [] };
      map[e.project].total += e.duration;
      if (!e.invoiced) map[e.project].uninvoiced += e.duration;
      map[e.project].count++;
      map[e.project].entries.push(e);
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  };

  const copyProjectReport = (project, data) => {
    const lines = [`${project} — ${fmtDecimal(data.total)} hours\n`];
    data.entries
      .sort((a, b) => a.start - b.start)
      .forEach((e) => {
        lines.push(
          `${fmtDateShort(e.start)}  ${fmtTime(e.start)}–${fmtTime(e.end)}  ${fmt(e.duration)}${e.label ? `  "${e.label}"` : ""}${e.invoiced ? "  [invoiced]" : ""}`
        );
      });
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedProject(project);
      setTimeout(() => setCopiedProject(null), 2000);
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
      Loading…
    </div>
  );

  const timerActive = !!running;
  const projectSummary = getProjectSummary();
  const filteredTotal = getFilteredEntries().reduce((s, e) => s + e.duration, 0);
  const manualTotal = addSecs || parseDuration(addCustom) || 0;

  const inputStyle = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "10px 14px", color: t.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" };
  const pillStyle = (active) => ({
    padding: "6px 14px", borderRadius: 20, border: "1px solid",
    borderColor: active ? t.pillActiveBorder : t.pillInactiveBorder,
    background: active ? t.pillActive : t.pillInactive,
    color: active ? t.pillText : t.pillInactiveText,
    fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500, transition: "all 0.15s", whiteSpace: "nowrap",
  });
  const smallBtnStyle = { padding: "6px 12px", borderRadius: 7, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 };

  // Duration picker (inline component)
  const DurationPicker = ({ value, onChange }) => (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => { onChange(p.secs); setAddCustom(""); }} style={{
            flex: "1 1 auto", minWidth: 50, padding: "10px 8px", borderRadius: 10,
            border: value === p.secs ? `2px solid ${t.quickBtnActive}` : `1px solid ${t.quickBtnBorder}`,
            background: value === p.secs ? t.quickBtnActive + "15" : t.quickBtn,
            color: value === p.secs ? t.quickBtnActive : t.text,
            fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer", transition: "all 0.15s",
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
        <button onClick={() => onChange(Math.max(0, value - 300))} style={{
          width: 40, height: 40, borderRadius: 10, border: `1px solid ${t.stepperBorder}`,
          background: t.stepperBg, color: t.text, fontSize: 18, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
        }}>−</button>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 600, color: value > 0 ? t.text : t.textFaint }}>
            {value > 0 ? fmtHM(value) : "0m"}
          </div>
          <div style={{ fontSize: 10, color: t.textFaint }}>±5 min</div>
        </div>
        <button onClick={() => onChange(value + 300)} style={{
          width: 40, height: 40, borderRadius: 10, border: `1px solid ${t.stepperBorder}`,
          background: t.stepperBg, color: t.text, fontSize: 18, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: t.textFaint, whiteSpace: "nowrap" }}>or type:</span>
        <input value={addCustom} onChange={(e) => { setAddCustom(e.target.value); const p = parseDuration(e.target.value); if (p) onChange(0); }}
          placeholder="e.g. 1h 20m, 25m, 1:15"
          style={{ ...inputStyle, background: t.inputBg, flex: 1, padding: "6px 10px", fontSize: 11 }} />
      </div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: ${t.datePicker}; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${t.scrollThumb}; border-radius:4px; }
        input, select, textarea { -webkit-appearance: none; font-family: 'DM Sans', sans-serif; }
        @media (max-width: 600px) { input, select, textarea { font-size: 16px !important; } }
      `}</style>

      {/* Edit Panel Overlay */}
      {editEntry && (
        <div onClick={() => setEditEntry(null)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: t.overlay,
          zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center",
          animation: "fadeIn 0.15s ease",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 560, background: t.editPanel,
            borderRadius: "20px 20px 0 0", border: `1px solid ${t.editPanelBorder}`,
            borderBottom: "none", padding: "20px 16px 28px",
            animation: "slideUp 0.2s ease",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: t.inputBorder, margin: "0 auto 18px" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 16 }}>Edit Entry</div>

            <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Description</label>
            <input value={editFields.label} onChange={(e) => setEditFields({ ...editFields, label: e.target.value })}
              placeholder="What were you working on?"
              style={{ ...inputStyle, width: "100%", padding: "10px 12px", marginBottom: 12 }} />

            <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Project</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {projects.map((p) => (
                <button key={p} onClick={() => setEditFields({ ...editFields, project: p })} style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${editFields.project === p ? getProjectColor(p) + "44" : t.cardBorder}`,
                  background: editFields.project === p ? getProjectColor(p) + "15" : t.inputBg,
                  color: editFields.project === p ? getProjectColor(p) : t.textMuted,
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: getProjectColor(p) }} />
                  {p}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Duration</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => setEditFields({ ...editFields, durationSecs: p.secs, duration: fmtHM(p.secs) })} style={{
                  flex: "1 1 auto", minWidth: 44, padding: "8px 6px", borderRadius: 8,
                  border: editFields.durationSecs === p.secs ? `2px solid ${t.quickBtnActive}` : `1px solid ${t.quickBtnBorder}`,
                  background: editFields.durationSecs === p.secs ? t.quickBtnActive + "15" : t.quickBtn,
                  color: editFields.durationSecs === p.secs ? t.quickBtnActive : t.text,
                  fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer",
                }}>{p.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              <button onClick={() => setEditFields({ ...editFields, durationSecs: Math.max(60, editFields.durationSecs - 300), duration: fmtHM(Math.max(60, editFields.durationSecs - 300)) })} style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${t.stepperBorder}`, background: t.stepperBg,
                color: t.text, fontSize: 16, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
              }}>−</button>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 600, color: t.text, minWidth: 70, textAlign: "center" }}>
                {fmtHM(editFields.durationSecs)}
              </div>
              <button onClick={() => setEditFields({ ...editFields, durationSecs: editFields.durationSecs + 300, duration: fmtHM(editFields.durationSecs + 300) })} style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${t.stepperBorder}`, background: t.stepperBg,
                color: t.text, fontSize: 16, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Date</label>
                <input type="date" value={editFields.date} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })}
                  style={{ ...inputStyle, width: "100%", padding: "8px 12px", fontSize: 12 }} />
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
                <button onClick={() => setEditFields({ ...editFields, invoiced: !editFields.invoiced })} style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: `1px solid ${editFields.invoiced ? t.checkOn + "44" : t.inputBorder}`,
                  background: editFields.invoiced ? t.checkOn + "15" : t.inputBg,
                  color: editFields.invoiced ? t.checkOn : t.textMuted,
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 600,
                }}>
                  {editFields.invoiced ? "✓ Invoiced" : "○ Not invoiced"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { deleteEntry(editEntry.id); setEditEntry(null); }} style={{
                padding: "12px 16px", borderRadius: 10, border: `1px solid ${t.danger}33`,
                background: t.danger + "11", color: t.danger, fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
              }}>Delete</button>
              <button onClick={saveEdit} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${t.accent}, #118a3e)`,
                color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer", boxShadow: `0 4px 16px ${t.accentGlow}`,
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>

        {/* Header */}
        <div style={{ padding: "32px 24px 0", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: timerActive ? t.accent : t.timerOff,
                  boxShadow: timerActive ? `0 0 10px ${t.accentGlow}` : "none",
                  animation: timerActive ? "pulse 1.5s ease-in-out infinite" : "none",
                }} />
                <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: t.textMuted, fontWeight: 500 }}>
                  {timerActive ? `tracking · ${running.project}` : "idle"}
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: t.text }}>Time Tracker</h1>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={toggleTheme} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`} style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.cardBorder}`,
                background: t.toggleBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: t.textMuted, transition: "all 0.2s",
              }}>{theme === "light" ? "🌙" : "☀️"}</button>
              <div style={{ display: "flex", background: t.toggleBg, borderRadius: 10, border: `1px solid ${t.cardBorder}`, overflow: "hidden" }}>
                {["timer", "summary"].map((v) => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: "8px 16px", background: view === v ? t.toggleActive : "transparent", border: "none",
                    color: view === v ? t.text : t.textFaint, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer", fontWeight: 600,
                  }}>{v === "timer" ? "⏱ Timer" : "📊 Summary"}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TIMER VIEW */}
        {view === "timer" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 24px 60px" }}>
            {/* Timer Card */}
            <div style={{
              background: t.card, border: `1px solid ${timerActive ? t.accent + "22" : t.cardBorder}`,
              borderRadius: 16, padding: "24px 20px", marginBottom: 12, transition: "all 0.3s",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: timerActive ? 44 : 36, fontWeight: 600,
                textAlign: "center", color: timerActive ? t.accent : t.timerOff, letterSpacing: "-0.02em",
                marginBottom: 18, lineHeight: 1, transition: "all 0.3s",
              }}>{timerActive ? fmt(elapsed) : "0s"}</div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showNewProject ? 8 : 0 }}>
                  {projects.map((p) => (
                    <button key={p} onClick={() => !timerActive && setActiveProject(p)} style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: `1px solid ${activeProject === p ? getProjectColor(p) + "44" : t.cardBorder}`,
                      background: activeProject === p ? getProjectColor(p) + "15" : t.inputBg,
                      color: activeProject === p ? getProjectColor(p) : t.textMuted,
                      fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                      cursor: timerActive ? "default" : "pointer", fontWeight: 600,
                      opacity: timerActive ? 0.5 : 1, transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: getProjectColor(p), flexShrink: 0 }} />
                      {p}
                    </button>
                  ))}
                  {!timerActive && (
                    <button onClick={() => setShowNewProject(!showNewProject)} style={{
                      padding: "6px 12px", borderRadius: 8, border: `1px dashed ${t.dashed}`,
                      background: "transparent", color: t.textFaint, fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                    }}>+ New</button>
                  )}
                </div>
                {showNewProject && (
                  <div style={{ display: "flex", gap: 6, animation: "fadeIn 0.2s ease" }}>
                    <input ref={newProjRef} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addProject()} placeholder="Project name"
                      style={{ ...inputStyle, flex: 1, padding: "8px 12px", fontSize: 12 }} />
                    <button onClick={addProject} style={{
                      padding: "8px 14px", borderRadius: 8, border: "none",
                      background: t.accent, color: "#fff", fontSize: 12, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                    }}>Add</button>
                  </div>
                )}
              </div>

              <input type="text" placeholder="What are you working on?"
                value={timerActive ? running.label : label}
                onChange={(e) => { if (!timerActive) setLabel(e.target.value); }}
                readOnly={timerActive}
                style={{ ...inputStyle, width: "100%", marginBottom: 14, opacity: timerActive ? 0.5 : 1 }} />

              <button onClick={timerActive ? stopTimer : startTimer} style={{
                width: "100%", padding: "15px", borderRadius: 12, border: "none", fontSize: 14,
                fontWeight: 700, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
                cursor: "pointer", textTransform: "uppercase",
                background: timerActive ? `linear-gradient(135deg, ${t.danger}, #b91c1c)` : `linear-gradient(135deg, ${t.accent}, #118a3e)`,
                color: "#fff", boxShadow: timerActive ? `0 4px 20px ${t.dangerGlow}` : `0 4px 20px ${t.accentGlow}`,
              }}>{timerActive ? "Stop" : "Start"}</button>
            </div>

            {/* Add Manual Entry */}
            <div style={{ marginBottom: 16 }}>
              {!showAddEntry ? (
                <button onClick={() => setShowAddEntry(true)} style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  border: `1px solid ${t.addBorder}`, background: t.accent + "0d",
                  color: t.accent, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer", fontWeight: 600,
                }}>+ Add time manually</button>
              ) : (
                <div style={{
                  background: t.card, border: `1px solid ${t.addBorder}`, borderRadius: 14,
                  padding: "18px 16px", animation: "fadeIn 0.2s ease",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.addLabel, textTransform: "uppercase", letterSpacing: "0.08em" }}>Add Entry</span>
                    <button onClick={() => { setShowAddEntry(false); setAddSecs(0); setAddCustom(""); }} style={{ background: "none", border: "none", color: t.textFaint, cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>

                  <DurationPicker value={addSecs} onChange={setAddSecs} />

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Date</label>
                        <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)}
                          style={{ ...inputStyle, width: "100%", padding: "8px 12px", fontSize: 12 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>Description</label>
                        <input value={addLabel} onChange={(e) => setAddLabel(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addManualEntry()}
                          placeholder="Optional"
                          style={{ ...inputStyle, width: "100%", padding: "8px 12px", fontSize: 12 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: t.textFaint }}>
                        Project: <span style={{ color: getProjectColor(activeProject), fontWeight: 600 }}>{activeProject}</span>
                      </span>
                      <div style={{ flex: 1 }} />
                      <button onClick={addManualEntry} disabled={manualTotal < 1} style={{
                        padding: "10px 22px", borderRadius: 8, border: "none",
                        background: manualTotal > 0 ? t.addBtnActive : t.addBtnOff,
                        color: manualTotal > 0 ? "#fff" : t.textFaint,
                        fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                        cursor: manualTotal > 0 ? "pointer" : "default",
                      }}>Add {manualTotal > 0 ? fmtHM(manualTotal) : ""}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent entries */}
            {entries.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 2px" }}>
                  <span style={{ fontSize: 11, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Recent</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.textFaint }}>
                    {fmtDecimal(entries.reduce((s, e) => s + e.duration, 0))} hrs total
                  </span>
                </div>
                <div style={{ fontSize: 10, color: t.textFaint, marginBottom: 8, padding: "0 2px" }}>Long-press any entry to edit</div>
                {entries.slice(0, 20).map((entry, i) => (
                  <div key={entry.id}
                    onMouseDown={() => handleLongPressStart(entry)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(entry)} onTouchEnd={handleLongPressEnd}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", background: t.entryBg, border: `1px solid ${t.entryBorder}`,
                      borderRadius: 10, marginBottom: 3, animation: `fadeIn 0.2s ease ${i * 0.02}s both`,
                      cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
                    }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: getProjectColor(entry.project), flexShrink: 0, opacity: 0.6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: entry.label ? t.textMuted : t.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.label || "untitled"}
                      </div>
                      <div style={{ fontSize: 10, color: t.textFaint, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtDate(entry.start)} · {fmtTime(entry.start)}–{fmtTime(entry.end)} · {entry.project}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleInvoiced(entry.id); }} title={entry.invoiced ? "Marked invoiced" : "Mark as invoiced"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px", color: entry.invoiced ? t.checkOn : t.checkOff, transition: "color 0.15s" }}>
                      {entry.invoiced ? "✓" : "○"}
                    </button>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
                      color: entry.invoiced ? t.invoicedText : t.textMuted, flexShrink: 0, minWidth: 52, textAlign: "right",
                    }}>{fmt(entry.duration)}</span>
                  </div>
                ))}
                {entries.length > 20 && (
                  <div style={{ textAlign: "center", padding: "10px", color: t.textFaint, fontSize: 12 }}>+{entries.length - 20} more — see Summary view</div>
                )}
              </div>
            )}
            {entries.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: t.textFaint, fontSize: 13 }}>No entries yet. Hit Start or add time manually.</div>
            )}
          </div>
        )}

        {/* SUMMARY VIEW */}
        {view === "summary" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 24px 60px" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { key: "uninvoiced", label: "Uninvoiced" },
                { key: "week", label: "Past 7 days" },
                { key: "month", label: "Past 30 days" },
                { key: "custom", label: "Custom range" },
                { key: "all", label: "All time" },
              ].map((f) => (
                <button key={f.key} onClick={() => setSummaryFilter(f.key)} style={pillStyle(summaryFilter === f.key)}>{f.label}</button>
              ))}
            </div>

            {summaryFilter === "custom" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, animation: "fadeIn 0.2s ease" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>From</label>
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ ...inputStyle, width: "100%", padding: "8px 10px", fontSize: 12 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>To</label>
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ ...inputStyle, width: "100%", padding: "8px 10px", fontSize: 12 }} />
                </div>
              </div>
            )}

            <div style={{
              background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
              padding: "18px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                  {summaryFilter === "uninvoiced" ? "Uninvoiced total" : "Filtered total"}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 600, color: t.text }}>
                  {fmtDecimal(filteredTotal)} <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 400 }}>hrs</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: t.textFaint }}>{getFilteredEntries().length} entries</div>
            </div>

            {projectSummary.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: t.textFaint, fontSize: 13 }}>No entries match this filter.</div>
            ) : (
              projectSummary.map(([project, data]) => (
                <div key={project} style={{
                  background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
                  padding: "16px 18px", marginBottom: 8, animation: "fadeIn 0.25s ease",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: getProjectColor(project) }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{project}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600, color: t.text }}>{fmtDecimal(data.total)}</div>
                      <div style={{ fontSize: 10, color: t.textFaint }}>hours · {data.count} entries</div>
                    </div>
                  </div>

                  {filteredTotal > 0 && (
                    <div style={{ height: 3, background: t.barTrack, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: getProjectColor(project), width: `${(data.total / filteredTotal) * 100}%`, opacity: 0.6, transition: "width 0.4s ease" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => copyProjectReport(project, data)} style={{ ...smallBtnStyle, color: copiedProject === project ? t.accent : t.textMuted }}>
                      {copiedProject === project ? "✓ Copied" : "Copy Report"}
                    </button>
                    {summaryFilter === "uninvoiced" && data.uninvoiced > 0 && (
                      <button onClick={() => markProjectInvoiced(project)} style={{ ...smallBtnStyle, borderColor: t.accent + "33", background: t.accent + "11", color: t.accent }}>
                        Mark All Invoiced
                      </button>
                    )}
                    {project !== "General" && (
                      <button onClick={() => deleteProject(project)} style={{ ...smallBtnStyle, borderColor: t.cardBorder, color: t.textFaint }}>Delete Project</button>
                    )}
                  </div>

                  <details style={{ marginTop: 10 }}>
                    <summary style={{ fontSize: 11, color: t.textFaint, cursor: "pointer", userSelect: "none" }}>Show entries</summary>
                    <div style={{ marginTop: 6 }}>
                      {data.entries.sort((a, b) => b.start - a.start).map((e) => (
                        <div key={e.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "6px 0", borderBottom: `1px solid ${t.detailBorder}`, fontSize: 11,
                        }}>
                          <div style={{ color: t.textMuted }}>
                            {fmtDateShort(e.start)} {fmtTime(e.start)}{e.label && <span style={{ color: t.textMuted }}> · {e.label}</span>}
                            {e.invoiced && <span style={{ color: t.accent + "88", marginLeft: 4 }}>✓</span>}
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textMuted }}>{fmt(e.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
