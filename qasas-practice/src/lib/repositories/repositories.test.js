import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(async () => ({ id: 'new-result' })),
  collection: vi.fn((...path) => ({ type: 'collection', path })),
  collectionGroup: vi.fn((_db, name) => ({ type: 'collectionGroup', name })),
  doc: vi.fn((...path) => ({ type: 'doc', path })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((count) => ({ type: 'limit', count })),
  orderBy: vi.fn((field, direction = 'asc') => ({ type: 'orderBy', field, direction })),
  query: vi.fn((source, ...constraints) => ({ source, constraints })),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: { fromDate: vi.fn((date) => ({ type: 'timestamp', date })) },
  where: vi.fn((field, operator, value) => ({ type: 'where', field, operator, value })),
  writeBatch: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  collectionGroup: firestoreMocks.collectionGroup,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  runTransaction: firestoreMocks.runTransaction,
  serverTimestamp: firestoreMocks.serverTimestamp,
  Timestamp: firestoreMocks.Timestamp,
  where: firestoreMocks.where,
  writeBatch: firestoreMocks.writeBatch,
}));

vi.mock('../firestore', () => ({
  db: { app: 'test-db' },
}));

function snapshotFrom(docs) {
  return {
    empty: docs.length === 0,
    docs: docs.map(({ id, data }) => ({
      id,
      data: () => data,
    })),
  };
}

describe('quiz results repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const cache = await import('./cache');
    cache.clearRepositoryCache();
  });

  it('queries a scoped weekly leaderboard with deterministic ordering and an explicit limit', async () => {
    const { listLeaderboardResults } = await import('./quiz-results');

    firestoreMocks.getDocs.mockResolvedValueOnce(
      snapshotFrom([
        {
          id: 'r1',
          data: {
            userId: 'u1',
            mode: 'fiqh',
            bankSource: 'fiqh',
            score: 9,
            durationSeconds: 120,
            completedAt: { toDate: () => new Date('2026-07-20T12:00:00Z') },
          },
        },
      ])
    );

    const results = await listLeaderboardResults({
      mode: 'fiqh',
      bankSource: 'fiqh',
      since: new Date('2026-07-20T00:00:00Z'),
      maxResults: 20,
    });

    expect(results).toHaveLength(1);
    expect(firestoreMocks.where).toHaveBeenCalledWith('mode', '==', 'fiqh');
    expect(firestoreMocks.where).toHaveBeenCalledWith('bankSource', '==', 'fiqh');
    expect(firestoreMocks.where).toHaveBeenCalledWith(
      'completedAt',
      '>=',
      expect.objectContaining({ type: 'timestamp' })
    );
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('completedAt', 'desc');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('score', 'desc');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('durationSeconds', 'asc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(20);
  });

  it('caches identical leaderboard queries until quiz result writes invalidate them', async () => {
    const { createQuizResult, listLeaderboardResults } = await import('./quiz-results');

    firestoreMocks.getDocs.mockResolvedValue(
      snapshotFrom([
        {
          id: 'r1',
          data: {
            userId: 'u1',
            mode: 'fiqh',
            bankSource: 'fiqh',
            score: 8,
            durationSeconds: 150,
            completedAt: { toDate: () => new Date('2026-07-21T12:00:00Z') },
          },
        },
      ])
    );

    const params = {
      mode: 'fiqh',
      bankSource: 'fiqh',
      allTime: true,
      maxResults: 5,
    };

    await listLeaderboardResults(params);
    await listLeaderboardResults(params);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);

    await createQuizResult({
      userId: 'u1',
      username: 'student',
      mode: 'fiqh',
      bankSource: 'fiqh',
      score: 8,
      total: 10,
      durationSeconds: 150,
    });
    await listLeaderboardResults(params);

    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(2);
  });

  it('requires explicit limits for quiz result queries', async () => {
    const { listRecentQuizResults } = await import('./quiz-results');

    await expect(listRecentQuizResults({ userId: 'u1' })).rejects.toThrow('maxResults');
  });
});

describe('answer events repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const cache = await import('./cache');
    cache.clearRepositoryCache();
  });

  it('bounds missed-question lookups by user and correctness', async () => {
    const { listMissedQuestionIds } = await import('./answer-events');

    firestoreMocks.getDocs.mockResolvedValueOnce(
      snapshotFrom([
        {
          id: 'e1',
          data: {
            questionId: 'q1',
          },
        },
      ])
    );

    const ids = await listMissedQuestionIds({ userId: 'u1', maxEvents: 200 });

    expect(ids).toEqual(new Set(['q1']));
    expect(firestoreMocks.where).toHaveBeenCalledWith('userId', '==', 'u1');
    expect(firestoreMocks.where).toHaveBeenCalledWith('correct', '==', false);
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('answeredAt', 'desc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(200);
  });
});

describe('topic stats repository', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const cache = await import('./cache');
    cache.clearRepositoryCache();
  });

  it('bounds and orders a user topic-stats subcollection read', async () => {
    const { listUserTopicStats } = await import('./topic-stats');

    firestoreMocks.getDocs.mockResolvedValueOnce(
      snapshotFrom([
        {
          id: 'fiqh_water',
          data: {
            userId: 'u1',
            category: 'fiqh',
            subtopic: 'water',
          },
        },
      ])
    );

    const stats = await listUserTopicStats({ userId: 'u1', maxStats: 100 });

    expect(stats).toEqual([
      {
        id: 'fiqh_water',
        userId: 'u1',
        category: 'fiqh',
        subtopic: 'water',
      },
    ]);
    expect(firestoreMocks.collection).toHaveBeenCalledWith(
      { app: 'test-db' },
      'users',
      'u1',
      'topicStats'
    );
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('category', 'asc');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('subtopic', 'asc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(100);
  });

  it('writes the next topic stat in a user-scoped transaction', async () => {
    const transaction = {
      get: vi.fn(async () => ({
        exists: () => false,
        data: () => null,
      })),
      set: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(async (_db, callback) => callback(transaction));
    const { recordTopicAttempt } = await import('./topic-stats');

    const next = await recordTopicAttempt({
      userId: 'u1',
      mode: 'fiqh',
      bankSource: 'fiqh',
      topic: 'WUD',
      wasCorrect: false,
    });

    expect(firestoreMocks.doc).toHaveBeenCalledWith(
      { app: 'test-db' },
      'users',
      'u1',
      'topicStats',
      'fiqh_WUD'
    );
    expect(transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({
        userId: 'u1',
        category: 'fiqh',
        subtopic: 'WUD',
        attempts: 1,
        correct: 0,
        ewmaScore: 0.7,
        lastAttempted: 'SERVER_TIMESTAMP',
      }),
      { merge: true }
    );
    expect(next).toMatchObject({
      userId: 'u1',
      category: 'fiqh',
      subtopic: 'WUD',
      attempts: 1,
      correct: 0,
      lastAttempted: null,
    });
  });
});
