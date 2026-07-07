import { useState, useEffect } from 'react';
import { createGoal, updateGoal, deleteGoal, logProgress, getProgressLogs } from '../api.js';

const TIERS = [
  { value: 'locked_in',     label: '🔴 Locked In',     desc: 'Non-negotiable. Hold me accountable.' },
  { value: 'wanting_it',    label: '🟡 Wanting It',     desc: 'Important but life is complicated.' },
  { value: 'would_be_nice', label: '🟢 Would Be Nice',  desc: 'Low pressure. If life allows.' },
];

export default function GoalModal({ userId, goal, onClose, onSave }) {
  const [form, setForm] = useState({
    title:       goal?.title || '',
    description: goal?.description || '',
    tier:        goal?.tier || 'locked_in',
    deadline:    goal?.deadline || '',
  });
  const [loading, setLoading]       = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [progressMin, setProgressMin]   = useState('');
  const [logs, setLogs]             = useState([]);
  const [loggingProgress, setLoggingProgress] = useState(false);
  const [activeTab, setActiveTab]   = useState('edit'); // 'edit' | 'progress'

  useEffect(() => {
    if (goal?.id) {
      getProgressLogs(userId, goal.id).then(setLogs).catch(() => {});
    }
  }, [goal?.id]);

  async function handleLogProgress() {
    if (!progressNote.trim() || !goal?.id) return;
    setLoggingProgress(true);
    try {
      const log = await logProgress(userId, goal.id, progressNote.trim(), progressMin ? parseInt(progressMin) : undefined);
      setLogs(prev => [log, ...prev]);
      setProgressNote('');
      setProgressMin('');
    } catch {}
    setLoggingProgress(false);
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      if (goal) {
        await updateGoal(userId, goal.id, form);
      } else {
        await createGoal(userId, form);
      }
      await onSave();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!goal || !confirm('Remove this goal?')) return;
    setLoading(true);
    try {
      await deleteGoal(userId, goal.id);
      await onSave();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!goal) return;
    setLoading(true);
    try {
      await updateGoal(userId, goal.id, { status: 'completed' });
      await onSave();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overlay-enter"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] modal-enter">
        <div className="p-5 border-b border-slate-700 shrink-0">
          <h2 className="text-white font-semibold text-lg mb-3">
            {goal ? 'Edit Goal' : 'New Goal'}
          </h2>
          {goal && (
            <div className="flex gap-1">
              {['edit', 'progress'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  {tab === 'edit' ? 'Goal Details' : `Progress ${logs.length > 0 ? `(${logs.length})` : ''}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress tab */}
        {activeTab === 'progress' && goal && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Log today's progress</label>
              <textarea
                value={progressNote}
                onChange={e => setProgressNote(e.target.value)}
                placeholder="What did you do? How did it go?"
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number" min="1" max="480"
                  value={progressMin}
                  onChange={e => setProgressMin(e.target.value)}
                  placeholder="Minutes (optional)"
                  className="w-36 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleLogProgress}
                  disabled={!progressNote.trim() || loggingProgress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-xl font-medium transition-colors"
                >
                  {loggingProgress ? '...' : 'Log it'}
                </button>
              </div>
            </div>

            {logs.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="bg-slate-700/50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.minutes && (
                          <span className="text-[10px] text-blue-400 bg-blue-900/30 px-1.5 rounded">{log.minutes} min</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{log.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {logs.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No progress logged yet.</p>
            )}
          </div>
        )}

        {/* Edit tab */}
        {(activeTab === 'edit' || !goal) && (
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Goal</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Details (optional)</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Why does this matter to you?"
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Tier */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-2">Commitment level</label>
            <div className="space-y-2">
              {TIERS.map(t => (
                <label key={t.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.tier === t.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio" name="tier" value={t.value}
                    checked={form.tier === t.value}
                    onChange={() => set('tier', t.value)}
                    className="mt-0.5 accent-blue-500"
                  />
                  <div>
                    <p className="text-sm text-white font-medium">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Deadline (optional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="p-5 border-t border-slate-700 flex gap-2 shrink-0">
          {goal && (
            <>
              <button onClick={handleComplete} disabled={loading}
                className="px-3 py-2 text-xs text-green-400 border border-green-800 rounded-xl hover:bg-green-900/30 transition-colors">
                ✓ Done
              </button>
              <button onClick={handleDelete} disabled={loading}
                className="px-3 py-2 text-xs text-red-400 border border-red-900 rounded-xl hover:bg-red-900/30 transition-colors">
                Delete
              </button>
            </>
          )}
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading || !form.title.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-xl font-medium transition-colors">
            {loading ? '...' : goal ? 'Save' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}
