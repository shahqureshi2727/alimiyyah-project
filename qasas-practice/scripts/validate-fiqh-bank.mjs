// Run with: npm run validate:fiqh
//
// Checks the Fiqh question bank for structural problems that are easy to
// introduce by hand across ~100 questions: duplicate question IDs, malformed
// sourceIds, MCQ options/answerIndex mismatches, missing explanations, and
// (for the WUD topic specifically) full coverage of ruling IDs 01-97.

import { FIQH_TOPICS } from '../src/config/subjects.js';
import { getFiqhQuestions } from '../src/data/fiqh/index.js';

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

// 3. Coverage check for WUD: every FQH-WUD-01..97 ruling must be referenced
// by at least one question's sourceIds.
const wudQuestions = allQuestions.filter((q) => q.topic === 'WUD');
const coveredWudIds = new Set(
  wudQuestions.flatMap((q) => q.sourceIds).filter((id) => id.startsWith('FQH-WUD-'))
);
const missingWud = [];
for (let n = 1; n <= 97; n++) {
  const id = `FQH-WUD-${String(n).padStart(2, '0')}`;
  if (!coveredWudIds.has(id)) missingWud.push(id);
}
if (missingWud.length > 0) {
  fail(`WUD coverage incomplete, missing: ${missingWud.join(', ')}`);
}

if (failed) {
  console.error(`\nValidation failed. Total questions checked: ${allQuestions.length}`);
  process.exit(1);
} else {
  console.log(`OK: ${allQuestions.length} questions, ${wudQuestions.length} in WUD, full FQH-WUD-01..97 coverage.`);
  for (const topic of FIQH_TOPICS) {
    const count = allQuestions.filter((q) => q.topic === topic.code).length;
    console.log(`  ${topic.code} (${topic.label}): ${count} questions`);
  }
}
