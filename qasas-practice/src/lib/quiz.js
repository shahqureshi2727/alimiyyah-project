// Quiz submission utilities for Firestore
//
// HONEST NOTE ON CLIENT-SIDE CHEATING:
// Since quiz results are written to Firestore directly from the client, a technically
// sophisticated student *could* craft a fake result document via DevTools and land at
// the top of the leaderboard. Firestore rules can prevent them from writing to another
// student's account, but not from lying about their own score. For a small mosque class
// this is almost certainly a non-issue socially, but it is a real limit of the
// architecture. A future pass could add a Cloud Function that validates submissions
// server-side if it ever becomes necessary.
//
// DO NOT add fake "anti-cheat" measures (like obfuscating the write payload) that would
// give a false sense of protection.

import { recordAttempts } from './topic-stats-firestore';
import { createAnswerEvents } from './repositories/answer-events';
import {
  createQuizResult,
  listAdminQuizResults,
  listLeaderboardResults,
  listRecentQuizResults,
  listUserBestQuizResult,
} from './repositories/quiz-results';

export const ADMIN_QUIZ_RESULTS_LIMIT = 500;

/**
 * Submit a quiz result to Firestore.
 * @param {Object} params
 * @param {string} params.userId - The user's UID
 * @param {string} params.username - The user's display name (denormalized for leaderboard)
 * @param {string} params.mode - One of the configured quiz modes
 * @param {string} params.bankSource - The content bank source
 * @param {number} params.score - Number correct
 * @param {number} params.total - Total questions in the session
 * @param {number} params.durationSeconds - Total quiz duration in seconds
 * @returns {Promise<string>} The document ID of the created result
 */
export async function submitQuizResult({
  userId,
  username,
  mode,
  bankSource,
  score,
  total = 10,
  durationSeconds,
}) {
  return createQuizResult({
    userId,
    username,
    mode,
    bankSource,
    score,
    total,
    durationSeconds,
  });
}

/**
 * Submit per-question answer events and update the user's topic stats.
 * This mirrors the quiz-result honesty model: client-written data is fine for
 * class use; a future Cloud Function on answerEvents is the upgrade path if
 * server-side integrity becomes necessary.
 */
export async function submitAnswerEvents({
  userId,
  username,
  mode,
  bankSource,
  results,
  quizResultId = null,
}) {
  const validResults = await createAnswerEvents({
    userId,
    username,
    mode,
    bankSource,
    results,
    quizResultId,
  });

  if (!validResults) return null;
  return recordAttempts({ userId, mode, bankSource, results: validResults });
}

/**
 * Get a user's recent quiz results.
 * @param {string} userId - The user's UID
 * @param {number} maxResults - Maximum number of results to return (default 5)
 * @returns {Promise<Array>} Array of quiz result objects
 */
export async function getUserRecentResults(userId, maxResults = 5) {
  return listRecentQuizResults({ userId, maxResults });
}

/**
 * Get the start of the current week (Monday 00:00 local time).
 * @returns {Date}
 */
export function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want Monday as start of week
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get leaderboard results for a specific mode.
 * @param {Object} params
 * @param {string} params.mode - One of: "irab", "nounFeatures", "roles", "vocab"
 * @param {boolean} params.allTime - If true, get all-time results. If false, get this week's.
 * @param {string} params.bankSource - The bank source to filter by (default "qasas")
 * @param {number} params.maxResults - Maximum results to return (default 20)
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export async function getLeaderboard({
  mode,
  allTime = false,
  bankSource = 'qasas',
  maxResults = 20,
}) {
  if (allTime) {
    return listLeaderboardResults({ mode, bankSource, allTime, maxResults });
  } else {
    const weekStart = getWeekStart();
    return listLeaderboardResults({ mode, bankSource, since: weekStart, maxResults });
  }
}

/**
 * Get the current user's best result for a mode (for showing rank outside top 20).
 * @param {Object} params
 * @param {string} params.userId - The user's UID
 * @param {string} params.mode - The quiz mode
 * @param {boolean} params.allTime - Whether to get all-time or this week's result
 * @param {string} params.bankSource - The bank source (default "qasas")
 * @returns {Promise<Object|null>} The user's best result or null
 */
export async function getUserBestResult({ userId, mode, allTime = false, bankSource = 'qasas' }) {
  if (allTime) {
    return listUserBestQuizResult({ userId, mode, bankSource, allTime, maxResults: 1 });
  } else {
    const weekStart = getWeekStart();
    return listUserBestQuizResult({ userId, mode, bankSource, since: weekStart, maxResults: 1 });
  }
}

/**
 * Get all quiz results (for admin stats).
 * @returns {Promise<Array>} Array of all quiz results
 */
export async function getAllQuizResults(maxResults) {
  return listAdminQuizResults({ maxResults });
}

/**
 * Format a duration in seconds to a human-readable string.
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string like "1 min 43 sec" or "45 sec"
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (mins === 0) {
    return `${secs} sec`;
  }

  return `${mins} min ${secs} sec`;
}

/**
 * Format a relative timestamp (e.g., "2 hours ago", "yesterday").
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  }

  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }

  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }

  if (diffDay === 1) {
    return 'yesterday';
  }

  if (diffDay < 7) {
    return `${diffDay} days ago`;
  }

  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  const months = Math.floor(diffDay / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/**
 * Format duration for leaderboard display (mm:ss format).
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string like "1:43" or "0:45"
 */
export function formatLeaderboardTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
