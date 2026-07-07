import { useState, useRef, useEffect } from 'react';
import { searchMessages } from '../api.js';

function highlight(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded">{part}</mark>
      : part
  );
}

export default function SearchBar({ userId, onJumpTo }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const msgs = await searchMessages(userId, q.trim());
        setResults(msgs);
      } catch {}
      setSearching(false);
    }, 300);
  }

  function handleClose() {
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  function handleJump(msg) {
    onJumpTo?.(msg);
    handleClose();
  }

  return (
    <>
      {/* Search icon button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-400 hover:text-white transition-all text-sm"
        title="Search conversations"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      {/* Search overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center pt-20 px-4"
             style={{ background: 'rgba(2,6,23,0.92)' }}
             onClick={e => e.target === e.currentTarget && handleClose()}>
          <div className="w-full max-w-lg">
            {/* Input */}
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 mb-3 focus-within:border-blue-500 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={handleChange}
                placeholder="Search your conversations..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
              />
              {searching && <span className="text-slate-500 text-xs">Searching...</span>}
              <button onClick={handleClose} className="text-slate-500 hover:text-white text-xs transition-colors">ESC</button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                {results.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => handleJump(msg)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        msg.role === 'assistant' ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {msg.role === 'assistant' ? 'Vera' : 'You'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {highlight(msg.content, query)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No messages found for "{query}"</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
