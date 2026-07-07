/**
 * Supported languages for Vera.
 *
 * code    — BCP-47 tag stored in DB and sent to backend
 * name    — display name shown in the picker
 * native  — name in the language itself
 * flag    — emoji flag
 * sr      — speech recognition lang code (Web Speech API)
 * tts     — TTS model tier: 'turbo' = eleven_turbo_v2_5, 'multi' = eleven_multilingual_v2
 * region  — grouping for the picker UI
 */

/**
 * elevenlabs: true  → ElevenLabs eleven_flash_v2_5 (32 langs, ~75ms latency)
 * elevenlabs: false → Not in ElevenLabs; falls back to browser speechSynthesis
 *                     (100+ langs on Chrome/Android — sounds decent on mobile)
 *
 * ElevenLabs Flash v2.5 (32 languages):
 * English, Japanese, Chinese, German, Hindi, French, Korean, Portuguese,
 * Italian, Spanish, Indonesian, Dutch, Turkish, Filipino, Polish, Swedish,
 * Bulgarian, Romanian, Arabic, Czech, Greek, Finnish, Croatian, Malay,
 * Slovak, Danish, Tamil, Ukrainian, Russian, Hungarian, Norwegian, Vietnamese.
 *
 * NOT in ElevenLabs: Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati,
 * Punjabi, Urdu → browser TTS fallback (Google voices on Android are good).
 */
export const LANGUAGES = [
  // ── English variants ──────────────────────────────────────────────────────
  { code: 'en-IN', name: 'English (India)',      native: 'English (India)',       flag: '🇮🇳', sr: 'en-IN', elevenlabs: true,  region: 'English' },
  { code: 'en-US', name: 'English (US)',          native: 'English (US)',          flag: '🇺🇸', sr: 'en-US', elevenlabs: true,  region: 'English' },
  { code: 'en-GB', name: 'English (UK)',          native: 'English (UK)',          flag: '🇬🇧', sr: 'en-GB', elevenlabs: true,  region: 'English' },
  { code: 'en-AU', name: 'English (Australia)',  native: 'English (Australia)',   flag: '🇦🇺', sr: 'en-AU', elevenlabs: true,  region: 'English' },

  // ── Indian languages ──────────────────────────────────────────────────────
  { code: 'hi', name: 'Hindi',     native: 'हिन्दी',   flag: '🇮🇳', sr: 'hi-IN', elevenlabs: true,  region: 'India' }, // ✅ ElevenLabs Flash v2.5
  { code: 'ta', name: 'Tamil',     native: 'தமிழ்',     flag: '🇮🇳', sr: 'ta-IN', elevenlabs: true,  region: 'India' }, // ✅ ElevenLabs Flash v2.5
  { code: 'te', name: 'Telugu',    native: 'తెలుగు',    flag: '🇮🇳', sr: 'te-IN', elevenlabs: false, region: 'India' }, // 🔊 Browser TTS
  { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ',     flag: '🇮🇳', sr: 'kn-IN', elevenlabs: false, region: 'India' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം',    flag: '🇮🇳', sr: 'ml-IN', elevenlabs: false, region: 'India' },
  { code: 'bn', name: 'Bengali',   native: 'বাংলা',     flag: '🇧🇩', sr: 'bn-IN', elevenlabs: false, region: 'India' },
  { code: 'mr', name: 'Marathi',   native: 'मराठी',      flag: '🇮🇳', sr: 'mr-IN', elevenlabs: false, region: 'India' },
  { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી',   flag: '🇮🇳', sr: 'gu-IN', elevenlabs: false, region: 'India' },
  { code: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ',    flag: '🇮🇳', sr: 'pa-IN', elevenlabs: false, region: 'India' },
  { code: 'ur', name: 'Urdu',      native: 'اردو',       flag: '🇵🇰', sr: 'ur-IN', elevenlabs: false, region: 'India' },

  // ── Major world languages ─────────────────────────────────────────────────
  { code: 'es', name: 'Spanish',    native: 'Español',         flag: '🇪🇸', sr: 'es-ES', elevenlabs: true,  region: 'World' },
  { code: 'fr', name: 'French',     native: 'Français',        flag: '🇫🇷', sr: 'fr-FR', elevenlabs: true,  region: 'World' },
  { code: 'de', name: 'German',     native: 'Deutsch',         flag: '🇩🇪', sr: 'de-DE', elevenlabs: true,  region: 'World' },
  { code: 'it', name: 'Italian',    native: 'Italiano',        flag: '🇮🇹', sr: 'it-IT', elevenlabs: true,  region: 'World' },
  { code: 'pt', name: 'Portuguese', native: 'Português',       flag: '🇧🇷', sr: 'pt-BR', elevenlabs: true,  region: 'World' },
  { code: 'ru', name: 'Russian',    native: 'Русский',          flag: '🇷🇺', sr: 'ru-RU', elevenlabs: true,  region: 'World' }, // ✅ Flash v2.5 supports Russian
  { code: 'ar', name: 'Arabic',     native: 'العربية',          flag: '🇸🇦', sr: 'ar-SA', elevenlabs: true,  region: 'World' },
  { code: 'ja', name: 'Japanese',   native: '日本語',            flag: '🇯🇵', sr: 'ja-JP', elevenlabs: true,  region: 'World' },
  { code: 'ko', name: 'Korean',     native: '한국어',            flag: '🇰🇷', sr: 'ko-KR', elevenlabs: true,  region: 'World' },
  { code: 'zh', name: 'Chinese',    native: '中文',              flag: '🇨🇳', sr: 'zh-CN', elevenlabs: true,  region: 'World' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia',  flag: '🇮🇩', sr: 'id-ID', elevenlabs: true,  region: 'World' },
  { code: 'tr', name: 'Turkish',    native: 'Türkçe',           flag: '🇹🇷', sr: 'tr-TR', elevenlabs: true,  region: 'World' },
  { code: 'nl', name: 'Dutch',      native: 'Nederlands',       flag: '🇳🇱', sr: 'nl-NL', elevenlabs: true,  region: 'World' },
  { code: 'sv', name: 'Swedish',    native: 'Svenska',          flag: '🇸🇪', sr: 'sv-SE', elevenlabs: true,  region: 'World' },
  { code: 'pl', name: 'Polish',     native: 'Polski',           flag: '🇵🇱', sr: 'pl-PL', elevenlabs: true,  region: 'World' },
  { code: 'hu', name: 'Hungarian',  native: 'Magyar',           flag: '🇭🇺', sr: 'hu-HU', elevenlabs: true,  region: 'World' }, // ✅ New in Flash v2.5
  { code: 'no', name: 'Norwegian',  native: 'Norsk',            flag: '🇳🇴', sr: 'nb-NO', elevenlabs: true,  region: 'World' }, // ✅ New in Flash v2.5
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt',       flag: '🇻🇳', sr: 'vi-VN', elevenlabs: true,  region: 'World' }, // ✅ New in Flash v2.5
];

// Auto-detect from browser locale
export function detectLanguage() {
  const browserLang = navigator.language || 'en-US'; // e.g. "hi", "en-IN", "ta-IN"
  // Try exact match first
  const exact = LANGUAGES.find(l => l.sr.toLowerCase() === browserLang.toLowerCase() ||
                                     l.code.toLowerCase() === browserLang.toLowerCase());
  if (exact) return exact.code;
  // Try prefix match (e.g. "hi-IN" → "hi")
  const prefix = browserLang.split('-')[0].toLowerCase();
  const partial = LANGUAGES.find(l => l.code.split('-')[0].toLowerCase() === prefix);
  return partial?.code || 'en-US';
}

export function getLang(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === 'en-US');
}
