import { useState } from 'react';
import { updateUser, createGoal } from '../api.js';

const STEPS = [
  { id: 'welcome',  title: "Let's get to know you",   sub: "Vera remembers everything you share." },
  { id: 'life',     title: 'Your life right now',      sub: "This helps Vera understand your world." },
  { id: 'goal',     title: 'Set your first goal',      sub: "One thing you actually want to change." },
];

const TIERS = [
  { value: 'locked_in',     label: '🔴 Locked In',     desc: 'Non-negotiable. Hold me to it.' },
  { value: 'wanting_it',    label: '🟡 Wanting It',     desc: 'Important, but life happens.' },
  { value: 'would_be_nice', label: '🟢 Would Be Nice',  desc: 'No pressure, just a nudge.' },
];

export default function OnboardingPage({ user, onComplete }) {
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name:          user?.name || '',
    age:           '',
    profession:    '',
    family_status: '',
    life_context:  '',
  });
  const [goal, setGoal] = useState({ title: '', tier: 'locked_in', deadline: '' });

  const setP = (k, v) => setProfile(f => ({ ...f, [k]: v }));
  const setG = (k, v) => setGoal(f => ({ ...f, [k]: v }));

  async function handleFinish() {
    setLoading(true);
    try {
      const updatedUser = await updateUser(user.id, { ...profile, onboarded: 1 });
      if (goal.title.trim()) {
        await createGoal(user.id, goal);
      }
      onComplete(updatedUser);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function canAdvance() {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 1) return true;
    return true;
  }

  return (
    <div className="flex w-full h-full items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-blue-500' : i < step ? 'w-4 bg-blue-700' : 'w-4 bg-slate-700'
            }`} />
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">V</div>
            <div>
              <p className="text-white font-semibold text-sm">{STEPS[step].title}</p>
              <p className="text-slate-400 text-xs">{STEPS[step].sub}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Step 0: About you */}
            {step === 0 && (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">What's your name?</label>
                  <input
                    autoFocus
                    value={profile.name}
                    onChange={e => setP('name', e.target.value)}
                    placeholder="Just your first name is fine"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">How old are you? <span className="text-slate-500">(optional)</span></label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => setP('age', e.target.value)}
                    placeholder="Your age"
                    min={10} max={120}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Step 1: Life context */}
            {step === 1 && (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">What do you do for work?</label>
                  <input
                    autoFocus
                    value={profile.profession}
                    onChange={e => setP('profession', e.target.value)}
                    placeholder="e.g. Software engineer, student, freelancer..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">What's your family situation?</label>
                  <input
                    value={profile.family_status}
                    onChange={e => setP('family_status', e.target.value)}
                    placeholder="e.g. Single, married with kids, living alone..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">What's going on in your life right now?</label>
                  <textarea
                    value={profile.life_context}
                    onChange={e => setP('life_context', e.target.value)}
                    placeholder="Big changes, challenges, things you're working through..."
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </>
            )}

            {/* Step 2: First goal */}
            {step === 2 && (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">What's one thing you want to achieve?</label>
                  <input
                    autoFocus
                    value={goal.title}
                    onChange={e => setG('title', e.target.value)}
                    placeholder="e.g. Run 3x a week, read more, learn Python..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-2">How committed are you?</label>
                  <div className="space-y-2">
                    {TIERS.map(t => (
                      <label key={t.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        goal.tier === t.value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                      }`}>
                        <input type="radio" name="tier" value={t.value}
                          checked={goal.tier === t.value}
                          onChange={() => setG('tier', t.value)}
                          className="mt-0.5 accent-blue-500" />
                        <div>
                          <p className="text-sm text-white font-medium">{t.label}</p>
                          <p className="text-xs text-slate-400">{t.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Deadline <span className="text-slate-500">(optional)</span></label>
                  <input type="date" value={goal.deadline} onChange={e => setG('deadline', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <p className="text-slate-500 text-xs text-center">You can skip this and set goals later with Vera.</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 border border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-colors">
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {loading ? 'Setting up...' : "Let's go →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
