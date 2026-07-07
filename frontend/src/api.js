import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vera_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Auth ──────────────────────────────────────────────────
export const authRegister = (email, password, name) =>
  api.post('/auth/register', { email, password, name }).then(r => r.data);

export const authLogin = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const authMe = (token) =>
  axios.get('http://localhost:3001/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.data);

// ── User ──────────────────────────────────────────────────
export const initUser = (userId) =>
  api.post('/user/init', { userId }).then(r => r.data.user);

export const getUser = (userId) =>
  api.get(`/user/${userId}`).then(r => r.data.user);

export const updateUser = (userId, data) =>
  api.patch(`/user/${userId}`, data).then(r => r.data.user);

// ── Chat ──────────────────────────────────────────────────
export const getMessages = (userId) =>
  api.get(`/chat/${userId}`).then(r => r.data.messages);

export const sendMessage = (userId, message, voiceMode = false) =>
  api.post(`/chat/${userId}`, { message, voiceMode }).then(r => r.data.reply).catch(err => {
    // Surface rate-limit as a readable string the UI can display
    if (err.response?.status === 429 || err.response?.data?.error === 'RATE_LIMIT') {
      throw new Error('RATE_LIMIT');
    }
    throw err;
  });

// ── Goals ─────────────────────────────────────────────────
export const getGoals = (userId) =>
  api.get(`/goals/${userId}`).then(r => r.data.goals);

export const createGoal = (userId, data) =>
  api.post(`/goals/${userId}`, data).then(r => r.data.goal);

export const updateGoal = (userId, goalId, data) =>
  api.patch(`/goals/${userId}/${goalId}`, data).then(r => r.data.goal);

export const deleteGoal = (userId, goalId) =>
  api.delete(`/goals/${userId}/${goalId}`);

// ── Search ────────────────────────────────────────────────
export const searchMessages = (userId, q) =>
  api.get(`/chat/${userId}/search`, { params: { q } }).then(r => r.data.messages);

// ── Progress logs ─────────────────────────────────────────
export const logProgress    = (userId, goalId, note, minutes) =>
  api.post(`/progress/${userId}/${goalId}`, { note, minutes }).then(r => r.data.log);

export const getProgressLogs = (userId, goalId) =>
  api.get(`/progress/${userId}/${goalId}`).then(r => r.data.logs);

// ── Admin alerts ──────────────────────────────────────────
export const getAdminAlerts = () =>
  api.get('/admin/alerts').then(r => r.data);

// ── Mood ──────────────────────────────────────────────────
export const logMood        = (userId, score, note) =>
  api.post(`/mood/${userId}`, { score, note }).then(r => r.data);

export const getTodayMood   = (userId) =>
  api.get(`/mood/${userId}/today`).then(r => r.data.mood);

export const getWeekMoods   = (userId) =>
  api.get(`/mood/${userId}/week`).then(r => r.data.moods);

// ── Goal check-in ─────────────────────────────────────────
export const checkinGoal    = (userId, goalId) =>
  api.post(`/goals/${userId}/${goalId}/checkin`).then(r => r.data.goal);

// ── Insights ──────────────────────────────────────────────────────────────
export const getGoalSuggestions = (userId) =>
  api.get(`/insights/${userId}/suggest-goals`).then(r => r.data.suggestions);

export const getMemories = (userId) =>
  api.get(`/insights/${userId}/memories`).then(r => r.data.memories);

export const triggerWeeklyRecap = (userId) =>
  api.post(`/insights/${userId}/weekly-recap`).then(r => r.data);

export const triggerMemorySummarize = (userId) =>
  api.post(`/insights/${userId}/summarize`).then(r => r.data);

// ── Invites ────────────────────────────────────────────────────────────────
export const generateInvite = (userId) =>
  api.post(`/invites/${userId}/generate`).then(r => r.data);

export const getInvites = (userId) =>
  api.get(`/invites/${userId}`).then(r => r.data.invites);

export const validateInvite = (code) =>
  api.get(`/invites/validate/${code}`).then(r => r.data);

// -- Admin --------------------------------------------------------------------
export const getAdminStats    = ()   => api.get('/admin/stats').then(r => r.data);
export const getAdminUsers    = ()   => api.get('/admin/users').then(r => r.data.users);
export const getAdminUser     = (id) => api.get(`/admin/users/${id}`).then(r => r.data);
export const getAdminGoals    = ()   => api.get('/admin/goals').then(r => r.data.goals);
export const getAdminActivity = ()   => api.get('/admin/activity').then(r => r.data.messages);
