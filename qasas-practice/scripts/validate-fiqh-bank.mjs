// Run with: npm run validate:fiqh
//
// Checks the Fiqh question bank for structural problems that are easy to
// introduce by hand across hundreds of questions: duplicate question IDs,
// malformed sourceIds, MCQ options/answerIndex mismatches, missing
// explanations, and full ruling-ID coverage per topic (against the known
// max NN per topic, from content/Fiqh/_Fiqh-MOC.md).

import { FIQH_TOPICS } from '../src/config/subjects.js';
import { getFiqhQuestions } from '../src/data/fiqh/index.js';

// Highest ruling NN per topic, per content/Fiqh/_Fiqh-MOC.md's topic coverage table.
const TOPIC_MAX_ID = {
  INT: 11,
  NJS: 24,
  WTR: 16,
  SJD: 7,
  WUD: 97,
  GHS: 28,
  TYM: 32,
  KHF: 14,
  JBR: 7,
  SLH: 132,
  ADH: 23,
  VEH: 10,
  TRV: 18,
  MRD: 14,
  MSB: 15,
};

let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

const allQuestions = getFiqhQuestions('all');

// 1. Unique question IDs
const seenIds = new Set();
for (const q of allQuestions) {
  if (seenIds.has(q.id)) fail(`duplicate question id: ${q.id}`);
  seenIds.add(q.id);
}

// 2. Per-question schema checks
for (const q of allQuestions) {
  if (!/^FQH-[A-Z]+-Q\d+$/.test(q.id)) fail(`${q.id}: bad id format`);
  if (!Array.isArray(q.sourceIds) || q.sourceIds.length === 0) {
    fail(`${q.id}: sourceIds must be a non-empty array`);
  } else {
    for (const sid of q.sourceIds) {
      if (!/^FQH-[A-Z]+-\d+$/.test(sid)) fail(`${q.id}: bad sourceId "${sid}"`);
    }
  }
  if (!q.topic) fail(`${q.id}: missing topic`);
  if (!q.prompt || typeof q.prompt !== 'string') fail(`${q.id}: missing prompt`);
  if (!q.explanation || typeof q.explanation !== 'string') fail(`${q.id}: missing explanation`);

  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`${q.id}: mcq must have >=2 options`);
    } else if (
      !Number.isInteger(q.answerIndex) ||
      q.answerIndex < 0 ||
      q.answerIndex >= q.options.length
    ) {
      fail(`${q.id}: answerIndex out of range`);
    }
  } else if (q.type === 'tf') {
    if (typeof q.answer !== 'boolean') fail(`${q.id}: tf must have boolean answer`);
  } else {
    fail(`${q.id}: type must be "mcq" or "tf", got "${q.type}"`);
  }
}

// 3. Coverage check per topic: every FQH-<TOPIC>-01..maxNN ruling must be
// referenced by at least one question's sourceIds.
for (const topic of FIQH_TOPICS) {
  const maxId = TOPIC_MAX_ID[topic.code];
  if (!maxId) {
    fail(`${topic.code}: no TOPIC_MAX_ID entry in this script — add one`);
    continue;
  }
  const topicQuestions = allQuestions.filter((q) => q.topic === topic.code);
  const coveredIds = new Set(
    topicQuestions.flatMap((q) => q.sourceIds).filter((id) => id.startsWith(`FQH-${topic.code}-`))
  );
  const missing = [];
  for (let n = 1; n <= maxId; n++) {
    const id = `FQH-${topic.code}-${String(n).padStart(2, '0')}`;
    if (!coveredIds.has(id)) missing.push(id);
  }
  if (missing.length > 0) {
    fail(`${topic.code} coverage incomplete, missing: ${missing.join(', ')}`);
  }
}

if (failed) {
  console.error(`\nValidation failed. Total questions checked: ${allQuestions.length}`);
  process.exit(1);
} else {
  console.log(`OK: ${allQuestions.length} questions across ${FIQH_TOPICS.length} topics, full ruling coverage.`);
  for (const topic of FIQH_TOPICS) {
    const count = allQuestions.filter((q) => q.topic === topic.code).length;
    console.log(`  ${topic.code} (${topic.label}): ${count} questions`);
  }
}
