import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const ROLES = [
  { id: "Python Developer", label: "Python Developer", desc: "Backend & scripting", icon: "🐍", accent: "#7C6FF7" },
  { id: "ML Engineer", label: "ML Engineer", desc: "Models & pipelines", icon: "🧠", accent: "#10B981" },
  { id: "Java Developer", label: "Java Developer", desc: "Enterprise & OOP", icon: "☕", accent: "#F59E0B" },
  { id: "AIML Intern", label: "AIML Intern", desc: "AI fundamentals", icon: "🤖", accent: "#EF4444" },
  { id: "Frontend Developer", label: "Frontend Developer", desc: "React, CSS, UX", icon: "🎨", accent: "#3B82F6" },
  { id: "Data Analyst", label: "Data Analyst", desc: "SQL, stats, BI", icon: "📊", accent: "#22C55E" },
  { id: "custom", label: "Custom Role", desc: "Type your own", icon: "✏️", accent: "#EC4899" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", icon: "🌱", desc: "Fundamentals", color: "#10B981" },
  { id: "medium", label: "Medium", icon: "🔥", desc: "Practical", color: "#F59E0B" },
  { id: "hard", label: "Hard", icon: "⚡", desc: "Expert-level", color: "#EF4444" },
];

const Q_TYPES = ["Technical", "Behavioural", "Situational", "System Design", "Conceptual"];
const Q_TYPE_COLORS = {
  Technical: { bg: "rgba(124,111,247,0.15)", text: "#A78BFA", border: "rgba(167,139,250,0.3)" },
  Behavioural: { bg: "rgba(16,185,129,0.15)", text: "#34D399", border: "rgba(52,211,153,0.3)" },
  Situational: { bg: "rgba(245,158,11,0.15)", text: "#FCD34D", border: "rgba(252,211,77,0.3)" },
  "System Design": { bg: "rgba(239,68,68,0.15)", text: "#FCA5A5", border: "rgba(252,165,165,0.3)" },
  Conceptual: { bg: "rgba(59,130,246,0.15)", text: "#93C5FD", border: "rgba(147,197,253,0.3)" },
};

const TIPS = [
  "Be specific — use concrete examples from real projects",
  "Structure answers using Situation, Task, Action, Result",
  "Keep spoken answers under 2 minutes for maximum impact",
  "Name specific tools, frameworks, and technologies you used",
  "Show your reasoning process, not just the final answer",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function scoreGrade(s) {
  if (s >= 9) return { label: "Excellent", sub: "Outstanding answer", color: "#10B981", glow: "rgba(16,185,129,0.3)" };
  if (s >= 7) return { label: "Good", sub: "Strong response, minor gaps", color: "#22C55E", glow: "rgba(34,197,94,0.3)" };
  if (s >= 5) return { label: "Average", sub: "Decent but needs more depth", color: "#F59E0B", glow: "rgba(245,158,11,0.3)" };
  return { label: "Needs Work", sub: "Review core concepts", color: "#EF4444", glow: "rgba(239,68,68,0.3)" };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── THEME CONTEXT ───────────────────────────────────────────────────────────

const LIGHT = {
  "--bg": "#F0F2F7",
  "--bg2": "#FFFFFF",
  "--bg3": "#F7F8FC",
  "--surface": "rgba(255,255,255,0.85)",
  "--surface2": "rgba(255,255,255,0.6)",
  "--border": "rgba(0,0,0,0.08)",
  "--border2": "rgba(0,0,0,0.05)",
  "--text": "#0F172A",
  "--text2": "#475569",
  "--text3": "#94A3B8",
  "--accent": "#7C6FF7",
  "--accent2": "#10B981",
  "--shadow": "0 4px 24px rgba(0,0,0,0.08)",
  "--shadow2": "0 8px 40px rgba(0,0,0,0.12)",
  "--glow": "0 0 40px rgba(124,111,247,0.15)",
  "--noise": "0",
};

const DARK = {
  "--bg": "#080B14",
  "--bg2": "#0E1220",
  "--bg3": "#131826",
  "--surface": "rgba(255,255,255,0.04)",
  "--surface2": "rgba(255,255,255,0.02)",
  "--border": "rgba(255,255,255,0.08)",
  "--border2": "rgba(255,255,255,0.04)",
  "--text": "#F0F4FF",
  "--text2": "#8899BB",
  "--text3": "#4A5568",
  "--accent": "#7C6FF7",
  "--accent2": "#10B981",
  "--shadow": "0 4px 24px rgba(0,0,0,0.4)",
  "--shadow2": "0 8px 40px rgba(0,0,0,0.6)",
  "--glow": "0 0 60px rgba(124,111,247,0.2)",
  "--noise": "1",
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --transition: 0.25s cubic-bezier(0.4,0,0.2,1);
  --radius: 16px;
  --radius-sm: 10px;
  --radius-xs: 7px;
}

html { scroll-behavior: smooth; }

body {
  font-family: 'DM Sans', -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.4s ease, color 0.4s ease;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── NOISE OVERLAY ── */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: calc(var(--noise, 0) * 0.025);
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 256px;
}

/* ── AMBIENT GLOW ── */
.ambient-glow {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  transition: opacity 0.5s;
}
.ambient-1 { width: 500px; height: 500px; background: #7C6FF7; top: -150px; right: -150px; }
.ambient-2 { width: 400px; height: 400px; background: #10B981; bottom: -100px; left: -100px; }

/* ── LAYOUT ── */
.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
.page {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 1.25rem 5rem;
}

/* ── HEADER ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.75rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.4s;
}

.brand { display: flex; align-items: center; gap: 12px; }
.brand-logo {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7C6FF7, #A78BFA);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 16px rgba(124,111,247,0.35);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.brand-logo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
}
.brand-name {
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}
.brand-sub { font-size: 11px; color: var(--text3); margin-top: 1px; font-weight: 400; }

.header-right { display: flex; align-items: center; gap: 10px; }

.ai-badge {
  font-size: 11px;
  padding: 4px 11px;
  border-radius: 20px;
  background: rgba(124,111,247,0.12);
  color: #A78BFA;
  font-weight: 600;
  border: 1px solid rgba(167,139,250,0.25);
  letter-spacing: 0.01em;
}

/* ── THEME TOGGLE ── */
.theme-toggle {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  transition: all var(--transition);
  backdrop-filter: blur(8px);
}
.theme-toggle:hover {
  background: var(--bg3);
  border-color: var(--accent);
  color: var(--text);
  transform: rotate(15deg);
}

/* ── STEP TRACK ── */
.step-track {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 0;
}
.step-item { display: flex; align-items: center; gap: 8px; }
.step-connector {
  flex: 1;
  height: 1px;
  background: var(--border);
  margin: 0 8px;
  position: relative;
  overflow: hidden;
}
.step-connector-fill {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: linear-gradient(90deg, #7C6FF7, #10B981);
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}
.step-dot {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
  border: 1.5px solid var(--border);
  background: var(--bg3);
  color: var(--text3);
  transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
  font-family: 'Syne', sans-serif;
}
.step-dot.active {
  background: #7C6FF7;
  border-color: #7C6FF7;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(124,111,247,0.2);
  transform: scale(1.1);
}
.step-dot.done {
  background: #10B981;
  border-color: #10B981;
  color: #fff;
}
.step-label { font-size: 11px; color: var(--text3); font-weight: 500; white-space: nowrap; }
.step-label.active { color: #A78BFA; font-weight: 600; }
.step-label.done { color: #34D399; }

/* ── CARDS / SURFACES ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color var(--transition), box-shadow var(--transition), background 0.4s;
}
.card:hover { border-color: rgba(124,111,247,0.3); }
.card-inner { padding: 1.25rem 1.5rem; }

/* ── SECTION LABEL ── */
.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--text3);
  margin-bottom: .85rem;
  display: flex;
  align-items: center;
  gap: 7px;
}
.section-label-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* ── SETUP GRID ── */
.setup-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
.setup-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* ── ROLE GRID ── */
.role-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.role-card {
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  background: var(--surface2);
  display: flex;
  align-items: center;
  gap: 9px;
  position: relative;
  overflow: hidden;
}
.role-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--role-accent, #7C6FF7);
  opacity: 0;
  transition: opacity 0.2s;
}
.role-card:hover { transform: translateY(-2px); border-color: var(--role-accent, #7C6FF7); }
.role-card:hover::before { opacity: 0.06; }
.role-card.selected { border-color: var(--role-accent, #7C6FF7); transform: translateY(-2px); }
.role-card.selected::before { opacity: 0.1; }
.role-icon-box {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  background: var(--role-accent-bg, rgba(124,111,247,0.12));
  position: relative;
  z-index: 1;
}
.role-text { position: relative; z-index: 1; }
.role-name { font-size: 11px; font-weight: 600; color: var(--text); }
.role-desc { font-size: 10px; color: var(--text3); margin-top: 1px; }

.custom-input { margin-top: 10px; }
.custom-input input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  outline: none;
  background: var(--surface2);
  transition: border-color var(--transition);
  font-family: 'DM Sans', sans-serif;
}
.custom-input input:focus { border-color: var(--accent); }
.custom-input input::placeholder { color: var(--text3); }

/* ── DIFFICULTY ── */
.diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.diff-btn {
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 8px;
  cursor: pointer;
  text-align: center;
  background: var(--surface2);
  color: var(--text3);
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  position: relative;
  overflow: hidden;
}
.diff-btn span.icon { display: block; font-size: 20px; margin-bottom: 4px; }
.diff-btn .label { font-size: 12px; font-weight: 600; }
.diff-btn .desc { font-size: 10px; margin-top: 2px; color: var(--text3); }
.diff-btn:hover { transform: translateY(-2px); }
.diff-btn.active { transform: translateY(-2px); color: var(--text); }
.diff-btn.active .desc { color: inherit; opacity: 0.7; }

/* ── FILE DROP ── */
.file-drop {
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 1.1rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition);
  background: var(--surface2);
  position: relative;
  overflow: hidden;
}
.file-drop:hover { border-color: #7C6FF7; background: rgba(124,111,247,0.05); }
.file-drop.has-file { border-style: solid; border-color: #10B981; background: rgba(16,185,129,0.05); }
.fd-icon { font-size: 22px; margin-bottom: 5px; }
.fd-text { font-size: 11px; color: var(--text2); }
.file-chip {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 6px; font-size: 10px;
  background: rgba(16,185,129,0.12); color: #34D399;
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid rgba(52,211,153,0.25);
  font-weight: 500;
}

/* ── INFO BAR ── */
.info-bar {
  display: flex; gap: 10px; align-items: flex-start;
  background: rgba(124,111,247,0.08);
  border: 1px solid rgba(167,139,250,0.2);
  border-radius: var(--radius-sm);
  padding: .85rem 1rem;
  margin-bottom: 1.25rem;
}
.info-bar-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.info-bar p { font-size: 12px; color: #A78BFA; line-height: 1.6; }

/* ── PRIMARY BUTTON ── */
.primary-btn {
  width: 100%;
  padding: 13px 20px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #7C6FF7, #9D8FFA);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  transition: all var(--transition);
  font-family: 'DM Sans', sans-serif;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(124,111,247,0.35);
}
.primary-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--transition);
}
.primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,111,247,0.5); }
.primary-btn:hover::before { opacity: 1; }
.primary-btn:active { transform: translateY(0); }
.primary-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

.success-btn {
  background: linear-gradient(135deg, #10B981, #34D399);
  box-shadow: 0 4px 20px rgba(16,185,129,0.35);
}
.success-btn:hover { box-shadow: 0 6px 28px rgba(16,185,129,0.5); }

.finish-btn {
  background: linear-gradient(135deg, #7C6FF7, #EC4899);
  box-shadow: 0 4px 20px rgba(124,111,247,0.35);
}

/* ── QUESTION SCREEN ── */
.q-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem;
}
.q-counter {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 700;
  color: var(--text);
}
.q-role-tag {
  font-size: 11px; padding: 4px 12px;
  border-radius: 20px;
  background: rgba(124,111,247,0.1);
  color: #A78BFA;
  border: 1px solid rgba(167,139,250,0.2);
  font-weight: 500;
}

/* Progress */
.prog-wrap { margin-bottom: 1.5rem; }
.prog-bar {
  height: 4px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #7C6FF7, #10B981);
  border-radius: 4px;
  transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}
.prog-fill::after {
  content: '';
  position: absolute;
  right: 0; top: 0;
  height: 100%; width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
  animation: shimmer 1.5s ease infinite;
}
@keyframes shimmer { 0%,100% { opacity: 0; } 50% { opacity: 1; } }

.prog-labels {
  display: flex; justify-content: space-between;
  margin-top: 6px; font-size: 11px; color: var(--text3);
}

/* Question card */
.q-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.q-card-top {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}
.q-type-badge {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: .75rem;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.q-text {
  font-size: 15px; line-height: 1.75;
  color: var(--text);
  font-weight: 400;
}

.q-card-body { padding: 1.25rem 1.5rem; }

.ans-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--text3);
  margin-bottom: .6rem;
  display: flex; align-items: center; justify-content: space-between;
}
.char-count { font-size: 11px; color: var(--text3); font-weight: 400; text-transform: none; letter-spacing: 0; }
.char-count.warn { color: #F59E0B; }

textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  line-height: 1.65;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  background: var(--bg3);
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,111,247,0.12); }
textarea.listening { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
textarea::placeholder { color: var(--text3); }

.tip-row {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: .75rem; padding: .6rem .85rem;
  background: rgba(124,111,247,0.06);
  border-radius: var(--radius-xs);
  border-left: 2px solid rgba(167,139,250,0.4);
}
.tip-row span { font-size: 12px; color: #A78BFA; line-height: 1.5; }

/* ── VOICE PANEL ── */
.voice-panel {
  margin-top: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #0a0f1e;
}
.voice-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 14px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.voice-panel-title {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: #4B5563;
  display: flex; align-items: center; gap: 6px;
}
.voice-support-badge {
  font-size: 10px; padding: 2px 8px;
  border-radius: 20px; font-weight: 600;
}
.voice-support-badge.supported { background: rgba(16,185,129,0.12); color: #34D399; border: 1px solid rgba(52,211,153,0.2); }
.voice-support-badge.unsupported { background: rgba(239,68,68,0.12); color: #FCA5A5; border: 1px solid rgba(252,165,165,0.2); }

.voice-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.voice-controls { display: flex; align-items: center; gap: 8px; }

.voice-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 12px; font-weight: 600;
  border: none; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
}
.voice-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.voice-btn-start { background: #10B981; color: #fff; }
.voice-btn-start:not(:disabled):hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
.voice-btn-stop { background: #EF4444; color: #fff; }
.voice-btn-stop:not(:disabled):hover { background: #DC2626; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.4); }

.voice-status { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
.voice-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.voice-status-dot.idle { background: #374151; }
.voice-status-dot.listening { background: #10B981; animation: vPulse 1.2s ease-in-out infinite; }
.voice-status-dot.error { background: #EF4444; }
@keyframes vPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
  50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
}
.voice-status-text { font-size: 11px; color: #4B5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.voice-status-text.active { color: #10B981; font-weight: 500; }
.voice-status-text.error-txt { color: #FCA5A5; }

.voice-waveform {
  height: 32px; display: flex; align-items: center;
  justify-content: center; gap: 3px;
}
.waveform-bar {
  width: 3px; border-radius: 2px;
  background: #1F2937; transition: height 0.1s ease;
  min-height: 3px;
}
.waveform-bar.active { background: #10B981; }

.voice-meta {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.04);
}
.voice-timer { font-size: 11px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 5px; }
.voice-timer.active { color: #10B981; }
.voice-char-count { font-size: 11px; color: #374151; }
.voice-char-count.has-content { color: #60A5FA; }

.voice-error-bar {
  display: flex; align-items: center; gap: 8px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 7px; padding: 7px 10px;
  font-size: 11px; color: #FCA5A5;
}
.voice-error-bar button {
  margin-left: auto; background: none; border: none;
  color: #FCA5A5; cursor: pointer; font-size: 14px; padding: 0; line-height: 1;
}

/* ── EVAL / SCORE ── */
.eval-container { animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1); }

.eval-score-card {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: .85rem;
  backdrop-filter: blur(12px);
}
.score-circle { flex-shrink: 0; }
.score-meta { flex: 1; }
.score-grade-label {
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 700;
  color: var(--text); margin-bottom: 3px;
}
.score-grade-sub { font-size: 12px; color: var(--text2); margin-bottom: 10px; }
.score-bar-bg { height: 5px; background: var(--border); border-radius: 4px; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }

.eval-panels {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: .75rem; margin-bottom: .85rem;
}
.eval-panel {
  border-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
  border: 1px solid;
  backdrop-filter: blur(8px);
}
.eval-panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: .5rem; }
.eval-panel-icon { font-size: 15px; }
.eval-panel-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.eval-panel-body { font-size: 12.5px; line-height: 1.65; }
.ep-feedback { background: rgba(124,111,247,0.08); border-color: rgba(167,139,250,0.2); }
.ep-feedback .eval-panel-title { color: #A78BFA; }
.ep-feedback .eval-panel-body { color: var(--text2); }
.ep-suggest { background: rgba(16,185,129,0.08); border-color: rgba(52,211,153,0.2); }
.ep-suggest .eval-panel-title { color: #34D399; }
.ep-suggest .eval-panel-body { color: var(--text2); }

/* ── RESULTS SCREEN ── */
.results-hero {
  text-align: center;
  padding: 2.5rem 1rem 2rem;
  position: relative;
}
.results-trophy-ring {
  width: 90px; height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(124,111,247,0.15), rgba(16,185,129,0.15));
  border: 2px solid rgba(167,139,250,0.3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.25rem;
  font-size: 38px;
  box-shadow: 0 0 40px rgba(124,111,247,0.2);
  animation: trophyPop 0.6s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes trophyPop {
  from { transform: scale(0.3); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.results-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px; font-weight: 700;
  color: var(--text); margin-bottom: 6px; letter-spacing: -0.02em;
}
.results-sub { font-size: 14px; color: var(--text2); }

.metrics-row {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; margin-bottom: 1.5rem;
}
.metric-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1.1rem;
  text-align: center;
  backdrop-filter: blur(8px);
  transition: border-color var(--transition);
}
.metric-box:hover { border-color: rgba(124,111,247,0.4); }
.metric-val {
  font-family: 'Syne', sans-serif;
  font-size: 26px; font-weight: 800;
  color: var(--text); margin-bottom: 3px;
  background: linear-gradient(135deg, var(--text), var(--text2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.metric-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--text3); font-weight: 600; }

.perf-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(8px);
}
.perf-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--text3);
  margin-bottom: 1rem;
}
.perf-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
.perf-row:last-child { margin-bottom: 0; }
.perf-label { font-size: 11px; color: var(--text3); width: 22px; flex-shrink: 0; font-weight: 700; font-family: 'Syne', sans-serif; }
.perf-bar-bg { flex: 1; height: 7px; background: var(--border); border-radius: 4px; overflow: hidden; }
.perf-bar-fg { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }
.perf-score { font-size: 12px; font-weight: 700; color: var(--text); width: 30px; text-align: right; flex-shrink: 0; font-family: 'Syne', sans-serif; }

.hist-list { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1.5rem; }
.hist-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  backdrop-filter: blur(8px);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.hist-card:hover { border-color: rgba(124,111,247,0.3); box-shadow: var(--shadow); }
.hist-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: .75rem 1.25rem;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
}
.hist-q-num { font-size: 11px; font-weight: 700; color: var(--text3); font-family: 'Syne', sans-serif; text-transform: uppercase; letter-spacing: .05em; }
.hist-badge {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; border: 1px solid;
}
.hist-body { padding: 1rem 1.25rem; }
.hist-q-text { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: .5rem; line-height: 1.55; }
.hist-ans {
  font-size: 12px; color: var(--text2); line-height: 1.6;
  padding: .7rem .9rem;
  background: var(--bg3);
  border-radius: var(--radius-xs);
  margin-bottom: .75rem;
  border: 1px solid var(--border2);
}
.hist-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.hist-chip { font-size: 10px; padding: 3px 10px; border-radius: 20px; border: 1px solid; line-height: 1.5; }
.hist-chip-fb { background: rgba(124,111,247,0.08); color: #A78BFA; border-color: rgba(167,139,250,0.2); }
.hist-chip-sg { background: rgba(16,185,129,0.08); color: #34D399; border-color: rgba(52,211,153,0.2); }

.results-actions { display: flex; gap: 10px; }
.results-actions .primary-btn { flex: 1; }

/* ── SPINNER ── */
.spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── LOADING OVERLAY ── */
.loading-overlay {
  position: fixed; inset: 0;
  background: var(--bg);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.loading-pulse {
  width: 64px; height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7C6FF7, #A78BFA);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(124,111,247,0.5);
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(124,111,247,0.5); transform: scale(1); }
  50% { box-shadow: 0 0 0 16px rgba(124,111,247,0); transform: scale(1.05); }
}
.loading-text { font-size: 14px; color: var(--text2); font-weight: 500; }
.loading-dots::after {
  content: '';
  animation: dots 1.5s steps(3, end) infinite;
}
@keyframes dots {
  0% { content: ''; }
  33% { content: '.'; }
  66% { content: '..'; }
  100% { content: '...'; }
}

/* ── ENTER ANIMATION ── */
.fade-up { animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
.fade-up-d1 { animation-delay: 0.05s; }
.fade-up-d2 { animation-delay: 0.1s; }
.fade-up-d3 { animation-delay: 0.15s; }
.fade-up-d4 { animation-delay: 0.2s; }

/* ── RESPONSIVE MOBILE ── */
@media (max-width: 640px) {
  .page { padding: 0 1rem 5rem; }
  .header { padding: 1rem 0 .85rem; margin-bottom: 1.25rem; }
  .brand-name { font-size: 15px; }
  .ai-badge { display: none; }
  .role-grid { grid-template-columns: repeat(2, 1fr); gap: 7px; }
  .setup-row { grid-template-columns: 1fr; }
  .eval-panels { grid-template-columns: 1fr; }
  .metrics-row { gap: 7px; }
  .metric-val { font-size: 22px; }
  .results-actions { flex-direction: column; }
  .step-label { display: none; }
  .step-dot { width: 26px; height: 26px; font-size: 10px; }
  .q-text { font-size: 14px; }
  .results-title { font-size: 18px; }
}
@media (max-width: 380px) {
  .role-grid { grid-template-columns: 1fr 1fr; }
  .diff-grid { grid-template-columns: repeat(3, 1fr); }
}
`;

// ─── SCORE RING ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, isDark }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 10;
  const textFill = isDark ? "#F0F4FF" : "#0F172A";
  const trackFill = isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0";
  return (
    <svg width="76" height="76" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke={trackFill} strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="36" y="32" textAnchor="middle" fontSize="20" fontWeight="700" fill={textFill} fontFamily="Syne,sans-serif">{score}</text>
      <text x="36" y="46" textAnchor="middle" fontSize="10" fill="#64748B">/ 10</text>
    </svg>
  );
}

// ─── STEP TRACK ───────────────────────────────────────────────────────────────

function StepTrack({ step }) {
  const steps = ["Setup", "Interview", "Results"];
  return (
    <div className="step-track">
      {steps.map((label, i) => {
        const n = i + 1, isDone = step > n, isActive = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: n < 3 ? 1 : 0 }}>
            <div className={`step-dot${isDone ? " done" : isActive ? " active" : ""}`}>
              {isDone ? "✓" : n}
            </div>
            <span className={`step-label${isDone ? " done" : isActive ? " active" : ""}`} style={{ marginLeft: 7 }}>{label}</span>
            {n < 3 && (
              <div className="step-connector" style={{ flex: 1 }}>
                <div className="step-connector-fill" style={{ width: isDone ? "100%" : "0%" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── WAVEFORM ─────────────────────────────────────────────────────────────────

const NUM_BARS = 16;
function VoiceWaveform({ isListening }) {
  const [heights, setHeights] = useState(() => Array(NUM_BARS).fill(3));
  const animRef = useRef(null);
  useEffect(() => {
    if (isListening) {
      const animate = () => {
        setHeights(Array(NUM_BARS).fill(0).map((_, i) => {
          const base = 3;
          const peak = i % 2 === 0 ? 26 : 18;
          return base + Math.random() * (peak - base);
        }));
        animRef.current = setTimeout(animate, 100);
      };
      animate();
    } else {
      if (animRef.current) clearTimeout(animRef.current);
      setHeights(Array(NUM_BARS).fill(3));
    }
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [isListening]);
  return (
    <div className="voice-waveform">
      {heights.map((h, i) => (
        <div key={i} className={`waveform-bar${isListening ? " active" : ""}`} style={{ height: h }} />
      ))}
    </div>
  );
}

// ─── VOICE PANEL ─────────────────────────────────────────────────────────────

function VoicePanel({ answer, setAnswer, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const accumulatedRef = useRef("");
  const startTimeRef = useRef(null);

  const SpeechRecognition = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const isSupported = !!SpeechRecognition;

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, [elapsedSeconds]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
    stopTimer();
    setIsListening(false);
  }, [stopTimer]);

  useEffect(() => () => stopListening(), [stopListening]);
  useEffect(() => { if (disabled && isListening) stopListening(); }, [disabled, isListening, stopListening]);

  const startListening = useCallback(() => {
    if (!isSupported) { setVoiceError("Your browser doesn't support speech recognition. Try Chrome or Edge."); return; }
    setVoiceError(null);
    accumulatedRef.current = answer;
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setIsListening(true); setElapsedSeconds(0);
        startTimeRef.current = Date.now(); startTimer();
      };
      recognition.onresult = (event) => {
        let interimTranscript = "", finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += t + " ";
          else interimTranscript += t;
        }
        if (finalTranscript) {
          accumulatedRef.current = (accumulatedRef.current + " " + finalTranscript).trimStart();
          setAnswer(accumulatedRef.current);
        } else if (interimTranscript) {
          setAnswer((accumulatedRef.current + " " + interimTranscript).trimStart());
        }
      };
      recognition.onerror = (event) => {
        stopTimer(); setIsListening(false);
        const msgs = {
          "not-allowed": "Microphone access denied. Please allow microphone permission.",
          "permission-denied": "Microphone access denied.",
          "no-speech": "No speech detected. Please speak clearly.",
          "audio-capture": "No microphone found. Please connect one.",
          "network": "Network error. Speech recognition requires internet.",
          "aborted": null,
        };
        const msg = msgs[event.error] ?? `Speech recognition error: ${event.error}`;
        if (msg) setVoiceError(msg);
      };
      recognition.onend = () => { stopTimer(); setIsListening(false); recognitionRef.current = null; };
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setVoiceError("Failed to start speech recognition. Please refresh and try again.");
      setIsListening(false); stopTimer();
    }
  }, [isSupported, SpeechRecognition, answer, setAnswer, startTimer, stopTimer]);

  const statusText = () => {
    if (!isSupported) return "Not supported in this browser";
    if (voiceError) return voiceError;
    if (isListening) return "🎙 Listening… speak your answer";
    if (answer && elapsedSeconds > 0) return "Recording stopped — answer captured";
    return "Click Start to answer by voice";
  };

  return (
    <div className="voice-panel">
      <div className="voice-panel-header">
        <span className="voice-panel-title">🎤 Voice Answer</span>
        <span className={`voice-support-badge ${isSupported ? "supported" : "unsupported"}`}>
          {isSupported ? "✓ Supported" : "✗ Unsupported"}
        </span>
      </div>
      <div className="voice-body">
        <div className="voice-controls">
          <button className="voice-btn voice-btn-start" onClick={startListening}
            disabled={!isSupported || isListening || disabled}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Start
          </button>
          <button className="voice-btn voice-btn-stop" onClick={stopListening} disabled={!isListening}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
            Stop
          </button>
          <div className="voice-status">
            <div className={`voice-status-dot ${voiceError ? "error" : isListening ? "listening" : "idle"}`} />
            <span className={`voice-status-text ${voiceError ? "error-txt" : isListening ? "active" : ""}`}>
              {statusText()}
            </span>
          </div>
        </div>
        <VoiceWaveform isListening={isListening} />
        {voiceError && (
          <div className="voice-error-bar">
            <span>⚠️ {voiceError}</span>
            <button onClick={() => setVoiceError(null)}>✕</button>
          </div>
        )}
        <div className="voice-meta">
          <span className={`voice-timer${isListening ? " active" : ""}`}>
            {isListening ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: 1 }}><circle cx="12" cy="12" r="10"/></svg> {formatTime(elapsedSeconds)}</> : <>⏱ {formatTime(elapsedSeconds)}</>}
          </span>
          <span className={`voice-char-count${answer.length > 0 ? " has-content" : ""}`}>{answer.length} chars</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [screen, setScreen] = useState("setup");
  const [role, setRole] = useState("Python Developer");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");
  const [qType, setQType] = useState("Technical");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [scores, setScores] = useState([]);
  const [history, setHistory] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const theme = isDark ? DARK : LIGHT;
  const effectiveRole = role === "custom" ? (customRole || "Custom Role") : role;
  const step = screen === "setup" ? 1 : screen === "question" ? 2 : 3;
  const tip = TIPS[(questionNumber - 1) % TIPS.length];
  const qColor = Q_TYPE_COLORS[qType] || Q_TYPE_COLORS["Technical"];
  const selectedRoleObj = ROLES.find(r => r.id === role) || ROLES[0];

  // Apply theme CSS vars
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [isDark]);

  const uploadResume = async () => {
    if (!resumeFile) return "";
    try {
      const fd = new FormData(); fd.append("file", resumeFile);
      const r = await fetch(`${API_URL}/upload-resume`, { method: "POST", body: fd });
      const d = await r.json();
      if (d.resume_text) { setResumeText(d.resume_text); return d.resume_text; }
    } catch (e) { console.error(e);
      setErrorMessage("Server connection failed");
     }
    return "";
  };

  // Fetches all 5 questions in ONE API call and stores them in state.
  const fetchAllQuestions = async (resumeData = "") => {
    const hasR = !!resumeData;
    const ep = hasR ? "/generate-resume-question" : "/generate-question";
    const body = hasR
      ? { role: effectiveRole, resume_text: resumeData, difficulty }
      : { role: effectiveRole, difficulty };
    const r = await fetch(`${API_URL}${ep}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    if (!d.questions || d.questions.length < 5) throw new Error("Insufficient questions returned.");
    return d.questions; // array of 5 strings
  };

  // Sets the active question from the pre-fetched array and assigns a random type.
  const applyQuestion = (allQuestions, idx) => {
    setQuestion(allQuestions[idx]);
    setQType(Q_TYPES[Math.floor(Math.random() * Q_TYPES.length)]);
    setAnswer("");
    setResult(null);
  };

  const startInterview = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      let uploaded = "";
      if (resumeFile) uploaded = await uploadResume();
      const allQuestions = await fetchAllQuestions(uploaded);
      setQuestions(allQuestions);
      setCurrentQuestionIndex(0);
      applyQuestion(allQuestions, 0);
      setScreen("question");
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to load questions. Please try again.");
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) { setErrorMessage("Please write or speak an answer first."); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/evaluate-answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, difficulty }),
      });
      const d = await r.json();
      if (d.error) { setErrorMessage(d.error); setSubmitting(false); return; }
      const sc = parseInt(d.score);
      if (!isNaN(sc)) {
        setScores(p => [...p, sc]);
        setHistory(p => [...p, { question, answer, score: sc, feedback: d.feedback, suggestion: d.suggestion }]);
      }
      setResult(d);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const nextQuestion = async () => {
    if (questionNumber >= 5) { setScreen("results"); return; }
    setNextLoading(true);
    const nextIdx = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIdx);
    setQuestionNumber(p => p + 1);
    applyQuestion(questions, nextIdx);
    setNextLoading(false);
  };

  const restart = () => {
    setScreen("setup"); setRole("Python Developer"); setCustomRole(""); setDifficulty("medium");
    setResumeFile(null); setResumeText(""); setQuestion(""); setAnswer(""); setResult(null);
    setQuestionNumber(1); setScores([]); setHistory([]);
    setQuestions([]); setCurrentQuestionIndex(0);
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`${API_URL}/generate-report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: effectiveRole, average_score: avg, history }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "RoleForge_Report.pdf";
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { console.error(error); }
  };

  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  const best = scores.length ? Math.max(...scores) : "—";
  const overallGrade = scores.length ? scoreGrade(parseFloat(avg)) : null;

  const diffColors = { easy: "#10B981", medium: "#F59E0B", hard: "#EF4444" };

  return (
    <>
      <style>{css}</style>
    {errorMessage && (
      <div
        style={{
          background: "#dc2626",
          color: "white",
          padding: "12px",
          borderRadius: "10px",
          margin: "12px",
          textAlign: "center",
          cursor: "pointer",
          position: "sticky",
          top: "10px",
          zIndex: 9999
        }}
        onClick={() => setErrorMessage("")}
      >
        {errorMessage}
      </div>
    )}

      {/* Ambient glow */}
      <div className="ambient-glow ambient-1" />
      <div className="ambient-glow ambient-2" />

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-pulse">🎙</div>
          <div className="loading-text">Preparing your interview<span className="loading-dots" /></div>
        </div>
      )}

      <div className="app-shell">
        <div className="page">

          {/* ── HEADER ── */}
          <div className="header">
            <div className="brand">
              <div className="brand-logo">🎙</div>
              <div>
                <div className="brand-name">RoleForge AI</div>
                <div className="brand-sub">AI-powered interview coach</div>
              </div>
            </div>
            <div className="header-right">
              <span className="ai-badge">✦ AI-powered</span>
              <button className="theme-toggle" onClick={() => setIsDark(d => !d)} title="Toggle theme">
                {isDark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          <StepTrack step={step} />

          {/* ─────────────────── SETUP ─────────────────── */}
          {screen === "setup" && (
            <div className="fade-up">
              <div className="setup-grid">

                {/* Role selector */}
                <div className="card fade-up fade-up-d1">
                  <div className="card-inner">
                    <div className="section-label">
                      <div className="section-label-dot" />
                      Target role
                    </div>
                    <div className="role-grid">
                      {ROLES.map(r => (
                        <div
                          key={r.id}
                          className={`role-card${role === r.id ? " selected" : ""}`}
                          style={{ "--role-accent": r.accent, "--role-accent-bg": r.accent + "20" }}
                          onClick={() => setRole(r.id)}
                        >
                          <div className="role-icon-box">{r.icon}</div>
                          <div className="role-text">
                            <div className="role-name">{r.label}</div>
                            <div className="role-desc">{r.desc}</div>
                          </div>
                          {role === r.id && (
                            <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: r.accent, flexShrink: 0, boxShadow: `0 0 6px ${r.accent}` }} />
                          )}
                        </div>
                      ))}
                    </div>
                    {role === "custom" && (
                      <div className="custom-input">
                        <input value={customRole} onChange={e => setCustomRole(e.target.value)}
                          placeholder="e.g. DevOps Engineer, Product Manager…" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Difficulty + Resume in a row */}
                <div className="setup-row fade-up fade-up-d2">
                  <div className="card">
                    <div className="card-inner">
                      <div className="section-label">
                        <div className="section-label-dot" />
                        Difficulty
                      </div>
                      <div className="diff-grid">
                        {DIFFICULTIES.map(d => (
                          <button
                            key={d.id}
                            className={`diff-btn${difficulty === d.id ? " active" : ""}`}
                            onClick={() => setDifficulty(d.id)}
                            style={difficulty === d.id ? {
                              borderColor: d.color,
                              background: d.color + "15",
                              color: d.color,
                            } : {}}
                          >
                            <span className="icon">{d.icon}</span>
                            <div className="label">{d.label}</div>
                            <div className="desc">{d.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-inner">
                      <div className="section-label">
                        <div className="section-label-dot" />
                        Resume
                      </div>
                      <div className={`file-drop${resumeFile ? " has-file" : ""}`}
                        onClick={() => document.getElementById("file-inp").click()}>
                        <div className="fd-icon">{resumeFile ? "✅" : "📤"}</div>
                        <div className="fd-text">{resumeFile ? "Resume uploaded" : "Upload PDF resume"}</div>
                        {resumeFile && <div className="file-chip">✓ {resumeFile.name}</div>}
                      </div>
                      <input id="file-inp" type="file" accept=".pdf" style={{ display: "none" }}
                        onChange={e => setResumeFile(e.target.files[0])} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-bar fade-up fade-up-d3">
                <span className="info-bar-icon">💡</span>
                <p>Upload your resume for personalized questions tailored to your experience. All 5 questions are evaluated in real-time by AI with detailed feedback and suggestions.</p>
              </div>

              <button className="primary-btn fade-up fade-up-d4" onClick={startInterview} disabled={loading || (role === "custom" && !customRole.trim())}>
                {loading ? <><span className="spinner" /> Preparing your interview…</> : <>▶ &nbsp;Start Interview — {effectiveRole}</>}
              </button>
            </div>
          )}

          {/* ─────────────────── QUESTION ─────────────────── */}
          {screen === "question" && (
            <>
              <div className="q-header fade-up">
                <span className="q-counter">Question {questionNumber} <span style={{ color: "var(--text3)", fontWeight: 400 }}>of 5</span></span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: diffColors[difficulty], background: diffColors[difficulty] + "18", padding: "3px 10px", borderRadius: 20, border: `1px solid ${diffColors[difficulty]}33`, fontWeight: 600 }}>
                    {DIFFICULTIES.find(d => d.id === difficulty)?.icon} {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                  <span className="q-role-tag">{effectiveRole}</span>
                </div>
              </div>

              <div className="prog-wrap fade-up fade-up-d1">
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${(questionNumber / 5) * 100}%` }} />
                </div>
                <div className="prog-labels">
                  <span>{questionNumber - 1} answered</span>
                  <span>{5 - questionNumber + 1} remaining</span>
                </div>
              </div>

              <div className="q-card fade-up fade-up-d2">
                <div className="q-card-top">
                  <span className="q-type-badge" style={{ background: qColor.bg, color: qColor.text, borderColor: qColor.border }}>
                    {qType}
                  </span>
                  <p className="q-text">{question || "Generating your question…"}</p>
                </div>
                <div className="q-card-body">
                  <div className="ans-label">
                    Your answer
                    <span className={`char-count${answer.length > 1500 ? " warn" : ""}`}>{answer.length} characters</span>
                  </div>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    disabled={!!result}
                    className={!result && answer.length > 0 ? undefined : undefined}
                    placeholder="Write a clear, structured answer, or use the voice panel below to speak your answer…"
                  />
                  {!result && <VoicePanel answer={answer} setAnswer={setAnswer} disabled={!!result || submitting} />}
                  <div className="tip-row">
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
                    <span>{tip}</span>
                  </div>
                  {!result && (
                    <button className="primary-btn success-btn" style={{ marginTop: ".75rem" }} onClick={submitAnswer} disabled={submitting || !answer.trim()}>
                      {submitting ? <><span className="spinner" /> Evaluating with AI…</> : <>↑ &nbsp;Submit Answer</>}
                    </button>
                  )}
                </div>
              </div>

              {result && (() => {
                const sc = parseInt(result.score);
                const g = scoreGrade(sc);
                return (
                  <div className="eval-container fade-up">
                    <div className="eval-score-card">
                      <div className="score-circle">
                        <ScoreRing score={sc} color={g.color} isDark={isDark} />
                      </div>
                      <div className="score-meta">
                        <div className="score-grade-label">{g.label}</div>
                        <div className="score-grade-sub">{g.sub}</div>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${sc * 10}%`, background: g.color, boxShadow: `0 0 8px ${g.glow}` }} />
                        </div>
                      </div>
                    </div>
                    <div className="eval-panels">
                      <div className="eval-panel ep-feedback">
                        <div className="eval-panel-head">
                          <span className="eval-panel-icon">💬</span>
                          <span className="eval-panel-title">Feedback</span>
                        </div>
                        <div className="eval-panel-body">{result.feedback}</div>
                      </div>
                      <div className="eval-panel ep-suggest">
                        <div className="eval-panel-head">
                          <span className="eval-panel-icon">💡</span>
                          <span className="eval-panel-title">Suggestion</span>
                        </div>
                        <div className="eval-panel-body">{result.suggestion}</div>
                      </div>
                    </div>
                    <button
                      className={`primary-btn${questionNumber >= 5 ? " finish-btn" : " success-btn"}`}
                      onClick={nextQuestion} disabled={nextLoading}
                    >
                      {nextLoading
                        ? <><span className="spinner" /> Loading next question…</>
                        : questionNumber >= 5 ? <>🏆 &nbsp;View Results</> : <>→ &nbsp;Next Question</>}
                    </button>
                  </div>
                );
              })()}
            </>
          )}

          {/* ─────────────────── RESULTS ─────────────────── */}
          {screen === "results" && (
            <div className="fade-up">
              <div className="results-hero">
                <div className="results-trophy-ring">🏆</div>
                <div className="results-title">Interview Complete</div>
                <div className="results-sub">{effectiveRole} · {overallGrade?.label} · {avg}/10 average</div>
              </div>

              <div className="metrics-row fade-up fade-up-d1">
                <div className="metric-box">
                  <div className="metric-val">{avg}{scores.length ? "/10" : ""}</div>
                  <div className="metric-lbl">Avg Score</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">{best}{scores.length ? "/10" : ""}</div>
                  <div className="metric-lbl">Best Score</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val">{overallGrade?.label || "—"}</div>
                  <div className="metric-lbl">Grade</div>
                </div>
              </div>

              <div className="perf-section fade-up fade-up-d2">
                <div className="perf-title">Score per question</div>
                {scores.map((sc, i) => {
                  const g = scoreGrade(sc);
                  return (
                    <div key={i} className="perf-row">
                      <span className="perf-label">Q{i + 1}</span>
                      <div className="perf-bar-bg">
                        <div className="perf-bar-fg" style={{ width: `${sc * 10}%`, background: g.color, boxShadow: `0 0 6px ${g.glow}` }} />
                      </div>
                      <span className="perf-score" style={{ color: g.color }}>{sc}</span>
                    </div>
                  );
                })}
              </div>

              <div className="hist-list fade-up fade-up-d3">
                {history.map((item, i) => {
                  const g = scoreGrade(item.score);
                  return (
                    <div key={i} className="hist-card">
                      <div className="hist-top">
                        <span className="hist-q-num">Question {i + 1}</span>
                        <span className="hist-badge" style={{ background: g.color + "18", color: g.color, borderColor: g.color + "33" }}>
                          {item.score}/10 · {g.label}
                        </span>
                      </div>
                      <div className="hist-body">
                        <p className="hist-q-text">{item.question}</p>
                        <p className="hist-ans">{item.answer}</p>
                        <div className="hist-chips">
                          <span className="hist-chip hist-chip-fb">💬 {item.feedback}</span>
                          <span className="hist-chip hist-chip-sg">💡 {item.suggestion}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="results-actions fade-up fade-up-d4">
                <button className="primary-btn" style={{ background: "linear-gradient(135deg, #1F2937, #374151)", boxShadow: "none", border: "1px solid var(--border)" }} onClick={downloadReport}>
                  📄 Download Report
                </button>
                <button className="primary-btn finish-btn" onClick={restart}>
                  ↺ &nbsp;New Interview
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
