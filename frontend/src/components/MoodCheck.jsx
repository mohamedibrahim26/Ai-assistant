import { useState } from 'react';
import { logMood } from '../api.js';

const MOODS = [
  { score: 1, emoji: '😞', label: 'Rough' },
  { score: 2, emoji: '😕', label: 'Meh' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

export default function MoodCheck({ userId, onDone }) {
  const [selected, setSelected]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await logMood(userId, selected);
    } catch {}
    onDone(selected);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 overlay-enter"
         style={{ background: 'rgba(2,6,23,0.85)' }}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl modal-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">V</div>
          <p className="text-white font-medium text-sm">Good to see you 👋</p>
        </div>
        <p className="text-slate-400 text-sm mb-5 ml-11">How are you feeling today?</p>

        {/* Mood selector */}
        <div className="flex justify-between gap-2 mb-6">
          {MOODS.map(m => (
            <button
              key={m.score}
              onClick={() => setSelected(m.score)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                selected === m.score
                  ? 'border-blue-500 bg-blue-500/15 scale-105'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-slate-400">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onDone(null)}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {submitting ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
