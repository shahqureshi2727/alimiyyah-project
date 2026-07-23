import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { aggregateTopicStatsFromEvents } from '../src/lib/topic-stats.js';

const ANSWER_EVENTS_COLLECTION = 'answerEvents';
const WRITE_BATCH_LIMIT = 450;

function parseArgs(argv) {
  const options = {
    apply: false,
    limit: null,
    userId: null,
  };

  for (const arg of argv) {
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number(arg.slice('--limit='.length));
    } else if (arg.startsWith('--user=')) {
      options.userId = arg.slice('--user='.length);
    }
  }

  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit <= 0)) {
    throw new Error('--limit must be a positive integer');
  }

  return options;
}

function serializeStat(stat) {
  return {
    userId: stat.userId,
    category: stat.category,
    subtopic: stat.subtopic,
    attempts: stat.attempts,
    correct: stat.correct,
    lastAttempted: stat.lastAttempted,
    ewmaScore: stat.ewmaScore,
  };
}

async function loadAnswerEvents(db, options) {
  let query = db.collection(ANSWER_EVENTS_COLLECTION).orderBy('answeredAt', 'asc');
  if (options.userId) query = query.where('userId', '==', options.userId);
  if (options.limit) query = query.limit(options.limit);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function writeStats(db, stats) {
  let batch = db.batch();
  let pendingWrites = 0;
  let totalWrites = 0;

  for (const stat of stats) {
    batch.set(db.doc(stat.path), serializeStat(stat), { merge: true });
    pendingWrites += 1;
    totalWrites += 1;

    if (pendingWrites >= WRITE_BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pendingWrites = 0;
    }
  }

  if (pendingWrites > 0) await batch.commit();
  return totalWrites;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  initializeApp({ credential: applicationDefault() });
  const db = getFirestore();

  const events = await loadAnswerEvents(db, options);
  const stats = aggregateTopicStatsFromEvents(events);
  const userCount = new Set(stats.map((stat) => stat.userId)).size;

  console.log(`Read ${events.length} answerEvents.`);
  console.log(`Prepared ${stats.length} topicStats documents for ${userCount} users.`);

  for (const stat of stats.slice(0, 10)) {
    console.log(
      `${stat.path}: attempts=${stat.attempts}, correct=${stat.correct}, ewma=${stat.ewmaScore.toFixed(4)}`
    );
  }

  if (!options.apply) {
    console.log('Dry run only. Re-run with --apply to write topicStats.');
    return;
  }

  const writeCount = await writeStats(db, stats);
  console.log(`Wrote ${writeCount} topicStats documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
