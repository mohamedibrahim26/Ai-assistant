import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// Generate an invite code for a user
router.post('/:userId/generate', (req, res) => {
  const { userId } = req.params;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g. "A3K9XZ"

  db.prepare(
    'INSERT INTO invites (id, user_id, code) VALUES (?, ?, ?)'
  ).run(uuidv4(), userId, code);

  res.json({ code, link: `${req.headers.origin || 'http://localhost:5173'}/?invite=${code}` });
});

// Get all invites for a user
router.get('/:userId', (req, res) => {
  const invites = db.prepare(
    'SELECT * FROM invites WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);
  res.json({ invites });
});

// Validate an invite code (called on registration)
router.get('/validate/:code', (req, res) => {
  const invite = db.prepare('SELECT * FROM invites WHERE code = ?').get(req.params.code);
  if (!invite) return res.status(404).json({ valid: false, error: 'Invalid invite code' });
  if (invite.used_by) return res.status(400).json({ valid: false, error: 'Invite already used' });
  res.json({ valid: true, invite });
});

// Mark invite as used
router.post('/use/:code', (req, res) => {
  const { usedBy } = req.body;
  const invite = db.prepare('SELECT * FROM invites WHERE code = ?').get(req.params.code);
  if (!invite) return res.status(404).json({ error: 'Invalid invite code' });
  if (invite.used_by) return res.status(400).json({ error: 'Invite already used' });

  db.prepare(
    "UPDATE invites SET used_by = ?, used_at = datetime('now') WHERE code = ?"
  ).run(usedBy, req.params.code);

  res.json({ ok: true });
});

export default router;
