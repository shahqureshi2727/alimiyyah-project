import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firestore';
import { cacheKey, cachedQuery, invalidateRepositoryCache } from './cache';
import { requirePositiveLimit } from './query-helpers';

const COLLECTION = 'users';

function usersCollection() {
  return collection(db, COLLECTION);
}

function userDoc(uid) {
  return doc(db, COLLECTION, uid);
}

function mapUser(userSnapshot) {
  if (!userSnapshot.exists()) return null;
  return {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  };
}

export async function createUserDoc({ uid, username, recoveryEmail }) {
  await setDoc(userDoc(uid), {
    username,
    role: 'student',
    createdAt: serverTimestamp(),
    recoveryEmail: recoveryEmail || null,
  });
  invalidateRepositoryCache(COLLECTION);
}

export async function getUserDocById({ uid, ttlMs } = {}) {
  return cachedQuery(
    cacheKey(COLLECTION, { name: 'doc', uid }),
    async () => mapUser(await getDoc(userDoc(uid))),
    ttlMs
  );
}

export async function listUsers({ maxUsers, ttlMs } = {}) {
  requirePositiveLimit(maxUsers, 'maxUsers');
  const queryRef = query(usersCollection(), orderBy('username', 'asc'), limit(maxUsers));

  return cachedQuery(
    cacheKey(COLLECTION, { name: 'list', maxUsers }),
    async () => {
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map((userSnapshot) => ({
        id: userSnapshot.id,
        ...userSnapshot.data(),
      }));
    },
    ttlMs
  );
}
