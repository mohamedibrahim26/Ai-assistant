import { useState } from 'react';
import { updateUser } from '../api.js';

const FIELDS = [
  { key: 'name',          label: 'Name',            placeholder: 'Your name' },
  { key: 'age',           label: 'Age',             placeholder: 'Your age' },
  { key: 'profession',    label: 'Work',            placeholder: 'What you do' },
  { key: 'family_status', label: 'Family',          placeholder: 'Family situation' },
  { key: 'life_context',  label: 'Life context',    placeholder: 'What\'s going on in your life' },
];

export default function MemoryPanel({ user, userId, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);

  function startEdit() {
    setForm({
      name:          user?.name          || '',
      age:           user?.age           || '',
      profession:    user?.profession    || '',
      family_status: user?.family_status || '',
      life_context:  user?.life_context  || '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateUser(userId, form);
      onUpdate(updated);
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  const hasData = user && (user.name || user.profession || user.life_context);

  if (!hasData && !editing) {
    return (
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">Chat with Vera to build your profile</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vera's Memory</p>
        {!editing ? (
          <button onClick={startEdit}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 rounded border border-blue-900 hover:border-blue-700">
            Edit
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => setEditing(false)}
              className="text-[10px] text-slate-500 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="text-[10px] text-blue-400 hover:text-blue-300 ml-2 transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-[10px] text-slate-500 block mb-0.5">{f.label}</label>
              {f.key === 'life_context' ? (
                <textarea
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              ) : (
                <input
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {FIELDS.filter(f => user?.[f.key]).map(f => (
            <div key={f.key} className="flex gap-2 items-start">
              <span className="text-[10px] text-slate-500 w-16 shrink-0 pt-0.5">{f.label}</span>
              <span className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{user[f.key]}</span>
            </div>
          ))}
          {user?.personality_notes && (
            <div className="flex gap-2 items-start">
              <span className="text-[10px] text-slate-500 w-16 shrink-0 pt-0.5">Notes</span>
              <span className="text-[11px] text-slate-400 italic leading-relaxed line-clamp-2">{user.personality_notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
