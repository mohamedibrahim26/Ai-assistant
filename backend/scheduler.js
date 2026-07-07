import cron from 'node-cron';
import db from './db.js';
import { chat, summarizeMemory, generateWeeklyRecap } from './ai/vera.js';

const CHECKIN_PROMPT =
  `It's a new day. Send the user a brief, warm morning check-in in 1-2 sentences. ` +
  `Reference something specific from their life or goals if you know it. ` +
  `Ask one light question to open the day. Keep it natural — like a friend texting good morning.`;

// ── Helper: get all recently active users ─────────────────────────────────
function getActiveUsers() {
  return db.prepare(`
    SELECT DISTINCT u.id FROM users u
    JOIN messages m ON m.user_id = u.id
    WHERE m.created_at >= datetime('now', '-30 days')
  `).all();
}

// ── Daily check-in at 8:00 AM ─────────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('[Vera] Running daily check-ins...');
  const users = getActiveUsers();

  for (const { id: userId } of users) {
    try {
      const alreadySent = db.prepare(`
        SELECT id FROM messages
        WHERE user_id = ?
          AND role = 'assistant'
          AND date(created_at) = date('now')
        LIMIT 1
      `).get(userId);

      if (alreadySent) continue;

      await chat(userId, `__daily_checkin__ ${CHECKIN_PROMPT}`, true);
      console.log(`[Vera] Check-in sent to user ${userId}`);
    } catch (e) {
      console.error(`[Vera] Check-in failed for ${userId}:`, e.message);
    }
  }
});

// ── Weekly recap — Sundays at 7:00 PM ────────────────────────────────────
cron.schedule('0 19 * * 0', async () => {
  console.log('[Vera] Running weekly recaps...');
  const users = getActiveUsers();

  for (const { id: userId } of users) {
    try {
      await generateWeeklyRecap(userId);
      console.log(`[Vera] Weekly recap sent to user ${userId}`);
    } catch (e) {
      console.error(`[Vera] Weekly recap failed for ${userId}:`, e.message);
    }
  }
});

// ── Memory summarization — Sundays at midnight ────────────────────────────
cron.schedule('0 0 * * 0', async () => {
  console.log('[Vera] Running memory summarization...');
  const users = getActiveUsers();

  for (const { id: userId } of users) {
    try {
      await summarizeMemory(userId);
    } catch (e) {
      console.error(`[Vera] Memory summarization failed for ${userId}:`, e.message);
    }
  }
});

console.log('[Vera] Scheduler running — daily check-ins 8AM, weekly recap Sun 7PM, memory summarization Sun midnight');
