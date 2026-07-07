import { useEffect, useState } from 'react';
import {
  getWeekMoods, getGoals, getMemories, triggerMemorySummarize,
  getGoalSuggestions, createGoal
} from '../api.js';

const MOOD_LABELS = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#3b82f6' };
const TIER_LABELS = { locked_in: '🔴 Locked In', wanting_it: '🟡 Wanting It', would_be_nice: '🟢 Would Be Nice' };

// Pure SVG line chart — no external library
function MoodChart({ data }) {
  const W = 600, H = 120, PAD = { t: 10, r: 10, b: 30, l: 30 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const filled = data.filter(d => d.score !== null);
  if (filled.length === 0) return (
    <p className="text-slate-500 text-xs text-center py-8">
      No mood data yet — check in daily to see your trends.
    </p>
  );

  const xScale = (i) => PAD.l + (i / (data.length - 1)) * chartW;
  const yScale = (v) => PAD.t + chartH - ((v - 1) / 4) * chartH;

  // Build polyline points from non-null entries
  const points = data
    .map((d, i) => d.score !== null ? `${xScale(i)},${yScale(d.score)}` : null)
    .filter(Boolean)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map(v => (
        <line key={v} x1={PAD.l} x2={W - PAD.r} y1={yScale(v)} y2={yScale(v)}
          stroke={v === 3 ? '#334155' : '#1e293b'} strokeWidth={v === 3 ? 1.5 : 1}
          strokeDasharray={v === 3 ? '4 4' : undefined} />
      ))}
      {/* Y labels */}
      {[1, 3, 5].map(v => (
        <text key={v} x={PAD.l - 6} y={yScale(v) + 4} textAnchor="end"
          fill="#475569" fontSize="9">{v}</text>
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle"
          fill="#475569" fontSize="9">{d.dayLabel}</text>
      ))}
      {/* Line */}
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => d.score !== null && (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(d.score)} r="5"
            fill={MOOD_COLORS[d.score]} stroke="#0f172a" strokeWidth="1.5" />
          <title>{d.label}: {MOOD_LABELS[d.score]} ({d.score}/5)</title>
        </g>
      ))}
    </svg>
  );
}

function GoalSuggestionsCard({ userId, onGoalAdded }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [adding, setAdding]           = useState(null);
  const [error, setError]             = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const s = await getGoalSuggestions(userId);
      setSuggestions(Array.isArray(s) ? s : []);
    } catch {
      setError('Could not generate suggestions right now.');
    }
    setLoading(false);
  }

  async function handleAdd(s, i) {
    setAdding(i);
    try {
      await createGoal(userId, { title: s.title, description: s.description, tier: s.tier });
      setSuggestions(prev => prev.filter((_, idx) => idx !== i));
      onGoalAdded?.();
    } catch {}
    setAdding(null);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">💡 Goal Suggestions</h3>
        <button onClick={load} disabled={loading}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors">
          {loading ? 'Thinking...' : 'Ask Vera'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {suggestions.length === 0 && !loading && !error && (
        <p className="text-slate-500 text-xs">
          Click "Ask Vera" — she'll analyse your conversations and suggest goals tailored to your life.
        </p>
      )}

      {suggestions.map((s, i) => (
        <div key={i} className="mb-3 last:mb-0 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{s.title}</div>
              {s.description && <div className="text-slate-400 text-xs mt-0.5">{s.description}</div>}
              <div className="text-slate-500 text-xs mt-1">{TIER_LABELS[s.tier] || s.tier}</div>
            </div>
            <button onClick={() => handleAdd(s, i)} disabled={adding === i}
              className="shrink-0 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              {adding === i ? '...' : '+ Add'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MemoryCard({ userId }) {
  const [memories, setMemories]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [msg, setMsg]                 = useState('');

  useEffect(() => {
    getMemories(userId).then(setMemories).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  async function handleSummarize() {
    setSummarizing(true);
    setMsg('');
    try {
      const r = await triggerMemorySummarize(userId);
      setMsg(r.summary || 'Summary created!');
      const fresh = await getMemories(userId);
      setMemories(fresh);
    } catch {
      setMsg('Not enough new messages to summarize yet.');
    }
    setSummarizing(false);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">🧠 Long-term Memory</h3>
        <button onClick={handleSummarize} disabled={summarizing}
          className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors">
          {summarizing ? 'Summarizing...' : 'Summarize Now'}
        </button>
      </div>

      {msg && (
        <p className="text-yellow-400 text-xs mb-3 bg-yellow-400/10 rounded-lg px-3 py-2">{msg}</p>
      )}

      {loading && <p className="text-slate-500 text-xs">Loading...</p>}

      {!loading && memories.length === 0 && !msg && (
        <p className="text-slate-500 text-xs">
          No memory summaries yet. Vera auto-summarizes every Sunday, or you can trigger it manually above.
        </p>
      )}

      <div className="space-y-3">
        {memories.map(m => (
          <div key={m.id} className="p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <div className="text-slate-400 text-[10px] mb-1">
              {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}{m.message_count} messages
            </div>
            <div className="text-slate-300 text-xs leading-relaxed">{m.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage({ userId }) {
  const [moodData, setMoodData]         = useState([]);
  const [goals, setGoals]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [goalsKey, setGoalsKey]         = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [moods, g] = await Promise.all([getWeekMoods(userId), getGoals(userId)]);

        // Build 7-day array (fill gaps with null)
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key   = d.toISOString().split('T')[0];
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
          const match = (moods || []).find(m => m.created_at?.startsWith(key));
          days.push({ label, dayLabel, score: match?.score ?? null, key });
        }

        setMoodData(days);
        setGoals(g || []);
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
      setLoading(false);
    }
    load();
  }, [userId, goalsKey]);

  const scoredDays  = moodData.filter(d => d.score !== null);
  const avgMood     = scoredDays.length > 0
    ? scoredDays.reduce((s, d) => s + d.score, 0) / scoredDays.length
    : null;
  const topStreak   = goals.reduce((max, g) => Math.max(max, g.streak || 0), 0);
  const activeGoals = goals.filter(g => g.status === 'active');
  const lockedIn    = goals.filter(g => g.tier === 'locked_in' && g.status === 'active').length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-2"><span className="dot" /><span className="dot" /><span className="dot" /></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h1 className="text-white font-bold text-lg">Your Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood (7d)', value: avgMood ? `${avgMood.toFixed(1)} ${MOOD_LABELS[Math.round(avgMood)]}` : '—' },
          { label: 'Active Goals',  value: activeGoals.length },
          { label: 'Locked In',     value: lockedIn },
          { label: 'Best Streak',   value: `${topStreak} 🔥` },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="text-white text-xl font-bold">{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mood chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">Mood This Week</h3>
        <MoodChart data={moodData} />
      </div>

      {/* Goal streaks */}
      {activeGoals.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Goal Streaks</h3>
          <div className="space-y-3">
            {activeGoals.map(g => {
              const pct = Math.min(100, ((g.streak || 0) / Math.max(g.best_streak || 1, 7)) * 100);
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[60%]">{g.title}</span>
                    <span className="text-orange-400 font-medium">🔥 {g.streak || 0} days</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Best: {g.best_streak || 0} days</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal suggestions */}
      <GoalSuggestionsCard userId={userId} onGoalAdded={() => setGoalsKey(k => k + 1)} />

      {/* Long-term memory */}
      <MemoryCard userId={userId} />
    </div>
  );
}
