import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { cacheKey, cachedQuery, invalidateRepositoryCache } from './cache';
import { requirePositiveLimit } from './query-helpers';

const COLLECTION = 'answerEvents';

function answerEventsCollection() {
  return collection(db, COLLECTION);
}

export async function createAnswerEvents({
  userId,
  username,
  mode,
  bankSource,
  results,
  quizResultId = null,
}) {
  const validResults = (results || []).filter(
    (result) => result?.questionId && result?.topic && typeof result.correct === 'boolean'
  );

  if (validResults.length === 0) return null;

  const batch = writeBatch(db);

  for (const result of validResults) {
    const eventRef = doc(answerEventsCollection());
    batch.set(eventRef, {
      userId,
      username,
      mode,
      bankSource,
      topic: result.topic,
      group: result.group || null,
      questionId: result.questionId,
      correct: result.correct,
      answeredAt: serverTimestamp(),
      quizResultId,
    });
  }

  await batch.commit();
  invalidateRepositoryCache(COLLECTION);
  return validResults;
}

export async function listMissedQuestionIds({ userId, maxEvents, ttlMs } = {}) {
  requirePositiveLimit(maxEvents, 'maxEvents');
  const queryRef = query(
    answerEventsCollection(),
    where('userId', '==', userId),
    where('correct', '==', false),
    orderBy('answeredAt', 'desc'),
    limit(maxEvents)
  );

  return cachedQuery(
    cacheKey(COLLECTION, { name: 'missedQuestionIds', userId, maxEvents }),
    async () => {
      const snapshot = await getDocs(queryRef);
      return new Set(snapshot.docs.map((eventDoc) => eventDoc.data().questionId).filter(Boolean));
    },
    ttlMs
  );
}
