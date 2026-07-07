import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// Get or create user (simple single-user for now, can add auth later)
router.post('/init', (req, res) => {
  const { userId } = req.body;

  if (userId) {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (existing) return res.json({ user: existing });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO users (id) VALUES (?)').run(id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ user });
});

// Get user profile
router.get('/:userId', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Update user profile
router.patch('/:userId', (req, res) => {
  const { name, age, profession, family_status, life_context, personality_notes, onboarded, gender, language } = req.body;

  const toVal = v => (v == null ? null : String(v));

  db.prepare(`
    UPDATE users SET
      name              = COALESCE(?, name),
      age               = COALESCE(?, age),
      profession        = COALESCE(?, profession),
      family_status     = COALESCE(?, family_status),
      life_context      = COALESCE(?, life_context),
      personality_notes = COALESCE(?, personality_notes),
      gender            = COALESCE(?, gender),
      language          = COALESCE(?, language)
    WHERE id = ?
  `).run(toVal(name), toVal(age), toVal(profession), toVal(family_status),
         toVal(life_context), toVal(personality_notes),
         toVal(gender), toVal(language),
         req.params.userId);

  if (onboarded != null) {
    db.prepare('UPDATE users SET onboarded = ? WHERE id = ?')
      .run(onboarded ? 1 : 0, req.params.userId);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  res.json({ user });
});

export default router;
