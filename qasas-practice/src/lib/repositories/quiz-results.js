import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { cacheKey, cachedQuery, invalidateRepositoryCache } from './cache';
import { requirePositiveLimit, timestampToDate } from './query-helpers';

const COLLECTION = 'quizResults';

function quizResultsCollection() {
  return collection(db, COLLECTION);
}

function mapQuizResult(resultDoc) {
  const data = resultDoc.data();
  return {
    id: resultDoc.id,
    ...data,
    completedAt: timestampToDate(data.completedAt) || new Date(),
  };
}

async function runQuizResultsQuery(keyParams, queryRef, ttlMs) {
  return cachedQuery(
    cacheKey(COLLECTION, keyParams),
    async () => {
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map(mapQuizResult);
    },
    ttlMs
  );
}

export async function createQuizResult({
  userId,
  username,
  mode,
  bankSource,
  score,
  total,
  durationSeconds,
}) {
  const docRef = await addDoc(quizResultsCollection(), {
    userId,
    username,
    mode,
    bankSource,
    score,
    total,
    durationSeconds,
    completedAt: serverTimestamp(),
  });
  invalidateRepositoryCache(COLLECTION);
  return docRef.id;
}

export async function listRecentQuizResults({ userId, maxResults, ttlMs } = {}) {
  requirePositiveLimit(maxResults, 'maxResults');
  const queryRef = query(
    quizResultsCollection(),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(maxResults)
  );

  return runQuizResultsQuery({ name: 'recent', userId, maxResults }, queryRef, ttlMs);
}

export async function listLeaderboardResults({
  mode,
  bankSource,
  allTime = false,
  since = null,
  maxResults,
  ttlMs,
} = {}) {
  requirePositiveLimit(maxResults, 'maxResults');
  const constraints = [
    where('mode', '==', mode),
    where('bankSource', '==', bankSource),
  ];

  if (!allTime && since) {
    constraints.push(where('completedAt', '>=', Timestamp.fromDate(since)));
    constraints.push(orderBy('completedAt', 'desc'));
  }

  constraints.push(orderBy('score', 'desc'));
  constraints.push(orderBy('durationSeconds', 'asc'));

  if (allTime) {
    constraints.push(orderBy('completedAt', 'desc'));
  }

  constraints.push(limit(maxResults));

  const queryRef = query(quizResultsCollection(), ...constraints);
  return runQuizResultsQuery(
    {
      name: 'leaderboard',
      mode,
      bankSource,
      allTime,
      since,
      maxResults,
    },
    queryRef,
    ttlMs
  );
}

export async function listUserBestQuizResult({
  userId,
  mode,
  bankSource,
  allTime = false,
  since = null,
  maxResults,
  ttlMs,
} = {}) {
  requirePositiveLimit(maxResults, 'maxResults');
  const constraints = [
    where('userId', '==', userId),
    where('mode', '==', mode),
    where('bankSource', '==', bankSource),
  ];

  if (!allTime && since) {
    constraints.push(where('completedAt', '>=', Timestamp.fromDate(since)));
    constraints.push(orderBy('completedAt', 'desc'));
  }

  constraints.push(orderBy('score', 'desc'));
  constraints.push(orderBy('durationSeconds', 'asc'));

  if (allTime) {
    constraints.push(orderBy('completedAt', 'desc'));
  }

  constraints.push(limit(maxResults));

  const queryRef = query(quizResultsCollection(), ...constraints);
  const results = await runQuizResultsQuery(
    {
      name: 'userBest',
      userId,
      mode,
      bankSource,
      allTime,
      since,
      maxResults,
    },
    queryRef,
    ttlMs
  );

  return results[0] || null;
}

export async function listAdminQuizResults({ maxResults, ttlMs } = {}) {
  requirePositiveLimit(maxResults, 'maxResults');
  const queryRef = query(quizResultsCollection(), orderBy('completedAt', 'desc'), limit(maxResults));
  return runQuizResultsQuery({ name: 'adminRecent', maxResults }, queryRef, ttlMs);
}
