import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import goalRoutes from './routes/goals.js';
import adminRoutes from './routes/admin.js';
import moodRoutes from './routes/mood.js';
import authRoutes from './routes/auth.js';
import progressRoutes from './routes/progress.js';
import inviteRoutes from './routes/invites.js';
import insightRoutes from './routes/insights.js';
import ttsRoutes from './routes/tts.js';
import './scheduler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/tts', ttsRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'Vera is alive' }));

app.listen(PORT, () => {
  console.log(`Vera backend running on http://localhost:${PORT}`);
});
