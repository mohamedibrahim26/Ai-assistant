import { useEffect, useRef } from 'react';

export function useNotifications(goals = []) {
  const scheduledRef = useRef(new Set());

  // Request permission on first use
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Schedule daily reminders for Locked In goals
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const lockedGoals = goals.filter(g => g.tier === 'locked_in' && g.status === 'active');
    if (!lockedGoals.length) return;

    // Find ms until next 9 AM
    function msUntil(hour, minute = 0) {
      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      return target.getTime() - now.getTime();
    }

    const timers = [];

    // 9 AM reminder for Locked In goals (if not already checked in today)
    lockedGoals.forEach(goal => {
      const key = `${goal.id}-9am`;
      if (scheduledRef.current.has(key)) return;
      scheduledRef.current.add(key);

      const delay = msUntil(9);
      const t = setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (goal.last_streak_date !== today) {
          new Notification('Vera · Locked In Goal 🔴', {
            body: `Don't forget: "${goal.title}" — you locked this in!`,
            icon: '/favicon.ico',
            tag: goal.id,
          });
        }
      }, delay);
      timers.push(t);
    });

    // Evening nudge at 8 PM if not checked in
    lockedGoals.forEach(goal => {
      const key = `${goal.id}-8pm`;
      if (scheduledRef.current.has(key)) return;
      scheduledRef.current.add(key);

      const delay = msUntil(20);
      const t = setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (goal.last_streak_date !== today) {
          new Notification('Vera · Evening check-in 🌙', {
            body: `Still time today: "${goal.title}" — how's it going?`,
            icon: '/favicon.ico',
            tag: `${goal.id}-pm`,
          });
        }
      }, delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [goals]);
}
