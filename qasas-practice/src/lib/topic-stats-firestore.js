import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  categoryForTopic,
  nextTopicStat,
  profileFromTopicStats,
  topicStatDocId,
} from './topic-stats';

const USERS_COLLECTION = 'users';
const TOPIC_STATS_SUBCOLLECTION = 'topicStats';

export async function recordAttempt({ userId, mode, bankSource, topic, wasCorrect }) {
  const category = categoryForTopic(topic, mode, bankSource);
  const answeredAt = new Date();
  const statRef = doc(
    db,
    USERS_COLLECTION,
    userId,
    TOPIC_STATS_SUBCOLLECTION,
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
    return {
      ...next,
      lastAttempted: null,
    };
  });
}

export async function recordAttempts({ userId, mode, bankSource, results }) {
  const validResults = (results || []).filter(
    (result) => result?.topic && typeof result.correct === 'boolean'
  );

  return Promise.all(
    validResults.map((result) =>
      recordAttempt({
        userId,
        mode,
        bankSource,
        topic: result.topic,
        wasCorrect: result.correct,
      })
    )
  );
}

export async function getUserTopicStats(userId) {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION, userId, TOPIC_STATS_SUBCOLLECTION));
  return snapshot.docs.map((statDoc) => ({
    id: statDoc.id,
    ...statDoc.data(),
  }));
}

export async function getUserTopicProfile(userId) {
  return profileFromTopicStats(await getUserTopicStats(userId));
}

export async function getAllTopicStatsProfiles() {
  const [statsSnapshot, usersSnapshot] = await Promise.all([
    getDocs(collectionGroup(db, TOPIC_STATS_SUBCOLLECTION)),
    getDocs(collection(db, USERS_COLLECTION)),
  ]);
  const usernames = new Map(usersSnapshot.docs.map((userDoc) => [userDoc.id, userDoc.data().username]));
  const statsByUser = new Map();

  for (const statDoc of statsSnapshot.docs) {
    const stat = statDoc.data();
    const userId = stat.userId || statDoc.ref.parent.parent?.id;
    if (!userId) continue;
    if (!statsByUser.has(userId)) statsByUser.set(userId, []);
    statsByUser.get(userId).push({
      id: statDoc.id,
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
