import { useState } from 'react';
import { generateInvite } from '../api.js';

export default function InvitePanel({ userId }) {
  const [invite, setInvite]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateInvite(userId);
      setInvite(result);
    } catch {}
    setLoading(false);
  }

  function handleCopy() {
    if (!invite) return;
    navigator.clipboard.writeText(invite.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="px-4 py-3 border-t border-slate-700/50">
      <div className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Invite a Friend</div>

      {!invite ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full text-xs py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl transition-colors"
        >
          {loading ? 'Generating...' : '🔗 Generate invite link'}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="bg-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono break-all">
            Code: <span className="text-blue-400 font-bold">{invite.code}</span>
          </div>
          <button
            onClick={handleCopy}
            className="w-full text-xs py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy invite link'}
          </button>
          <button
            onClick={() => setInvite(null)}
            className="w-full text-xs py-1.5 text-slate-500 hover:text-slate-400 transition-colors"
          >
            Generate another
          </button>
        </div>
      )}
    </div>
  );
}
