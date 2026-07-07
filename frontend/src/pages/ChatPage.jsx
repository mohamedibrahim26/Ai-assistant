import { useEffect, useRef, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatMessage from '../components/ChatMessage.jsx';
import VoiceCall from '../components/VoiceCall.jsx';
import MoodCheck from '../components/MoodCheck.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useNotifications } from '../hooks/useNotifications.js';
import { getMessages, sendMessage, getGoals, getUser, getTodayMood, updateUser } from '../api.js';
import { detectLanguage } from '../constants/languages.js';

function exportChat(messages, user) {
  const name = user?.name || 'You';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const rows = messages.map(m => {
    const who  = m.role === 'assistant' ? 'Vera' : name;
    const time = new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const bg   = m.role === 'assistant' ? '#1e293b' : '#1d4ed8';
    const align = m.role === 'assistant' ? 'left' : 'right';
    return `<div style="margin:12px 0;text-align:${align}">
      <div style="display:inline-block;max-width:70%;background:${bg};color:#f1f5f9;border-radius:16px;padding:10px 16px;font-size:14px;line-height:1.5;text-align:left">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${who} · ${time}</div>
        ${m.content.replace(/\n/g, '<br>')}
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Vera Chat — ${date}</title>
  <style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;padding:32px;max-width:800px;margin:0 auto}h1{font-size:18px;color:#94a3b8;margin-bottom:24px;border-bottom:1px solid #1e293b;padding-bottom:12px}</style>
  </head><body><h1>Vera · ${name}'s conversation · ${date}</h1>${rows}</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `vera-chat-${new Date().toISOString().split('T')[0]}.html`;
  a.click();
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 msg-animate">
      <div className="vera-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
        V
      </div>
      <div
        className="vera-bubble rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center"
      >
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

export default function ChatPage({ userId, onUserUpdate }) {
  const [messages, setMessages]   = useState([]);
  const [goals, setGoals]         = useState([]);
  const [user, setUser]           = useState(null);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [isTyping, setIsTyping]   = useState(false);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [theme, setTheme]                 = useState(() => localStorage.getItem('vera_theme') || 'dark');
  const bottomRef                         = useRef(null);
  const inputRef                          = useRef(null);

  useNotifications(goals);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vera_theme', theme);
  }, [theme]);

  const loadGoals = useCallback(async () => {
    const g = await getGoals(userId);
    setGoals(g);
  }, [userId]);

  const loadUser = useCallback(async () => {
    const u = await getUser(userId);
    setUser(u);
    onUserUpdate?.(u);
  }, [userId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const [msgs, g, u] = await Promise.all([
        getMessages(userId),
        getGoals(userId),
        getUser(userId),
      ]);
      setMessages(msgs);
      setGoals(g);
      setUser(u);
      setLoading(false);

      // Auto-detect language for users who haven't picked one yet
      if (u && !u.language) {
        const detected = detectLanguage();
        if (detected && detected !== 'en-US') {
          try {
            await updateUser(userId, { language: detected });
            setUser(prev => prev ? { ...prev, language: detected } : prev);
          } catch {}
        }
      }

      // First time: greet automatically
      if (msgs.length === 0) {
        await kickoffGreeting();
      }

      // Show mood check if not yet done today (and not already skipped this session)
      const skippedKey = `vera_mood_skipped_${userId}_${new Date().toISOString().split('T')[0]}`;
      if (!localStorage.getItem(skippedKey)) {
        try {
          const todayMood = await getTodayMood(userId);
          if (!todayMood) setShowMoodCheck(true);
        } catch {}
      }
    }
    init();
  }, [userId]);

  async function kickoffGreeting() {
    setIsTyping(true);
    try {
      const reply = await sendMessage(userId, '__vera_init__');
      setMessages(prev => [
        ...prev.filter(m => m.content !== '__vera_init__'),
        { id: Date.now(), role: 'assistant', content: reply, created_at: new Date().toISOString() }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    // Reset textarea height after send
    if (inputRef.current) { inputRef.current.style.height = '22px'; }
    setIsTyping(true);

    try {
      const reply = await sendMessage(userId, text);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: reply, created_at: new Date().toISOString() }
      ]);
      // Refresh user profile silently (onboarding may have updated)
      loadUser();
    } catch (err) {
      const content = err?.message === 'RATE_LIMIT'
        ? "I've hit my hourly limit — give me a minute and try again! ⏳"
        : "Sorry, I'm having a moment. Try again?";
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content, created_at: new Date().toISOString() }
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const visibleMessages = messages.filter(m => m.content !== '__vera_init__');

  return (
    <div className="flex w-full h-full">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`sidebar-wrap ${sidebarOpen ? 'open' : ''} sm:relative sm:transform-none sm:block`}>
        <Sidebar
          userId={userId}
          goals={goals}
          onGoalsChange={loadGoals}
          user={user}
          onUserUpdate={(updated) => {
            setUser(updated);          // keep local state in sync so trigger updates
            onUserUpdate?.(updated);   // bubble up to App
          }}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 chat-header">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors hover:bg-slate-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Vera status */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="vera-avatar w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none">V</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-sm font-semibold leading-tight">Vera</p>
              <p className="text-slate-500 text-[10px] leading-tight">always here for you</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <SearchBar userId={userId} />

          {/* Export */}
          <button
            onClick={() => exportChat(visibleMessages, user)}
            className="icon-btn flex items-center justify-center w-9 h-9 rounded-xl transition-all"
            title="Export chat history"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="icon-btn flex items-center justify-center w-9 h-9 rounded-xl transition-all text-base"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Voice call button */}
          <button
            onClick={() => setInVoiceCall(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all btn-gradient"
            title="Start voice call with Vera"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.47 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.07 6.07l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span className="hidden sm:inline">Call Vera</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 messages-bg">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="flex gap-2"><span className="dot" /><span className="dot" /><span className="dot" /></div>
            </div>
          )}

          {!loading && visibleMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 page-enter">
              <div
                className="vera-avatar vera-avatar-ring w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white select-none avatar-float"
              >
                V
              </div>
              <div>
                <p className="text-white font-semibold text-base">Starting your conversation…</p>
                <p className="text-slate-500 text-sm mt-1">Vera is warming up just for you</p>
              </div>
            </div>
          )}

          {visibleMessages.map(msg => (
            <ChatMessage key={msg.id} message={msg} userName={user?.name} />
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input area — compact pill */}
        <div className="px-4 sm:px-8 py-3 chat-footer">
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2 input-wrap transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // reliable cross-browser auto-resize
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 88) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder="Talk to Vera…"
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm resize-none focus:outline-none leading-snug overflow-y-auto"
              style={{ height: 22, minHeight: 22, maxHeight: 88 }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 btn-gradient"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-slate-600 text-center mt-1.5 select-none">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Mood check overlay */}
      {showMoodCheck && (
        <MoodCheck
          userId={userId}
          onDone={(score) => {
            setShowMoodCheck(false);
            // Remember that mood check was shown today (skip re-showing on nav)
            const skippedKey = `vera_mood_skipped_${userId}_${new Date().toISOString().split('T')[0]}`;
            localStorage.setItem(skippedKey, '1');
            if (score) {
              const labels = { 1: 'rough 😞', 2: 'meh 😕', 3: 'okay 😐', 4: 'good 🙂', 5: 'great 😄' };
              sendMessage(userId, `Just logged my mood as ${labels[score]} today.`)
                .then(reply => setMessages(prev => [
                  ...prev,
                  { id: Date.now(),     role: 'user',      content: `Mood today: ${labels[score]}`, created_at: new Date().toISOString() },
                  { id: Date.now() + 1, role: 'assistant', content: reply, created_at: new Date().toISOString() },
                ]))
                .catch(() => {});
            }
          }}
        />
      )}

      {/* Voice call overlay */}
      {inVoiceCall && (
        <VoiceCall
          userId={userId}
          userName={user?.name}
          userLang={user?.language || 'en-US'}
          onClose={() => {
            setInVoiceCall(false);
            // Reload messages so the voice conversation appears in chat too
            getMessages(userId).then(setMessages);
            loadUser();
          }}
        />
      )}
    </div>
  );
}
