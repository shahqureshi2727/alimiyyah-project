import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firestore';
import { cacheKey, cachedQuery } from './cache';
import { requirePositiveLimit } from './query-helpers';

const COLLECTION = 'weaknessProfiles';

function weaknessProfilesCollection() {
  return collection(db, COLLECTION);
}

function weaknessProfileDoc(userId) {
  return doc(db, COLLECTION, userId);
}

function mapProfile(profileDoc) {
  if (!profileDoc.exists()) return null;
  return {
    id: profileDoc.id,
    ...profileDoc.data(),
  };
}

export async function getWeaknessProfileByUserId({ userId, ttlMs } = {}) {
  return cachedQuery(
    cacheKey(COLLECTION, { name: 'doc', userId }),
    async () => mapProfile(await getDoc(weaknessProfileDoc(userId))),
    ttlMs
  );
}

export async function listWeaknessProfiles({ maxProfiles, ttlMs } = {}) {
  requirePositiveLimit(maxProfiles, 'maxProfiles');
  const queryRef = query(
    weaknessProfilesCollection(),
    orderBy('updatedAt', 'desc'),
    limit(maxProfiles)
  );

  return cachedQuery(
    cacheKey(COLLECTION, { name: 'list', maxProfiles }),
    async () => {
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map((profileDoc) => ({
        id: profileDoc.id,
        ...profileDoc.data(),
      }));
    },
    ttlMs
  );
}
