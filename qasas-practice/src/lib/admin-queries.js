import { getUserDoc } from './auth';
import { ADMIN_QUIZ_RESULTS_LIMIT, getAllQuizResults } from './quiz';
import { getAllTopicStatsProfiles } from './topic-stats-firestore';

export function getAdminUserDoc(uid) {
  return getUserDoc(uid);
}

export function getAdminQuizResults() {
  return getAllQuizResults(ADMIN_QUIZ_RESULTS_LIMIT);
}

export function getAdminTopicStatsProfiles() {
  return getAllTopicStatsProfiles();
}
