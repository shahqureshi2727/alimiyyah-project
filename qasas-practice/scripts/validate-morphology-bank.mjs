// Run with: npm run validate:morphology
//
// Checks Morphology questions for stable IDs, valid category/scope keys,
// complete MCQ shape, and answer/options consistency.

import {
  MORPHOLOGY_CATEGORIES,
  MORPHOLOGY_SCOPES,
  getMorphologyQuestions,
} from '../src/data/morphology.js';

let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

const allQuestions = getMorphologyQuestions('mixed');
const categories = new Set(MORPHOLOGY_CATEGORIES);
const scopes = new Set(MORPHOLOGY_SCOPES);

if (allQuestions.length < 120) {
  fail(`expected at least 120 questions, got ${allQuestions.length}`);
}

const seenIds = new Set();
for (const q of allQuestions) {
  if (seenIds.has(q.id)) fail(`duplicate question id: ${q.id}`);
  seenIds.add(q.id);

  if (!/^MOR-[A-Z]+-[A-Z]+-\d{3}$/.test(q.id)) fail(`${q.id}: bad id format`);
  if (!categories.has(q.category)) fail(`${q.id}: invalid category "${q.category}"`);
  if (!scopes.has(q.scope)) fail(`${q.id}: invalid scope "${q.scope}"`);
  if (!q.verb || typeof q.verb !== 'string') fail(`${q.id}: missing verb`);
  if (!q.baseVerb || typeof q.baseVerb !== 'string') fail(`${q.id}: missing baseVerb`);
  if (!q.baseMeaning || typeof q.baseMeaning !== 'string') fail(`${q.id}: missing baseMeaning`);
  if (!q.answer || typeof q.answer !== 'string') fail(`${q.id}: missing answer`);
  if (!q.arabicLabel || typeof q.arabicLabel !== 'string') fail(`${q.id}: missing arabicLabel`);
  if (!q.englishLabel || typeof q.englishLabel !== 'string') fail(`${q.id}: missing englishLabel`);
  if (!q.explanation || typeof q.explanation !== 'string') fail(`${q.id}: missing explanation`);

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    fail(`${q.id}: options must contain exactly 4 choices`);
  } else {
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) fail(`${q.id}: duplicate options`);
    if (!q.options.includes(q.answer)) fail(`${q.id}: answer is not present in options`);
    for (const option of q.options) {
      if (!option.includes(q.meaningWord)) {
        fail(`${q.id}: option "${option}" does not include meaning word "${q.meaningWord}"`);
      }
    }
  }
}

for (const scope of MORPHOLOGY_SCOPES.filter((s) => s !== 'mixed')) {
  const scopedQuestions = getMorphologyQuestions(scope);
  if (scopedQuestions.length === 0) fail(`${scope}: no questions returned`);
  for (const q of scopedQuestions) {
    if (q.scope !== scope) fail(`${scope}: included ${q.id} with scope ${q.scope}`);
  }
}

for (const category of MORPHOLOGY_CATEGORIES) {
  const count = allQuestions.filter((q) => q.category === category).length;
  if (count === 0) fail(`${category}: no questions`);
}

if (failed) {
  console.error(`\nValidation failed. Total questions checked: ${allQuestions.length}`);
  process.exit(1);
} else {
  console.log(`OK: ${allQuestions.length} morphology questions.`);
  for (const scope of MORPHOLOGY_SCOPES) {
    console.log(`  ${scope}: ${getMorphologyQuestions(scope).length}`);
  }
  for (const category of MORPHOLOGY_CATEGORIES) {
    const count = allQuestions.filter((q) => q.category === category).length;
    console.log(`  ${category}: ${count}`);
  }
}
