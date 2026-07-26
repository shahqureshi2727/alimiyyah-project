import { getUserDoc } from './auth';
import { getAllQuizResults } from './quiz';
import { getAllTopicStatsProfiles } from './topic-stats-firestore';

export function getAdminUserDoc(uid) {
  return getUserDoc(uid);
}

export function getAdminQuizResults() {
  return getAllQuizResults();
}

export function getAdminTopicStatsProfiles() {
  return getAllTopicStatsProfiles();
}
