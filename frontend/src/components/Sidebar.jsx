import { useState } from 'react';
import GoalModal from './GoalModal.jsx';
import MemoryPanel from './MemoryPanel.jsx';
import InvitePanel from './InvitePanel.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import { checkinGoal, updateUser } from '../api.js';

const TIER_CONFIG = {
  locked_in:     { label: 'Locked In',    cls: 'goal-locked',   text: 'text-red-400',    bg: 'bg-red-500/10',    icon: '🔴' },
  wanting_it:    { label: 'Wanting It',   cls: 'goal-wanting',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  icon: '🟡' },
  would_be_nice: { label: 'Would Be Nice',cls: 'goal-nice',     text: 'text-emerald-400',bg: 'bg-emerald-500/10',icon: '🟢' },
};

export default function Sidebar({ userId, goals, onGoalsChange, user, onUserUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [checkingIn, setCheckingIn] = useState(null);

  async function handleCheckin(e, goalId) {
    e.stopPropagation();
    setCheckingIn(goalId);
    try {
      await checkinGoal(userId, goalId);
      await onGoalsChange();
    } catch {}
    setCheckingIn(null);
  }

  const activeGoals    = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const today = new Date().toISOString().split('T')[0];

  return (
    <aside className="w-72 flex flex-col h-full shrink-0 sidebar-bg">

      {/* ── Gradient header ─────────────────────────── */}
      <div
        className="relative px-5 pt-5 pb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.12)',
        }}
      >
        {/* Ambient glow blob — pulses softly */}
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none glow-blob"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)' }}
        />

        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar with glow ring */}
          <div className="relative">
            <div className="vera-avatar vera-avatar-ring w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base select-none">
              V
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <p className="font-semibold gradient-text text-base leading-tight">Vera</p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">Life Companion</p>
          </div>
        </div>

        {user?.name && (
          <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#a5b4fc',
              }}
            >
              👋 Hi, {user.name}
            </div>
            {/* Language picker */}
            <LanguageSelector
              userId={userId}
              currentLang={user.language || 'en-US'}
              onChange={(code) => onUserUpdate?.({ ...user, language: code })}
            />
          </div>
        )}
      </div>

      {/* ── Goals section ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            My Goals
          </h2>
          <button
            onClick={() => { setEditingGoal(null); setShowModal(true); }}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all text-slate-400 hover:text-white"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
            title="Add goal"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {activeGoals.length === 0 && (
          <div className="text-center py-10">
            <div
              className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              🎯
            </div>
            <p className="text-slate-500 text-sm">No goals yet.</p>
            <p className="text-slate-600 text-xs mt-1">Tell Vera what you want to achieve.</p>
          </div>
        )}

        {/* Active goals */}
        <div className="space-y-2.5">
          {activeGoals.map((goal, i) => {
            const cfg     = TIER_CONFIG[goal.tier] || TIER_CONFIG.wanting_it;
            const doneToday = goal.last_streak_date === today;
            return (
              <div
                key={goal.id}
                onClick={() => { setEditingGoal(goal); setShowModal(true); }}
                className={`relative rounded-xl p-3 cursor-pointer ${cfg.cls} goal-stagger`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 select-none shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-sm text-white font-medium truncate leading-snug">{goal.title}</p>
                      {goal.streak > 0 && (
                        <span className="text-xs text-orange-400 font-bold shrink-0 ml-1">🔥{goal.streak}</span>
                      )}
                    </div>

                    {/* Deadline */}
                    {goal.deadline && (
                      <p className="text-[11px] text-slate-500 mb-1">
                        Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold ${cfg.text} px-1.5 py-0.5 rounded-md ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                      <button
                        onClick={e => handleCheckin(e, goal.id)}
                        disabled={checkingIn === goal.id || doneToday}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all shrink-0 ${
                          doneToday
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-default'
                            : 'text-slate-300 bg-slate-700/50 hover:bg-slate-600/60 border border-transparent'
                        } disabled:opacity-50`}
                        title="Mark done today"
                      >
                        {doneToday ? '✓ done' : '+ done'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>Completed</span>
              <span className="text-emerald-500">✓</span>
            </h3>
            <div className="space-y-1.5">
              {completedGoals.map(goal => (
                <div
                  key={goal.id}
                  className="rounded-lg px-3 py-2 opacity-50"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-xs text-slate-500 line-through truncate">{goal.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Memory & Invite panels ────────────────────── */}
      <MemoryPanel user={user} userId={userId} onUpdate={onUserUpdate || (() => {})} />
      {userId && <InvitePanel userId={userId} />}

      {showModal && (
        <GoalModal
          userId={userId}
          goal={editingGoal}
          onClose={() => setShowModal(false)}
          onSave={onGoalsChange}
        />
      )}
    </aside>
  );
}
