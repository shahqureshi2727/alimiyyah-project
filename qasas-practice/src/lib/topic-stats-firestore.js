import { profileFromTopicStats } from './topic-stats';
import {
  listAllTopicStats,
  listUserTopicStats,
  recordTopicAttempt,
  recordTopicAttempts,
} from './repositories/topic-stats';
import { listUsers } from './repositories/users';

export const USER_TOPIC_STATS_LIMIT = 100;
export const ADMIN_TOPIC_STATS_LIMIT = 5000;
export const ADMIN_USERS_LIMIT = 500;

export async function recordAttempt({ userId, mode, bankSource, topic, wasCorrect }) {
  return recordTopicAttempt({ userId, mode, bankSource, topic, wasCorrect });
}

export async function recordAttempts({ userId, mode, bankSource, results }) {
  return recordTopicAttempts({ userId, mode, bankSource, results });
}

export async function getUserTopicStats(userId) {
  return listUserTopicStats({ userId, maxStats: USER_TOPIC_STATS_LIMIT });
}

export async function getUserTopicProfile(userId) {
  return profileFromTopicStats(await getUserTopicStats(userId));
}

export async function getAllTopicStatsProfiles() {
  const [stats, users] = await Promise.all([
    listAllTopicStats({ maxStats: ADMIN_TOPIC_STATS_LIMIT }),
    listUsers({ maxUsers: ADMIN_USERS_LIMIT }),
  ]);
  const usernames = new Map(users.map((userDoc) => [userDoc.id, userDoc.username]));
  const statsByUser = new Map();

  for (const stat of stats) {
    const userId = stat.userId;
    if (!userId) continue;
    if (!statsByUser.has(userId)) statsByUser.set(userId, []);
    statsByUser.get(userId).push({
      ...stat,
      userId,
    });
  }

  return Array.from(statsByUser.entries()).map(([userId, stats]) => ({
    id: userId,
    userId,
    username: usernames.get(userId) || userId,
    ...profileFromTopicStats(stats),
  }));
}
