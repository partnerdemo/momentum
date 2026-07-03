import { Member } from '../types';

export function calculateStreak(member: Member): {
  currentStreak: number;
  multiplier: number;
  isActive: boolean;
} {
  const streak = member.currentStreak || 0;
  let multiplier = 1.0;

  if (streak >= 30) multiplier = 3.0;
  else if (streak >= 14) multiplier = 2.5;
  else if (streak >= 7) multiplier = 2.0;
  else if (streak >= 3) multiplier = 1.5;

  return {
    currentStreak: streak,
    multiplier: member.streakMultiplier || multiplier,
    isActive: streak > 0,
  };
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥🔥🔥';
  if (streak >= 14) return '🔥🔥';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '⚡';
  return '✨';
}

export function getStreakMessage(streak: number): string {
  if (streak >= 30) return 'LEGENDARY STREAK!';
  if (streak >= 14) return 'On Fire!';
  if (streak >= 7) return 'Great Momentum!';
  if (streak >= 3) return 'Building Steam!';
  if (streak >= 1) return 'Getting Started!';
  return 'Start a Streak!';
}
