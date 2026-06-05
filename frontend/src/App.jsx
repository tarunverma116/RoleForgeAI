import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const ROLES = [
  { id: "Python Developer", label: "Python Developer", desc: "Backend & scripting", icon: "🐍", color: { bg: "#EEEDFE", icon: "#534AB7", border: "#AFA9EC" } },
  { id: "ML Engineer", label: "ML Engineer", desc: "Models & pipelines", icon: "🧠", color: { bg: "#E1F5EE", icon: "#0F6E56", border: "#5DCAA5" } },
  { id: "Java Developer", label: "Java Developer", desc: "Enterprise & OOP", icon: "☕", color: { bg: "#FAEEDA", icon: "#854F0B", border: "#EF9F27" } },
  { id: "AIML Intern", label: "AIML Intern", desc: "AI fundamentals", icon: "🤖", color: { bg: "#FAECE7", icon: "#993C1D", border: "#F0997B" } },
  { id: "Frontend Developer", label: "Frontend Developer", desc: "React, CSS, UX", icon: "🎨", color: { bg: "#E6F1FB", icon: "#185FA5", border: "#85B7EB" } },
  { id: "Data Analyst", label: "Data Analyst", desc: "SQL, stats, BI", icon: "📊", color: { bg: "#EAF3DE", icon: "#3B6D11", border: "#97C459" } },
  { id: "custom", label: "Custom role", desc: "Type your own", icon: "✏️", color: { bg: "#FBEAF0", icon: "#993556", border: "#ED93B1" } },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", icon: "🌱" },
  { id: "medium", label: "Medium", icon: "🔥" },
  { id: "hard", label: "Hard", icon: "⚡" },
];

const Q_TYPES = ["Technical", "Behavioural", "Situational", "System Design", "Conceptual"];
const Q_COLORS = [
  { bg: "#EEEDFE", text: "#3C3489", border: "#AFA9EC" },
  { bg: "#E1F5EE", text: "#085041", border: "#5DCAA5" },
  { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" },
  { bg: "#FAECE7", text: "#712B13", border: "#F0997B" },
  { bg: "#E6F1FB", text: "#0C447C", border: "#85B7EB" },
];
const TIPS = [
  "Be specific — use concrete examples",
  "Structure with Situation, Task, Action, Result",
  "Keep your answer under 2 minutes when speaking",
  "Mention tools and technologies by name",
  "Show your reasoning, not just the answer",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function scoreGrade(s) {
  if (s >= 9) return { label: "Excellent", sub: "Outstanding answer", main: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5" };
  if (s >= 7) return { label: "Good", sub: "Strong response, minor gaps", main: "#3B6D11", bg: "#EAF3DE", border: "#97C459" };
  if (s >= 5) return { label: "Average", sub: "Decent but needs more depth", main: "#854F0B", bg: "#FAEEDA", border: "#EF9F27" };
  return { label: "Needs work", sub: "Review core concepts", main: "#993C1D", bg: "#FAECE7", border: "#F0997B" };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; }
.page { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand-icon { width: 46px; height: 46px; border-radius: 12px; background: #EEEDFE; border: 1px solid #AFA9EC; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.brand-name { font-size: 18px; font-weight: 600; color: #0f172a; }
.brand-sub { font-size: 12px; color: #64748b; margin-top: 1px; }
.ai-badge { font-size: 11px; padding: 4px 12px; border-radius: 20px; background: #EEEDFE; color: #3C3489; font-weight: 500; border: 1px solid #AFA9EC; }

.step-track { display: flex; align-items: center; margin-bottom: 2rem; }
.step-item { display: flex; align-items: center; gap: 8px; }
.step-line { flex: 1; height: 1px; background: #e2e8f0; margin: 0 8px; }
.step-line.done { background: #0F6E56; }
.step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; border: 1px solid #e2e8f0; background: #f8fafc; color: #94a3b8; transition: all 0.3s; }
.step-dot.active { background: #534AB7; color: #EEEDFE; border-color: #534AB7; }
.step-dot.done { background: #0F6E56; color: #E1F5EE; border-color: #0F6E56; }
.step-label { font-size: 12px; color: #94a3b8; white-space: nowrap; }
.step-label.active { color: #3C3489; font-weight: 600; }

.setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.field-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
.field-card.full { grid-column: 1 / -1; }
.field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: .75rem; display: flex; align-items: center; gap: 6px; }

.role-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.role-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; background: #fff; }
.role-card:hover { border-color: #AFA9EC; background: #EEEDFE; }
.role-card.selected { border-color: #534AB7; background: #EEEDFE; }
.role-card.selected .role-name { color: #3C3489; font-weight: 600; }
.role-icon-box { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.role-name { font-size: 12px; color: #0f172a; font-weight: 500; }
.role-desc { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.custom-input { margin-top: 10px; display: flex; gap: 8px; }
.custom-input input { flex: 1; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #0f172a; outline: none; background: #fff; }
.custom-input input:focus { border-color: #534AB7; }

.diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.diff-btn { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 6px; cursor: pointer; text-align: center; font-size: 12px; font-weight: 600; background: #fff; color: #94a3b8; transition: all 0.2s; }
.diff-btn span { display: block; font-size: 18px; margin-bottom: 3px; }
.diff-btn:hover, .diff-btn.active-easy { border-color: #5DCAA5; background: #E1F5EE; color: #085041; }
.diff-btn.active-medium { border-color: #EF9F27; background: #FAEEDA; color: #633806; }
.diff-btn.active-hard { border-color: #F0997B; background: #FAECE7; color: #712B13; }

.file-drop { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1.25rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc; }
.file-drop:hover { border-color: #534AB7; background: #EEEDFE; }
.file-drop.has-file { border-style: solid; border-color: #0F6E56; background: #E1F5EE; }
.file-drop .fd-icon { font-size: 24px; margin-bottom: 6px; }
.file-drop p { font-size: 12px; color: #64748b; }
.file-drop.has-file p { color: #085041; }
.file-chip { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; font-size: 11px; background: #E1F5EE; color: #085041; padding: 3px 10px; border-radius: 20px; border: 1px solid #5DCAA5; }

.tips-bar { display: flex; gap: 10px; align-items: flex-start; background: #EEEDFE; border: 1px solid #AFA9EC; border-radius: 10px; padding: .75rem 1rem; margin-bottom: 1.25rem; }
.tips-bar-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.tips-bar p { font-size: 12px; color: #3C3489; line-height: 1.5; }

.start-btn { width: 100%; padding: 13px; border-radius: 10px; background: #534AB7; color: #EEEDFE; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
.start-btn:hover { opacity: 0.88; }
.start-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.q-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.q-counter { font-size: 13px; font-weight: 600; color: #0f172a; }
.q-role-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #EEEDFE; color: #3C3489; border: 1px solid #AFA9EC; font-weight: 500; }
.prog-wrap { margin-bottom: 1.5rem; }
.prog-bar { height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; background: linear-gradient(90deg, #534AB7, #5DCAA5); border-radius: 4px; transition: width 0.5s ease; }
.prog-labels { display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: #94a3b8; }

.q-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; }
.q-card-top { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.q-type-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: .75rem; border: 1px solid; }
.q-text { font-size: 15px; line-height: 1.7; color: #0f172a; }
.q-card-body { padding: 1.25rem 1.5rem; }
.ans-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: .5rem; display: flex; align-items: center; justify-content: space-between; }
.char-count { font-size: 11px; color: #cbd5e1; font-weight: 400; text-transform: none; letter-spacing: 0; }
textarea { width: 100%; min-height: 130px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.6; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; background: #fff; outline: none; transition: border-color 0.2s; }
textarea:focus { border-color: #534AB7; }
textarea.listening { border-color: #0F6E56; box-shadow: 0 0 0 3px rgba(15,110,86,0.10); }
.tip-row { display: flex; align-items: center; gap: 6px; margin-top: .75rem; }
.tip-row span { font-size: 12px; color: #94a3b8; }
.submit-btn { width: 100%; margin-top: .75rem; padding: 12px; border-radius: 8px; background: #534AB7; color: #EEEDFE; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
.submit-btn:hover { opacity: 0.88; }
.submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── VOICE PANEL ── */
.voice-panel {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}
.voice-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.voice-panel-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}
.voice-support-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
}
.voice-support-badge.supported { background: #E1F5EE; color: #085041; border: 1px solid #5DCAA5; }
.voice-support-badge.unsupported { background: #FAECE7; color: #712B13; border: 1px solid #F0997B; }
.voice-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.voice-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.voice-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.voice-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.voice-btn-start {
  background: #0F6E56;
  color: #E1F5EE;
}
.voice-btn-start:not(:disabled):hover {
  background: #0a5441;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15,110,86,0.35);
}
.voice-btn-stop {
  background: #c0392b;
  color: #fff;
}
.voice-btn-stop:not(:disabled):hover {
  background: #a93226;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(192,57,43,0.35);
}
.voice-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.voice-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.voice-status-dot.idle { background: #475569; }
.voice-status-dot.listening {
  background: #22c55e;
  animation: voice-pulse 1.2s ease-in-out infinite;
}
.voice-status-dot.error { background: #ef4444; }
@keyframes voice-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  50% { opacity: 0.85; transform: scale(1.1); box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}
.voice-status-text {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.voice-status-text.active { color: #22c55e; font-weight: 500; }
.voice-status-text.error-txt { color: #f87171; }

/* Waveform */
.voice-waveform {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 0;
}
.waveform-bar {
  width: 3px;
  border-radius: 2px;
  background: #334155;
  transition: height 0.1s ease, background 0.2s;
  min-height: 4px;
}
.waveform-bar.active {
  background: #22c55e;
}

/* Timer + char counter row */
.voice-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px solid #1e293b;
}
.voice-timer {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 5px;
}
.voice-timer.active { color: #22c55e; }
.voice-char-count {
  font-size: 11px;
  color: #475569;
}
.voice-char-count.has-content { color: #7dd3fc; }

/* Error toast */
.voice-error-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #fca5a5;
}
.voice-error-bar button {
  margin-left: auto;
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.eval-score-header { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: .75rem; }
.score-circle { flex-shrink: 0; }
.score-meta { flex: 1; }
.score-grade-label { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 3px; }
.score-grade-sub { font-size: 13px; color: #64748b; margin-bottom: 10px; }
.score-bar-bg { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }

.eval-panels { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem; }
.eval-panel { border-radius: 12px; padding: 1rem 1.25rem; border: 1px solid; }
.eval-panel-head { display: flex; align-items: center; gap: 8px; margin-bottom: .5rem; }
.eval-panel-icon { font-size: 16px; }
.eval-panel-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
.eval-panel-body { font-size: 13px; line-height: 1.6; }
.ep-feedback { background: #EEEDFE; border-color: #AFA9EC; }
.ep-feedback .eval-panel-title { color: #534AB7; }
.ep-feedback .eval-panel-body { color: #3C3489; }
.ep-suggest { background: #E1F5EE; border-color: #5DCAA5; }
.ep-suggest .eval-panel-title { color: #0F6E56; }
.ep-suggest .eval-panel-body { color: #085041; }

.next-btn { width: 100%; padding: 12px; border-radius: 8px; background: #0F6E56; color: #E1F5EE; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
.next-btn:hover { opacity: 0.88; }
.next-btn:disabled { opacity: 0.45; }
.next-btn.finish { background: #534AB7; }

.results-hero { text-align: center; padding: 2rem 1rem 1.5rem; }
.results-avatar { width: 72px; height: 72px; border-radius: 50%; background: #EEEDFE; border: 2px solid #AFA9EC; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 32px; }
.results-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
.results-sub { font-size: 14px; color: #64748b; }

.metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 1.5rem; }
.metric-box { background: #f8fafc; border-radius: 10px; padding: 1rem; text-align: center; border: 1px solid #e2e8f0; }
.metric-val { font-size: 24px; font-weight: 700; color: #0f172a; }
.metric-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; margin-top: 3px; font-weight: 600; }

.perf-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
.perf-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 1rem; }
.perf-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.perf-row:last-child { margin-bottom: 0; }
.perf-label { font-size: 12px; color: #64748b; width: 24px; flex-shrink: 0; font-weight: 500; }
.perf-bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.perf-bar-fg { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
.perf-score { font-size: 12px; font-weight: 600; color: #0f172a; width: 30px; text-align: right; flex-shrink: 0; }

.hist-list { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1.5rem; }
.hist-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.hist-top { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.hist-q-num { font-size: 12px; font-weight: 600; color: #64748b; }
.hist-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; border: 1px solid; }
.hist-body { padding: 1rem 1.25rem; }
.hist-q-text { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: .5rem; }
.hist-ans { font-size: 12px; color: #64748b; line-height: 1.55; padding: .75rem; background: #f8fafc; border-radius: 8px; margin-bottom: .75rem; }
.hist-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.hist-chip { font-size: 11px; padding: 3px 9px; border-radius: 20px; border: 1px solid; }
.hist-chip-fb { background: #EEEDFE; color: #3C3489; border-color: #AFA9EC; }
.hist-chip-sg { background: #E1F5EE; color: #085041; border-color: #5DCAA5; }

.restart-btn { width: 100%; padding: 13px; border-radius: 10px; background: #534AB7; color: #EEEDFE; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
.restart-btn:hover { opacity: 0.88; }

.spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── SCORE RING ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 10;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="36" y="33" textAnchor="middle" fontSize="20" fontWeight="600" fill="#0f172a">{score}</text>
      <text x="36" y="46" textAnchor="middle" fontSize="10" fill="#94a3b8">/ 10</text>
    </svg>
  );
}

// ─── STEP TRACK ───────────────────────────────────────────────────────────────

function StepTrack({ step }) {
  return (
    <div className="step-track">
      {["Setup", "Interview", "Results"].map((label, i) => {
        const n = i + 1;
        const isDone = step > n, isActive = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: n < 3 ? 1 : 0 }}>
            <div className={`step-dot${isDone ? " done" : isActive ? " active" : ""}`}>
              {isDone ? "✓" : n}
            </div>
            <span className={`step-label${isActive ? " active" : ""}`} style={{ marginLeft: 6 }}>{label}</span>
            {n < 3 && <div className={`step-line${isDone ? " done" : ""}`} style={{ flex: 1 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── WAVEFORM ANIMATION ───────────────────────────────────────────────────────
// 12 bars that animate randomly while listening

const NUM_BARS = 14;

function VoiceWaveform({ isListening }) {
  const [heights, setHeights] = useState(() => Array(NUM_BARS).fill(4));
  const animRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      const animate = () => {
        setHeights(
          Array(NUM_BARS).fill(0).map((_, i) => {
            const base = 4;
            const peak = i % 2 === 0 ? 28 : 20;
            return base + Math.random() * (peak - base);
          })
        );
        animRef.current = setTimeout(animate, 110);
      };
      animate();
    } else {
      if (animRef.current) clearTimeout(animRef.current);
      setHeights(Array(NUM_BARS).fill(4));
    }
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [isListening]);

  return (
    <div className="voice-waveform">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`waveform-bar${isListening ? " active" : ""}`}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

// ─── VOICE PANEL COMPONENT ────────────────────────────────────────────────────

function VoicePanel({ answer, setAnswer, disabled }) {
  // ── State
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const accumulatedRef = useRef(""); // text built up before current interim
  const startTimeRef = useRef(null);

  // ── Browser support check
  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const isSupported = !!SpeechRecognition;

  // ── Timer management
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, [elapsedSeconds]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Stop recognition (exposed so parent can call via prop too)
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    stopTimer();
    setIsListening(false);
  }, [stopTimer]);

  // ── Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // ── When disabled (answer submitted), stop automatically
  useEffect(() => {
    if (disabled && isListening) {
      stopListening();
    }
  }, [disabled, isListening, stopListening]);

  // ── Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setVoiceError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }
    setVoiceError(null);

    // snapshot the existing answer text so we can append to it
    accumulatedRef.current = answer;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setElapsedSeconds(0);
        startTimeRef.current = Date.now();
        startTimer();
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          accumulatedRef.current = (accumulatedRef.current + " " + finalTranscript).trimStart();
          setAnswer(accumulatedRef.current);
        } else if (interimTranscript) {
          // Show live preview: accumulated + current interim
          const preview = (accumulatedRef.current + " " + interimTranscript).trimStart();
          setAnswer(preview);
        }
      };

      recognition.onerror = (event) => {
        stopTimer();
        setIsListening(false);
        switch (event.error) {
          case "not-allowed":
          case "permission-denied":
            setVoiceError("Microphone access denied. Please allow microphone permission in your browser.");
            break;
          case "no-speech":
            setVoiceError("No speech detected. Please speak clearly and try again.");
            break;
          case "audio-capture":
            setVoiceError("No microphone found. Please connect a microphone and try again.");
            break;
          case "network":
            setVoiceError("Network error. Speech recognition requires an internet connection.");
            break;
          case "aborted":
            // intentional stop, no error to show
            break;
          default:
            setVoiceError(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognition.onend = () => {
        stopTimer();
        setIsListening(false);
        // If still has content in interim, finalise it
        if (recognitionRef.current) {
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setVoiceError("Failed to start speech recognition. Please refresh and try again.");
      setIsListening(false);
      stopTimer();
    }
  }, [isSupported, SpeechRecognition, answer, setAnswer, startTimer, stopTimer]);

  const statusText = () => {
    if (!isSupported) return "Not supported in this browser";
    if (voiceError) return voiceError;
    if (isListening) return "🎙 Listening… speak your answer";
    if (answer && elapsedSeconds > 0) return "Recording stopped — answer captured";
    return "Click Start to answer by voice";
  };

  const statusClass = () => {
    if (voiceError) return "error-txt";
    if (isListening) return "active";
    return "";
  };

  const dotClass = () => {
    if (voiceError) return "error";
    if (isListening) return "listening";
    return "idle";
  };

  return (
    <div className="voice-panel">
      {/* Header */}
      <div className="voice-panel-header">
        <span className="voice-panel-title">
          🎤 Voice answer
        </span>
        <span className={`voice-support-badge ${isSupported ? "supported" : "unsupported"}`}>
          {isSupported ? "✓ Supported" : "✗ Unsupported"}
        </span>
      </div>

      <div className="voice-body">
        {/* Controls row */}
        <div className="voice-controls">
          <button
            className="voice-btn voice-btn-start"
            onClick={startListening}
            disabled={!isSupported || isListening || disabled}
            title="Start voice recognition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Start
          </button>

          <button
            className="voice-btn voice-btn-stop"
            onClick={stopListening}
            disabled={!isListening}
            title="Stop voice recognition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="3" />
            </svg>
            Stop
          </button>

          <div className="voice-status">
            <div className={`voice-status-dot ${dotClass()}`} />
            <span className={`voice-status-text ${statusClass()}`}>
              {statusText()}
            </span>
          </div>
        </div>

        {/* Waveform */}
        <VoiceWaveform isListening={isListening} />

        {/* Error bar */}
        {voiceError && (
          <div className="voice-error-bar">
            <span>⚠️ {voiceError}</span>
            <button onClick={() => setVoiceError(null)}>✕</button>
          </div>
        )}

        {/* Meta row: timer + char count */}
        <div className="voice-meta">
          <span className={`voice-timer${isListening ? " active" : ""}`}>
            {isListening ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {formatTime(elapsedSeconds)}
              </>
            ) : (
              <>⏱ {formatTime(elapsedSeconds)}</>
            )}
          </span>
          <span className={`voice-char-count${answer.length > 0 ? " has-content" : ""}`}>
            {answer.length} characters
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [role, setRole] = useState("Python Developer");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [question, setQuestion] = useState("");
  const [qType, setQType] = useState("Technical");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [scores, setScores] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  const effectiveRole = role === "custom" ? (customRole || "Custom Role") : role;
  const step = screen === "setup" ? 1 : screen === "question" ? 2 : 3;
  const tip = TIPS[(questionNumber - 1) % TIPS.length];
  const qTypeIdx = Q_TYPES.indexOf(qType);
  const qColor = Q_COLORS[qTypeIdx >= 0 ? qTypeIdx : 0];

  const uploadResume = async () => {
    if (!resumeFile) return "";
    try {
      const fd = new FormData(); fd.append("file", resumeFile);
      const r = await fetch(`${API_URL}/upload-resume`, {
  method: "POST",
  body: fd
});
      const d = await r.json();
      if (d.resume_text) { setResumeText(d.resume_text); return d.resume_text; }
    } catch (e) { console.error(e); }
    return "";
  };

  const generateQuestion = async (resumeData = "") => {
    const hasR = !!resumeData;
    const ep = hasR ? "/generate-resume-question" : "/generate-question";
    const body = hasR ? { role: effectiveRole, resume_text: resumeData, difficulty } : { role: effectiveRole, difficulty };
    try {
      const r = await fetch(`${API_URL}${ep}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { alert(d.error); return; }
      setQuestion(d.question);
      setQType(Q_TYPES[Math.floor(Math.random() * Q_TYPES.length)]);
      setAnswer(""); setResult(null);
    } catch (e) { console.error(e); }
  };

  const startInterview = async () => {
    setLoading(true);
    let uploaded = "";
    if (resumeFile) uploaded = await uploadResume();
    await generateQuestion(uploaded);
    setScreen("question");
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) { alert("Please write or speak an answer first."); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/evaluate-answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, difficulty }),
      });
      const d = await r.json();
      if (d.error) { alert(d.error); setSubmitting(false); return; }
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
    setQuestionNumber(p => p + 1);
    await generateQuestion(resumeText);
    setNextLoading(false);
  };

  const restart = () => {
    setScreen("setup"); setRole("Python Developer"); setCustomRole(""); setDifficulty("easy");
    setResumeFile(null); setResumeText(""); setQuestion(""); setAnswer(""); setResult(null);
    setQuestionNumber(1); setScores([]); setHistory([]);
  };

  const downloadReport = async () => {
  try {
    const response = await fetch(
      `${API_URL}/generate-report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: effectiveRole,
          average_score: avg,
          history: history,
        }),
      }
    );

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "InterviewAce_Report.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();
  } catch (error) {
    console.error(error);
  }
};

  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  const best = scores.length ? Math.max(...scores) : "—";
  const overallGrade = scores.length ? scoreGrade(parseFloat(avg)) : null;

  return (
    <>
      <style>{css}</style>
      <div className="page">
        {/* ── HEADER ── */}
        <div className="header">
          <div className="brand">
            <div className="brand-icon">🎙</div>
            <div>
              <div className="brand-name">InterviewAce AI</div>
              <div className="brand-sub">Professional interview coach</div>
            </div>
          </div>
          <span className="ai-badge">✦ AI-powered</span>
        </div>

        <StepTrack step={step} />

        {/* ── SETUP ── */}
        {screen === "setup" && (
          <>
            <div className="setup-grid">
              <div className="field-card full">
                <div className="field-label">🎯 Target role</div>
                <div className="role-grid">
                  {ROLES.map(r => (
                    <div key={r.id} className={`role-card${role === r.id ? " selected" : ""}`} onClick={() => setRole(r.id)}>
                      <div className="role-icon-box" style={{ background: r.color.bg }}><span>{r.icon}</span></div>
                      <div><div className="role-name">{r.label}</div><div className="role-desc">{r.desc}</div></div>
                    </div>
                  ))}
                </div>
                {role === "custom" && (
                  <div className="custom-input">
                    <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="e.g. DevOps Engineer, Product Manager…" />
                  </div>
                )}
              </div>

              <div className="field-card">
                <div className="field-label">📈 Difficulty</div>
                <div className="diff-grid">
                  {DIFFICULTIES.map(d => (
                    <button key={d.id} className={`diff-btn${difficulty === d.id ? ` active-${d.id}` : ""}`} onClick={() => setDifficulty(d.id)}>
                      <span>{d.icon}</span>{d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-card">
                <div className="field-label">📄 Resume</div>
                <div className={`file-drop${resumeFile ? " has-file" : ""}`} onClick={() => document.getElementById("file-inp").click()}>
                  <div className="fd-icon">{resumeFile ? "✅" : "📤"}</div>
                  <p>{resumeFile ? "Resume uploaded" : "Upload PDF resume (optional)"}</p>
                  {resumeFile && <div className="file-chip">✓ {resumeFile.name}</div>}
                </div>
                <input id="file-inp" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setResumeFile(e.target.files[0])} />
              </div>
            </div>

            <div className="tips-bar">
              <span className="tips-bar-icon">💡</span>
              <p>Upload your resume for personalised questions based on your experience. Otherwise you'll get general role-based questions. All 5 questions are evaluated in real time by AI.</p>
            </div>

            <button className="start-btn" onClick={startInterview} disabled={loading}>
              {loading ? <><span className="spinner" /> Preparing your interview…</> : <>▶ Start interview — {effectiveRole}</>}
            </button>
          </>
        )}

        {/* ── QUESTION ── */}
        {screen === "question" && (
          <>
            <div className="q-header">
              <span className="q-counter">Question {questionNumber} of 5</span>
              <span className="q-role-tag">{effectiveRole}</span>
            </div>
            <div className="prog-wrap">
              <div className="prog-bar"><div className="prog-fill" style={{ width: `${(questionNumber / 5) * 100}%` }} /></div>
              <div className="prog-labels"><span>{questionNumber - 1} done</span><span>{5 - questionNumber + 1} remaining</span></div>
            </div>

            <div className="q-card">
              <div className="q-card-top">
                <span className="q-type-badge" style={{ background: qColor.bg, color: qColor.text, borderColor: qColor.border }}>{qType}</span>
                <p className="q-text">{question || "Generating your question…"}</p>
              </div>
              <div className="q-card-body">
                {/* Answer label with live char count */}
                <div className="ans-label">
                  Your answer
                  <span className="char-count">{answer.length} characters</span>
                </div>

                {/* Textarea — also updated by voice */}
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  disabled={!!result}
                  className={undefined /* voice border handled below */}
                  style={!!result ? {} : undefined}
                  placeholder="Write a clear, structured answer, or use the voice panel below to speak your answer…"
                />

                {/* ── VOICE PANEL ── inserted directly below textarea */}
                {!result && (
                  <VoicePanel
                    answer={answer}
                    setAnswer={setAnswer}
                    disabled={!!result || submitting}
                  />
                )}

                <div className="tip-row">
                  <span style={{ fontSize: 14 }}>💬</span>
                  <span>Tip: {tip}</span>
                </div>

                {!result && (
                  <button className="submit-btn" onClick={submitAnswer} disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Evaluating…</> : <>↑ Submit answer</>}
                  </button>
                )}
              </div>
            </div>

            {result && (() => {
              const sc = parseInt(result.score);
              const g = scoreGrade(sc);
              return (
                <div>
                  <div className="eval-score-header">
                    <div className="score-circle"><ScoreRing score={sc} color={g.main} /></div>
                    <div className="score-meta">
                      <div className="score-grade-label">{g.label}</div>
                      <div className="score-grade-sub">{g.sub}</div>
                      <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${sc * 10}%`, background: g.main }} /></div>
                    </div>
                  </div>
                  <div className="eval-panels">
                    <div className="eval-panel ep-feedback">
                      <div className="eval-panel-head"><span className="eval-panel-icon">💬</span><span className="eval-panel-title">Feedback</span></div>
                      <div className="eval-panel-body">{result.feedback}</div>
                    </div>
                    <div className="eval-panel ep-suggest">
                      <div className="eval-panel-head"><span className="eval-panel-icon">💡</span><span className="eval-panel-title">Suggestion</span></div>
                      <div className="eval-panel-body">{result.suggestion}</div>
                    </div>
                  </div>
                  <button className={`next-btn${questionNumber >= 5 ? " finish" : ""}`} onClick={nextQuestion} disabled={nextLoading}>
                    {nextLoading ? <><span className="spinner" /> Loading…</> : questionNumber >= 5 ? <>🏆 View results</> : <>→ Next question</>}
                  </button>
                </div>
              );
            })()}
          </>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && (
          <>
            <div className="results-hero">
              <div className="results-avatar">🏆</div>
              <div className="results-title">Interview complete — {effectiveRole}</div>
              <div className="results-sub">You scored {avg}/10 on average. {overallGrade?.sub}.</div>
            </div>
            <div className="metrics-row">
              <div className="metric-box"><div className="metric-val">{avg}{scores.length ? "/10" : ""}</div><div className="metric-lbl">Avg score</div></div>
              <div className="metric-box"><div className="metric-val">{best}{scores.length ? "/10" : ""}</div><div className="metric-lbl">Best score</div></div>
              <div className="metric-box"><div className="metric-val">{overallGrade?.label || "—"}</div><div className="metric-lbl">Grade</div></div>
            </div>
            <div className="perf-section">
              <div className="perf-title">Score per question</div>
              {scores.map((sc, i) => {
                const g = scoreGrade(sc);
                return (
                  <div key={i} className="perf-row">
                    <span className="perf-label">Q{i + 1}</span>
                    <div className="perf-bar-bg"><div className="perf-bar-fg" style={{ width: `${sc * 10}%`, background: g.main }} /></div>
                    <span className="perf-score">{sc}</span>
                  </div>
                );
              })}
            </div>
            <div className="hist-list">
              {history.map((item, i) => {
                const g = scoreGrade(item.score);
                return (
                  <div key={i} className="hist-card">
                    <div className="hist-top">
                      <span className="hist-q-num">Question {i + 1}</span>
                      <span className="hist-badge" style={{ background: g.bg, color: g.main, borderColor: g.border }}>{item.score}/10 · {g.label}</span>
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
            <div
  style={{
    display: "flex",
    gap: "12px",
  }}
>
  <button
    className="restart-btn"
    onClick={downloadReport}
  >
    📄 Download Report
  </button>

  <button
    className="restart-btn"
    onClick={restart}
  >
    ↺ Start New Interview
  </button>
</div>
          </>
        )}
      </div>
    </>
  );
}
