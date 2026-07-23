import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitQuizResult } from './quiz';

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(async () => ({ id: 'quiz-result-1' })),
  collection: vi.fn((_db, name) => ({ collectionName: name })),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  doc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: firestoreMocks.serverTimestamp,
  Timestamp: { fromDate: vi.fn() },
  where: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('./firebase', () => ({
  db: { app: 'test-db' },
}));

vi.mock('./topic-stats-firestore', () => ({
  recordAttempts: vi.fn(),
}));

describe('submitQuizResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores the supplied total for adaptive review sessions', async () => {
    const id = await submitQuizResult({
      userId: 'u1',
      username: 'student',
      mode: 'review',
      bankSource: 'mixed',
      score: 12,
      total: 15,
      durationSeconds: 420,
    });

    expect(id).toBe('quiz-result-1');
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      { collectionName: 'quizResults' },
      expect.objectContaining({
        mode: 'review',
        bankSource: 'mixed',
        score: 12,
        total: 15,
        completedAt: 'SERVER_TIMESTAMP',
      })
    );
  });

  it('keeps 10 as the default total for existing timed quiz modes', async () => {
    await submitQuizResult({
      userId: 'u1',
      username: 'student',
      mode: 'fiqh',
      bankSource: 'fiqh',
      score: 8,
      durationSeconds: 180,
    });

    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      { collectionName: 'quizResults' },
      expect.objectContaining({
        total: 10,
      })
    );
  });
});
