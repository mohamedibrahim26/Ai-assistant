import { useState, useRef, useEffect, useCallback } from 'react';
import { LANGUAGES, getLang } from '../constants/languages.js';
import { updateUser } from '../api.js';

const REGIONS = ['English', 'India', 'World'];

/* Detect current colour scheme -------------------------------------------- */
function useTheme() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') !== 'light'
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.getAttribute('data-theme') !== 'light')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark; // true = dark, false = light
}

export default function LanguageSelector({ userId, currentLang = 'en-US', onChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [saving, setSaving] = useState(false);
  const [pos, setPos]       = useState({ top: 0, right: 0 });

  const triggerRef = useRef(null);
  const dropRef    = useRef(null);
  const lang       = getLang(currentLang);
  const dark       = useTheme();

  // ── Palette (dark vs light) ──────────────────────────────────────────────
  const pal = dark ? {
    bg:          '#101827',
    border:      'rgba(99,102,241,0.22)',
    shadow:      '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(99,102,241,0.06)',
    divider:     'rgba(255,255,255,0.07)',
    inputBg:     'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.09)',
    inputFocus:  'rgba(99,102,241,0.4)',
    hoverBg:     'rgba(255,255,255,0.05)',
    headerLabel: '#94a3b8',
    searchIcon:  '#64748b',
    tabIdle:     { color: '#475569', border: 'rgba(255,255,255,0.07)' },
    nameMain:    '#cbd5e1',
    nameSub:     '#475569',
    footerText:  '#475569',
    footerBorder:'rgba(255,255,255,0.06)',
    noResult:    '#475569',
    triggerBg:   (open) => open ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
    triggerBdr:  (open) => open ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.25)',
    triggerClr:  '#a5b4fc',
  } : {
    bg:          '#ffffff',
    border:      'rgba(99,102,241,0.2)',
    shadow:      '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(99,102,241,0.1)',
    divider:     'rgba(0,0,0,0.07)',
    inputBg:     '#f8fafc',
    inputBorder: '#e2e8f0',
    inputFocus:  'rgba(99,102,241,0.4)',
    hoverBg:     '#f1f5f9',
    headerLabel: '#64748b',
    searchIcon:  '#94a3b8',
    tabIdle:     { color: '#94a3b8', border: '#e2e8f0' },
    nameMain:    '#1e293b',
    nameSub:     '#64748b',
    footerText:  '#94a3b8',
    footerBorder:'rgba(0,0,0,0.07)',
    noResult:    '#94a3b8',
    triggerBg:   (open) => open ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
    triggerBdr:  (open) => open ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.2)',
    triggerClr:  '#4f46e5',
  };

  // ── Dropdown position (fixed — escapes overflow:hidden) ─────────────────
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, []);

  function openDropdown() { calcPos(); setOpen(true); }

  useEffect(() => {
    if (!open) return;
    function onOut(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) { setOpen(false); setSearch(''); }
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  const filtered = LANGUAGES.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || l.name.toLowerCase().includes(q)
      || l.native.toLowerCase().includes(q)
      || l.code.toLowerCase().includes(q);
    return matchSearch && (region === 'All' || l.region === region);
  });

  async function select(code) {
    if (code === currentLang) { setOpen(false); return; }
    setSaving(true);
    try { await updateUser(userId, { language: code }); onChange?.(code); } catch {}
    setSaving(false); setOpen(false); setSearch('');
  }

  return (
    <>
      {/* ── Trigger ────────────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        title="Change language"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          fontSize: 11, fontWeight: 500, cursor: 'pointer',
          transition: 'all 0.18s ease',
          background: pal.triggerBg(open),
          border: `1px solid ${pal.triggerBdr(open)}`,
          color: pal.triggerClr,
          whiteSpace: 'nowrap', outline: 'none',
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{lang?.flag || '🌐'}</span>
        <span style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lang?.native || lang?.name || 'English'}
        </span>
        {saving
          ? <span style={{ opacity: 0.5, fontSize: 9 }}>…</span>
          : <svg width="8" height="8" viewBox="0 0 10 6" fill="currentColor"
              style={{ opacity: 0.55, flexShrink: 0,
                       transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                       transition: 'transform 0.2s ease' }}>
              <path d="M0 0l5 6 5-6z"/>
            </svg>
        }
      </button>

      {/* ── Dropdown ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed', top: pos.top, right: pos.right,
            width: 264, zIndex: 9999,
            borderRadius: 16, overflow: 'hidden',
            background: pal.bg,
            border: `1px solid ${pal.border}`,
            boxShadow: pal.shadow,
            animation: 'dropIn 0.18s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Rainbow accent bar */}
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899,#8b5cf6,#6366f1)',
            backgroundSize: '300% 100%',
            animation: 'gradientShift 4s ease infinite',
          }} />

          {/* Header */}
          <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: pal.headerLabel,
                           letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Language
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 6,
              background: 'rgba(99,102,241,0.14)', color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.22)',
            }}>
              {filtered.length}
            </span>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 12px 6px' }}>
            <div style={{ position: 'relative' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={pal.searchIcon} strokeWidth="2.5"
                style={{ position:'absolute', left:9, top:'50%',
                         transform:'translateY(-50%)', pointerEvents:'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search languages…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                  borderRadius: 10, fontSize: 11.5, outline: 'none',
                  background: pal.inputBg,
                  border: `1px solid ${pal.inputBorder}`,
                  color: pal.nameMain,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = pal.inputFocus; }}
                onBlur={e => { e.target.style.borderColor = pal.inputBorder; }}
              />
            </div>
          </div>

          {/* Region pills */}
          <div style={{ display:'flex', gap:4, padding:'2px 12px 8px', overflowX:'auto' }}>
            {['All', ...REGIONS].map(r => (
              <button key={r} onClick={() => setRegion(r)} style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px',
                borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', outline: 'none',
                transition: 'all 0.15s ease',
                ...(region === r ? {
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  border: '1px solid transparent',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                } : {
                  background: 'transparent',
                  color: pal.tabIdle.color,
                  border: `1px solid ${pal.tabIdle.border}`,
                }),
              }}>
                {r}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background: pal.divider, margin:'0 12px' }} />

          {/* List */}
          <div style={{ maxHeight: 228, overflowY:'auto', padding:'4px 0' }}>
            {filtered.length === 0 && (
              <p style={{ textAlign:'center', fontSize:11, padding:'20px 0', color: pal.noResult }}>
                No language found
              </p>
            )}
            {filtered.map(l => {
              const sel = l.code === currentLang;
              return (
                <button
                  key={l.code}
                  onClick={() => select(l.code)}
                  disabled={saving}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:9,
                    padding:'8px 12px', textAlign:'left', cursor:'pointer',
                    border:'none', outline:'none', boxSizing:'border-box',
                    transition:'background 0.1s',
                    background: sel
                      ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))'
                      : 'transparent',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = pal.hoverBg; }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = sel
                      ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))'
                      : 'transparent';
                  }}
                >
                  {/* Flag */}
                  <span style={{ fontSize:18, lineHeight:1, flexShrink:0, width:22, textAlign:'center' }}>
                    {l.flag}
                  </span>

                  {/* Names */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:12.5, lineHeight:1.3,
                                fontWeight: sel ? 600 : 400,
                                color: sel ? (dark ? '#c4b5fd' : '#4f46e5') : pal.nameMain,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.native}
                    </p>
                    <p style={{ margin:0, fontSize:10, lineHeight:1.2, color: pal.nameSub,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.name}
                    </p>
                  </div>

                  {/* Badge */}
                  <span style={{
                    fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:6, flexShrink:0,
                    letterSpacing:'0.02em',
                    ...(l.elevenlabs ? {
                      background: 'rgba(99,102,241,0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.25)',
                    } : {
                      background: dark ? 'rgba(100,116,139,0.1)' : '#f1f5f9',
                      color: pal.nameSub,
                      border: `1px solid ${dark ? 'rgba(100,116,139,0.15)' : '#e2e8f0'}`,
                    }),
                  }} title={l.elevenlabs ? 'ElevenLabs AI voice' : 'Browser voice'}>
                    {l.elevenlabs ? 'AI' : 'Std'}
                  </span>

                  {/* Checkmark */}
                  {sel && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={dark ? '#a78bfa' : '#6366f1'} strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding:'6px 12px 9px',
            borderTop: `1px solid ${pal.footerBorder}`,
            display:'flex', gap:12,
          }}>
            <span style={{ fontSize:9.5, color: pal.footerText, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2,
                             background:'rgba(99,102,241,0.3)', border:'1px solid rgba(99,102,241,0.5)' }} />
              AI = ElevenLabs voice
            </span>
            <span style={{ fontSize:9.5, color: pal.footerText, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:8, height:8, borderRadius:2,
                             background: dark ? 'rgba(100,116,139,0.2)' : '#e2e8f0',
                             border: dark ? '1px solid rgba(100,116,139,0.3)' : '1px solid #cbd5e1' }} />
              Std = device voice
            </span>
          </div>
        </div>
      )}
    </>
  );
}
