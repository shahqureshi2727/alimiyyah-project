import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'qasas-practice-rules-test';
let testEnv;

function authedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function quizResult(overrides = {}) {
  return {
    userId: 'alice',
    username: 'alice',
    mode: 'fiqh',
    bankSource: 'fiqh',
    score: 8,
    total: 10,
    durationSeconds: 120,
    completedAt: serverTimestamp(),
    ...overrides,
  };
}

function answerEvent(overrides = {}) {
  return {
    userId: 'alice',
    username: 'alice',
    mode: 'fiqh',
    bankSource: 'fiqh',
    topic: 'WUD',
    group: 'tahara',
    questionId: 'WUD-1',
    correct: true,
    answeredAt: serverTimestamp(),
    quizResultId: 'quiz-1',
    ...overrides,
  };
}

describe('firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync(resolve('firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/alice'), { role: 'student', username: 'alice' });
      await setDoc(doc(db, 'users/bob'), { role: 'student', username: 'bob' });
      await setDoc(doc(db, 'users/admin'), { role: 'admin', username: 'admin' });
      await setDoc(doc(db, 'users/bob/topicStats/fiqh_WUD'), {
        userId: 'bob',
        category: 'fiqh',
        subtopic: 'WUD',
        attempts: 1,
        correct: 1,
        ewmaScore: 1,
        reviewIntervalDays: 2,
        nextDueAt: serverTimestamp(),
        lastAttempted: serverTimestamp(),
      });
      await setDoc(doc(db, 'answerEvents/bob-event'), answerEvent({ userId: 'bob' }));
      await setDoc(doc(db, 'quizResults/alice-result'), quizResult());
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("prevents a user from reading another user's topic stats", async () => {
    await assertFails(getDoc(doc(authedDb('alice'), 'users/bob/topicStats/fiqh_WUD')));
  });

  it('prevents a user from writing a quiz result for another user id', async () => {
    await assertFails(
      setDoc(doc(authedDb('alice'), 'quizResults/bad-user'), quizResult({ userId: 'bob' }))
    );
  });

  it("prevents a non-admin from reading another user's answer events", async () => {
    await assertFails(getDoc(doc(authedDb('alice'), 'answerEvents/bob-event')));
    await assertSucceeds(getDoc(doc(authedDb('admin'), 'answerEvents/bob-event')));
  });

  it('keeps quiz results append-only', async () => {
    await assertFails(updateDoc(doc(authedDb('alice'), 'quizResults/alice-result'), { score: 10 }));
    await assertFails(deleteDoc(doc(authedDb('alice'), 'quizResults/alice-result')));
  });

  it('rejects extra fields on quiz results and answer events', async () => {
    await assertFails(
      setDoc(doc(authedDb('alice'), 'quizResults/extra'), quizResult({ injected: true }))
    );
    await assertFails(
      setDoc(doc(authedDb('alice'), 'answerEvents/extra'), answerEvent({ injected: true }))
    );
  });

  it('accepts the client answer event shape including group and quizResultId', async () => {
    await assertSucceeds(setDoc(doc(authedDb('alice'), 'answerEvents/good'), answerEvent()));
  });
});
