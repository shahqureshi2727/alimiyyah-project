import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firestore';
import {
  categoryForTopic,
  nextTopicStat,
  topicStatDocId,
} from '../topic-stats';
import { cacheKey, cachedQuery, invalidateRepositoryCache } from './cache';
import { requirePositiveLimit } from './query-helpers';

const USERS_COLLECTION = 'users';
const SUBCOLLECTION = 'topicStats';

function userTopicStatsCollection(userId) {
  return collection(db, USERS_COLLECTION, userId, SUBCOLLECTION);
}

function mapTopicStat(statDoc) {
  return {
    id: statDoc.id,
    ...statDoc.data(),
  };
}

export async function recordTopicAttempt({ userId, mode, bankSource, topic, wasCorrect }) {
  const category = categoryForTopic(topic, mode, bankSource);
  const answeredAt = new Date();
  const statRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    SUBCOLLECTION,
    topicStatDocId(category, topic)
  );

  return runTransaction(db, async (transaction) => {
    const statSnap = await transaction.get(statRef);
    const existing = statSnap.exists() ? statSnap.data() : null;
    const next = nextTopicStat({
      userId,
      category,
      subtopic: topic,
      existing,
      wasCorrect,
      lastAttempted: serverTimestamp(),
      answeredAt,
    });

    transaction.set(statRef, next, { merge: true });
    invalidateRepositoryCache(SUBCOLLECTION);
    return {
      ...next,
      lastAttempted: null,
    };
  });
}

export async function recordTopicAttempts({ userId, mode, bankSource, results }) {
  const validResults = (results || []).filter(
    (result) => result?.topic && typeof result.correct === 'boolean'
  );

  return Promise.all(
    validResults.map((result) =>
      recordTopicAttempt({
        userId,
        mode,
        bankSource,
        topic: result.topic,
        wasCorrect: result.correct,
      })
    )
  );
}

export async function listUserTopicStats({ userId, maxStats, ttlMs } = {}) {
  requirePositiveLimit(maxStats, 'maxStats');
  const queryRef = query(
    userTopicStatsCollection(userId),
    orderBy('category', 'asc'),
    orderBy('subtopic', 'asc'),
    limit(maxStats)
  );

  return cachedQuery(
    cacheKey(SUBCOLLECTION, { name: 'userStats', userId, maxStats }),
    async () => {
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map(mapTopicStat);
    },
    ttlMs
  );
}

export async function listAllTopicStats({ maxStats, ttlMs } = {}) {
  requirePositiveLimit(maxStats, 'maxStats');
  const queryRef = query(
    collectionGroup(db, SUBCOLLECTION),
    orderBy('userId', 'asc'),
    orderBy('category', 'asc'),
    orderBy('subtopic', 'asc'),
    limit(maxStats)
  );

  return cachedQuery(
    cacheKey(SUBCOLLECTION, { name: 'allStats', maxStats }),
    async () => {
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map((statDoc) => {
        const stat = statDoc.data();
        return {
          id: statDoc.id,
          ...stat,
          userId: stat.userId || statDoc.ref?.parent?.parent?.id,
        };
      });
    },
    ttlMs
  );
}
