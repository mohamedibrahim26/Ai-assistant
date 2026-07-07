import { useEffect, useState, useRef } from 'react';
import { useVoice, VOICE_PERSONAS } from '../hooks/useVoice.js';
import { sendMessage } from '../api.js';
import { getLang } from '../constants/languages.js';

// ── Waveform bars ─────────────────────────────────────────────────────────────
function Waveform({ volume, active, color }) {
  const bars = 14;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const center = bars / 2;
        const dist   = Math.abs(i - center + 0.5) / center;
        const shape  = 1 - dist * 0.45;
        const height = active
          ? 4 + 40 * volume * shape * (0.5 + Math.random() * 0.5)
          : 4 + 8 * shape;
        return (
          <div key={i} className="rounded-full"
            style={{
              width: 3,
              height: `${Math.max(4, height)}px`,
              background: active ? color : '#1e293b',
              opacity: active ? 0.9 : 0.25,
              transition: active ? 'height 70ms ease' : 'height 500ms ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Call timer ────────────────────────────────────────────────────────────────
function CallTimer({ running }) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return <span className="text-slate-500 text-sm tabular-nums">{mm}:{ss}</span>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function VoiceCall({ userId, userName, userLang = 'en-US', onClose }) {
  const {
    isListening, isSpeaking, transcript, supported, volume,
    personaId, persona, setPersonaId,
    startListening, stopListening, speak, cancelSpeech,
  } = useVoice();

  const [phase,        setPhase]        = useState('thinking'); // thinking | speaking | listening | idle | recovering
  const [callStarted,  setCallStarted]  = useState(false);
  const [showPersonas, setShowPersonas] = useState(false);
  const [lastText,     setLastText]     = useState('');

  // Refs — avoid stale closures
  const isEndedRef     = useRef(false);
  const isThinkingRef  = useRef(false);
  const timerRef       = useRef(null);
  const onResultRef    = useRef(null);
  const autoListenRef  = useRef(null);
  const listenActiveRef = useRef(null); // wrapper that auto-restarts on timeout
  const failCountRef   = useRef(0);    // consecutive recognition failures — drives backoff

  // Speech recognition language derived from user's language pref
  // Always fall back to English so recognition never fails silently on language mismatch
  const srLang = getLang(userLang)?.sr || 'en-US';

  // ── Start listening with auto-restart + exponential backoff ─────────────
  listenActiveRef.current = () => {
    if (isEndedRef.current || isThinkingRef.current) return;
    setPhase('listening');
    startListening(
      onResultRef.current,
      srLang,
      (gotResult, errorType) => {
        if (gotResult) {
          failCountRef.current = 0;
          return;
        }
        if (isEndedRef.current || isThinkingRef.current) return;

        failCountRef.current++;

        // After 10 consecutive failures Chrome's speech API is in a bad state.
        // Enter 'recovering' phase for 10 seconds — a full pause lets Chrome reset
        // its internal session and usually restores recognition completely.
        if (failCountRef.current >= 10) {
          setPhase('recovering');
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            if (!isEndedRef.current) {
              failCountRef.current = 0;
              listenActiveRef.current?.();
            }
          }, 10000);
          return;
        }

        // Backoff ladder: network errors need a longer pause;
        // frequent no-speech cycles get progressively longer delays
        const delay = errorType === 'network'  ? 5000
                    : failCountRef.current > 5 ? 3000
                    : failCountRef.current > 2 ? 1000
                    : 300;

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          listenActiveRef.current?.();
        }, delay);
      }
    );
  };

  // ── Auto-listen after Vera finishes speaking ──────────────────────────────
  // 1200ms gap: lets TTS audio fully decay before mic opens (prevents echo capture)
  autoListenRef.current = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isEndedRef.current) return;
      listenActiveRef.current?.();
    }, 1200);
  };

  // ── Handle user speech ────────────────────────────────────────────────────
  onResultRef.current = async (text) => {
    // Skip empty, very short (noise), or duplicate transcripts
    if (!text?.trim() || text.trim().length < 2 || isThinkingRef.current || isEndedRef.current) return;
    failCountRef.current = 0; // successful speech — reset backoff
    isThinkingRef.current = true;
    stopListening();
    setPhase('thinking');
    setLastText(text);

    try {
      const reply = await sendMessage(userId, text, true); // voiceMode = true
      if (isEndedRef.current) { isThinkingRef.current = false; return; }
      setLastText('');
      setPhase('speaking');
      speak(reply, () => {
        isThinkingRef.current = false;
        if (!isEndedRef.current) autoListenRef.current();
      }, userId);
    } catch {
      isThinkingRef.current = false;
      if (!isEndedRef.current) {
        speak("Hey, I missed that — say it again?", () => {
          if (!isEndedRef.current) autoListenRef.current();
        }, userId);
      }
    }
  };

  // ── Greeting on open ──────────────────────────────────────────────────────
  useEffect(() => {
    isEndedRef.current  = false;
    isThinkingRef.current = false;

    async function greet() {
      try {
        const reply = await sendMessage(
          userId,
          '__voice_greet__ Say a warm, personal greeting in ONE short sentence. Like answering a call from a close friend. Very natural, no fanfare.',
          true
        );
        if (isEndedRef.current) return;
        setCallStarted(true);
        setPhase('speaking');
        speak(reply, () => {
          if (!isEndedRef.current) autoListenRef.current();
        }, userId);
      } catch {
        // If greeting fails, just start listening immediately
        setCallStarted(true);
        if (!isEndedRef.current) {
          listenActiveRef.current?.();
        }
      }
    }
    greet();

    return () => {
      isEndedRef.current = true;
      cancelSpeech();
      stopListening();
      clearTimeout(timerRef.current);
    };
  }, []);

  // ── Tap avatar / mic to interrupt or start ───────────────────────────────
  function handleMicTap() {
    if (phase === 'speaking' || phase === 'thinking') {
      // Interrupt Vera and start listening immediately
      cancelSpeech();
      clearTimeout(timerRef.current);
      isThinkingRef.current = false;
      listenActiveRef.current?.();
    } else if (phase === 'listening') {
      // User manually pauses listening
      stopListening();
      clearTimeout(timerRef.current);
      setPhase('idle');
    } else {
      // Idle → start listening
      listenActiveRef.current?.();
    }
  }

  // ── End call ──────────────────────────────────────────────────────────────
  function handleEnd() {
    isEndedRef.current = true;
    cancelSpeech();
    stopListening();
    clearTimeout(timerRef.current);
    onClose();
  }

  if (!supported) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-sm text-center border border-slate-700">
          <p className="text-4xl mb-4">🎙️</p>
          <p className="text-white font-semibold mb-2">Voice not supported</p>
          <p className="text-slate-400 text-sm mb-5">Use Chrome or Edge for voice calls.</p>
          <button onClick={onClose} className="bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium">Got it</button>
        </div>
      </div>
    );
  }

  // Phase-based UI values
  const isActive   = phase === 'speaking' || phase === 'listening'; // recovering is intentionally inactive
  const waveVolume = phase === 'speaking' ? 0.5 + Math.random() * 0.4
                   : phase === 'listening' ? volume
                   : 0;
  const waveColor  = phase === 'listening' ? '#22c55e' : persona.color;
  const ringColor  = phase === 'listening' ? '#22c55e'
                   : phase === 'speaking'  ? persona.color
                   : '#334155';

  const statusLines = {
    thinking:   { text: 'Vera is thinking...',  sub: '',                     color: '#94a3b8' },
    speaking:   { text: 'Vera is speaking',      sub: 'Tap mic to interrupt', color: persona.color },
    listening:  { text: 'Listening...',           sub: 'Speak now',            color: '#22c55e' },
    idle:       { text: 'Tap mic to speak',       sub: 'Vera is ready',        color: '#475569' },
    recovering: { text: 'Reconnecting mic...',    sub: 'Just a moment',        color: '#f59e0b' },
  };
  const status = statusLines[phase] || statusLines.idle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overlay-enter"
      style={{ background: 'rgba(2,6,23,0.97)' }}>
      <div className="flex flex-col items-center w-full max-w-xs px-6 py-8 relative modal-enter">

        {/* Persona picker */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowPersonas(v => !v)}
            className="text-slate-600 hover:text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-600 transition-colors flex items-center gap-1.5"
          >
            <span>{persona.emoji}</span><span>{persona.name}</span><span className="opacity-40">▾</span>
          </button>
          {showPersonas && (
            <div className="absolute right-0 top-10 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl min-w-[175px] z-10">
              {VOICE_PERSONAS.map(p => (
                <button key={p.id} onClick={() => { setPersonaId(p.id); setShowPersonas(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                    p.id === personaId ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
                  }`}>
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <p className="font-medium text-xs">{p.name}</p>
                    <p className="text-slate-600 text-xs">{p.description}</p>
                  </div>
                  {p.id === personaId && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="mb-10">
          <CallTimer running={callStarted} />
        </div>

        {/* Avatar — tap to interrupt */}
        <button onClick={handleMicTap}
          className="relative flex items-center justify-center mb-10 focus:outline-none"
          title={phase === 'speaking' ? 'Tap to interrupt' : phase === 'listening' ? 'Tap to stop' : 'Tap to speak'}
        >
          {/* Outer ring */}
          <div className="absolute rounded-full transition-all duration-500"
            style={{
              width: 168, height: 168,
              border: `2px solid ${ringColor}30`,
              background: `${ringColor}08`,
              animation: isActive ? 'callRing 2s ease-in-out infinite' : 'none',
            }}
          />
          {/* Middle ring */}
          <div className="absolute rounded-full transition-all duration-500"
            style={{
              width: 136, height: 136,
              border: `1.5px solid ${ringColor}50`,
              background: `${ringColor}10`,
              animation: isActive ? 'callRing 2s ease-in-out infinite 0.3s' : 'none',
            }}
          />
          {/* Avatar — floats gently when idle */}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl relative z-10 select-none ${phase === 'idle' ? 'avatar-float' : ''}`}
            style={{ background: `linear-gradient(135deg, ${persona.color}dd, ${persona.color}66)` }}
          >
            V
          </div>
          {/* Thinking dots overlay */}
          {phase === 'thinking' && (
            <div className="absolute inset-0 flex items-center justify-center z-20 rounded-full"
              style={{ background: 'rgba(2,6,23,0.6)' }}>
              <div className="flex gap-1.5">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
        </button>

        {/* Name */}
        <p className="text-white text-xl font-bold mb-1">Vera · {persona.name}</p>

        {/* Status */}
        <div className="h-10 flex flex-col items-center justify-center mb-4">
          <p className="text-sm font-medium transition-colors" style={{ color: status.color }}>
            {status.text}
          </p>
          {status.sub && (
            <p className="text-xs text-slate-700 mt-0.5">{status.sub}</p>
          )}
        </div>

        {/* Waveform */}
        <div className="w-full mb-4">
          <Waveform volume={waveVolume} active={isActive} color={waveColor} />
        </div>

        {/* What user said / Vera's last heard text */}
        <div className="h-8 flex items-center justify-center mb-8 px-2">
          {(transcript || lastText) && (
            <p className="text-slate-600 text-xs text-center italic line-clamp-2">
              "{transcript || lastText}"
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-10">
          {/* Mic / interrupt button */}
          <button onClick={handleMicTap}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              phase === 'listening'
                ? 'bg-green-500 scale-105 shadow-green-500/40'
                : phase === 'speaking'
                ? 'bg-slate-700 hover:bg-amber-600/80 border border-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}
            title={phase === 'speaking' ? 'Interrupt Vera' : 'Speak'}
          >
            {phase === 'listening' ? (
              // Stop icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : phase === 'speaking' ? (
              // Interrupt icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              // Mic icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {/* End call */}
          <button onClick={handleEnd}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all shadow-lg shadow-red-600/25"
            title="End call"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M13.73 5.34A10 10 0 0 0 2.73 12a1 1 0 0 0 .29.71l2 2a1 1 0 0 0 1.42 0l2.12-2.12a1 1 0 0 0 0-1.42l-1.15-1.15A7.93 7.93 0 0 1 11 8.5V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v.5a7.93 7.93 0 0 1 3.59 1.52l-1.15 1.15a1 1 0 0 0 0 1.42l2.12 2.12a1 1 0 0 0 1.42 0l2-2a1 1 0 0 0 .29-.71 10 10 0 0 0-9.54-6.66z"/>
            </svg>
          </button>
        </div>

        {/* Hint */}
        <p className="text-slate-800 text-xs mt-8 text-center">
          {phase === 'listening'  ? 'Vera is listening — just talk' :
           phase === 'speaking'   ? 'Tap mic to cut in and talk' :
           phase === 'thinking'   ? 'Vera is thinking...' :
           phase === 'recovering' ? 'Mic reconnecting — back in a moment' :
           'Tap mic or Vera to start speaking'}
        </p>
      </div>
    </div>
  );
}
