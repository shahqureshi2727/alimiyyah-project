export const MORPHOLOGY_SCOPES = ['mixed', 'past', 'mudari', 'amrNahi'];

export const MORPHOLOGY_CATEGORIES = [
  'pastActive',
  'pastPassive',
  'mudariActive',
  'mudariPassive',
  'mudariNegative',
  'imperative',
  'prohibitive',
];

export const MORPHOLOGY_CATEGORY_TOPICS = {
  pastActive: 'MOR_PST_ACT',
  pastPassive: 'MOR_PST_PAS',
  mudariActive: 'MOR_MDR_ACT',
  mudariPassive: 'MOR_MDR_PAS',
  mudariNegative: 'MOR_MDR_NEG',
  imperative: 'MOR_CMD_AMR',
  prohibitive: 'MOR_CMD_NAH',
};

export const MORPHOLOGY_TOPIC_CODES = Object.values(MORPHOLOGY_CATEGORY_TOPICS);

export const MORPHOLOGY_SCOPE_LABELS = {
  mixed: { ar: 'مُرَاجَعَة', en: 'Mixed Review' },
  past: { ar: 'مَاضِي', en: 'Past Tense' },
  mudari: { ar: 'مُضَارِع', en: 'Present & Future' },
  amrNahi: { ar: 'أَمْر وَنَهْي', en: 'Imperative & Prohibitive' },
};

const BASE_VERBS = [
  {
    code: 'NSR',
    baseVerb: 'نَصَرَ',
    baseMeaning: 'to help',
    meaningStem: 'help',
    pastActiveStem: 'نَصَر',
    pastPassiveStem: 'نُصِر',
    mudariStem: 'نْصُر',
    mudariPassiveStem: 'نْصَر',
    imperativeStem: 'نْصُر',
    imperativePrefix: 'اُ',
  },
  {
    code: 'FTH',
    baseVerb: 'فَتَحَ',
    baseMeaning: 'to open',
    meaningStem: 'open',
    pastActiveStem: 'فَتَح',
    pastPassiveStem: 'فُتِح',
    mudariStem: 'فْتَح',
    mudariPassiveStem: 'فْتَح',
    imperativeStem: 'فْتَح',
    imperativePrefix: 'اِ',
  },
  {
    code: 'QTL',
    baseVerb: 'قَتَلَ',
    baseMeaning: 'to kill',
    meaningStem: 'kill',
    pastActiveStem: 'قَتَل',
    pastPassiveStem: 'قُتِل',
    mudariStem: 'قْتُل',
    mudariPassiveStem: 'قْتَل',
    imperativeStem: 'قْتُل',
    imperativePrefix: 'اُ',
  },
  {
    code: 'GSL',
    baseVerb: 'غَسَلَ',
    baseMeaning: 'to wash',
    meaningStem: 'wash',
    pastActiveStem: 'غَسَل',
    pastPassiveStem: 'غُسِل',
    mudariStem: 'غْسِل',
    mudariPassiveStem: 'غْسَل',
    imperativeStem: 'غْسِل',
    imperativePrefix: 'اِ',
  },
  {
    code: 'HRS',
    baseVerb: 'حَرَسَ',
    baseMeaning: 'to guard',
    meaningStem: 'guard',
    pastActiveStem: 'حَرَس',
    pastPassiveStem: 'حُرِس',
    mudariStem: 'حْرُس',
    mudariPassiveStem: 'حْرَس',
    imperativeStem: 'حْرُس',
    imperativePrefix: 'اُ',
  },
  {
    code: 'JMع',
    baseVerb: 'جَمَعَ',
    baseMeaning: 'to collect',
    meaningStem: 'collect',
    pastActiveStem: 'جَمَع',
    pastPassiveStem: 'جُمِع',
    mudariStem: 'جْمَع',
    mudariPassiveStem: 'جْمَع',
    imperativeStem: 'جْمَع',
    imperativePrefix: 'اِ',
  },
  {
    code: 'HFS',
    baseVerb: 'حَفِظَ',
    baseMeaning: 'to memorize',
    meaningStem: 'memoriz',
    pastActiveStem: 'حَفِظ',
    pastPassiveStem: 'حُفِظ',
    mudariStem: 'حْفَظ',
    mudariPassiveStem: 'حْفَظ',
    imperativeStem: 'حْفَظ',
    imperativePrefix: 'اِ',
  },
  {
    code: 'SKR',
    baseVerb: 'شَكَرَ',
    baseMeaning: 'to thank',
    meaningStem: 'thank',
    pastActiveStem: 'شَكَر',
    pastPassiveStem: 'شُكِر',
    mudariStem: 'شْكُر',
    mudariPassiveStem: 'شْكَر',
    imperativeStem: 'شْكُر',
    imperativePrefix: 'اُ',
  },
];

const PAST_FORMS = [
  { key: '3ms', suffix: 'َ', ar: 'غَائِب مُذَكَّر وَاحِد', en: 'third person masculine singular', active: 'he {past}', passive: 'he was {passive}' },
  { key: '3md', suffix: 'َا', ar: 'غَائِب مُذَكَّر تَثْنِيَة', en: 'third person masculine dual', active: 'they (dual masculine) {past}', passive: 'they (dual masculine) were {passive}' },
  { key: '3mp', suffix: 'ُوا', ar: 'غَائِب مُذَكَّر جَمْع', en: 'third person masculine plural', active: 'they (plural masculine) {past}', passive: 'they (plural masculine) were {passive}' },
  { key: '3fs', suffix: 'َتْ', ar: 'غَائِب مُؤَنَّث وَاحِد', en: 'third person feminine singular', active: 'she {past}', passive: 'she was {passive}' },
  { key: '3fd', suffix: 'َتَا', ar: 'غَائِب مُؤَنَّث تَثْنِيَة', en: 'third person feminine dual', active: 'they (dual feminine) {past}', passive: 'they (dual feminine) were {passive}' },
  { key: '3fp', suffix: 'ْنَ', ar: 'غَائِب مُؤَنَّث جَمْع', en: 'third person feminine plural', active: 'they (plural feminine) {past}', passive: 'they (plural feminine) were {passive}' },
  { key: '2ms', suffix: 'ْتَ', ar: 'حَاضِر مُذَكَّر وَاحِد', en: 'second person masculine singular', active: 'you (singular masculine) {past}', passive: 'you (singular masculine) were {passive}' },
  { key: '2md', suffix: 'ْتُمَا', ar: 'حَاضِر مُذَكَّر تَثْنِيَة', en: 'second person masculine dual', active: 'you (dual masculine) {past}', passive: 'you (dual masculine) were {passive}' },
  { key: '2mp', suffix: 'ْتُمْ', ar: 'حَاضِر مُذَكَّر جَمْع', en: 'second person masculine plural', active: 'you (plural masculine) {past}', passive: 'you (plural masculine) were {passive}' },
  { key: '2fs', suffix: 'ْتِ', ar: 'حَاضِر مُؤَنَّث وَاحِد', en: 'second person feminine singular', active: 'you (singular feminine) {past}', passive: 'you (singular feminine) were {passive}' },
  { key: '2fd', suffix: 'ْتُمَا', ar: 'حَاضِر مُؤَنَّث تَثْنِيَة', en: 'second person feminine dual', active: 'you (dual feminine) {past}', passive: 'you (dual feminine) were {passive}' },
  { key: '2fp', suffix: 'ْتُنَّ', ar: 'حَاضِر مُؤَنَّث جَمْع', en: 'second person feminine plural', active: 'you (plural feminine) {past}', passive: 'you (plural feminine) were {passive}' },
  { key: '1s', suffix: 'ْتُ', ar: 'مُتَكَلِّم وَاحِد', en: 'first person singular', active: 'I {past}', passive: 'I was {passive}' },
  { key: '1p', suffix: 'ْنَا', ar: 'مُتَكَلِّم جَمْع', en: 'first person plural', active: 'we {past}', passive: 'we were {passive}' },
];

const MUDARI_FORMS = [
  { key: '3ms', prefix: 'يَ', suffix: 'ُ', ar: 'غَائِب مُذَكَّر وَاحِد', en: 'third person masculine singular', active: 'he is {present} or will {base}', passive: 'he is being {passive} or will be {passive}', negative: 'he does not / cannot {base}' },
  { key: '3md', prefix: 'يَ', suffix: 'َانِ', ar: 'غَائِب مُذَكَّر تَثْنِيَة', en: 'third person masculine dual', active: 'they (dual masculine) are {present} or will {base}', passive: 'they (dual masculine) are being {passive} or will be {passive}', negative: 'they (dual masculine) do not / cannot {base}' },
  { key: '3mp', prefix: 'يَ', suffix: 'ُونَ', ar: 'غَائِب مُذَكَّر جَمْع', en: 'third person masculine plural', active: 'they (plural masculine) are {present} or will {base}', passive: 'they (plural masculine) are being {passive} or will be {passive}', negative: 'they (plural masculine) do not / cannot {base}' },
  { key: '3fs', prefix: 'تَ', suffix: 'ُ', ar: 'غَائِب مُؤَنَّث وَاحِد', en: 'third person feminine singular', active: 'she is {present} or will {base}', passive: 'she is being {passive} or will be {passive}', negative: 'she does not / cannot {base}' },
  { key: '3fd', prefix: 'تَ', suffix: 'َانِ', ar: 'غَائِب مُؤَنَّث تَثْنِيَة', en: 'third person feminine dual', active: 'they (dual feminine) are {present} or will {base}', passive: 'they (dual feminine) are being {passive} or will be {passive}', negative: 'they (dual feminine) do not / cannot {base}' },
  { key: '3fp', prefix: 'يَ', suffix: 'ْنَ', ar: 'غَائِب مُؤَنَّث جَمْع', en: 'third person feminine plural', active: 'they (plural feminine) are {present} or will {base}', passive: 'they (plural feminine) are being {passive} or will be {passive}', negative: 'they (plural feminine) do not / cannot {base}' },
  { key: '2ms', prefix: 'تَ', suffix: 'ُ', ar: 'حَاضِر مُذَكَّر وَاحِد', en: 'second person masculine singular', active: 'you (singular masculine) are {present} or will {base}', passive: 'you (singular masculine) are being {passive} or will be {passive}', negative: 'you (singular masculine) do not / cannot {base}' },
  { key: '2md', prefix: 'تَ', suffix: 'َانِ', ar: 'حَاضِر مُذَكَّر تَثْنِيَة', en: 'second person masculine dual', active: 'you (dual masculine) are {present} or will {base}', passive: 'you (dual masculine) are being {passive} or will be {passive}', negative: 'you (dual masculine) do not / cannot {base}' },
  { key: '2mp', prefix: 'تَ', suffix: 'ُونَ', ar: 'حَاضِر مُذَكَّر جَمْع', en: 'second person masculine plural', active: 'you (plural masculine) are {present} or will {base}', passive: 'you (plural masculine) are being {passive} or will be {passive}', negative: 'you (plural masculine) do not / cannot {base}' },
  { key: '2fs', prefix: 'تَ', suffix: 'ِينَ', ar: 'حَاضِر مُؤَنَّث وَاحِد', en: 'second person feminine singular', active: 'you (singular feminine) are {present} or will {base}', passive: 'you (singular feminine) are being {passive} or will be {passive}', negative: 'you (singular feminine) do not / cannot {base}' },
  { key: '2fd', prefix: 'تَ', suffix: 'َانِ', ar: 'حَاضِر مُؤَنَّث تَثْنِيَة', en: 'second person feminine dual', active: 'you (dual feminine) are {present} or will {base}', passive: 'you (dual feminine) are being {passive} or will be {passive}', negative: 'you (dual feminine) do not / cannot {base}' },
  { key: '2fp', prefix: 'تَ', suffix: 'ْنَ', ar: 'حَاضِر مُؤَنَّث جَمْع', en: 'second person feminine plural', active: 'you (plural feminine) are {present} or will {base}', passive: 'you (plural feminine) are being {passive} or will be {passive}', negative: 'you (plural feminine) do not / cannot {base}' },
  { key: '1s', prefix: 'أَ', suffix: 'ُ', ar: 'مُتَكَلِّم وَاحِد', en: 'first person singular', active: 'I am {present} or will {base}', passive: 'I am being {passive} or will be {passive}', negative: 'I do not / cannot {base}' },
  { key: '1p', prefix: 'نَ', suffix: 'ُ', ar: 'مُتَكَلِّم جَمْع', en: 'first person plural', active: 'we are {present} or will {base}', passive: 'we are being {passive} or will be {passive}', negative: 'we do not / cannot {base}' },
];

const COMMAND_FORMS = [
  { key: '2ms', suffix: 'ْ', ar: 'حَاضِر مُذَكَّر وَاحِد', en: 'second person masculine singular', imperative: '{base} (singular masculine)', prohibitive: 'do not {base} (singular masculine)' },
  { key: '2md', suffix: 'َا', ar: 'حَاضِر مُذَكَّر تَثْنِيَة', en: 'second person masculine dual', imperative: '{base} (dual masculine)', prohibitive: 'do not {base} (dual masculine)' },
  { key: '2mp', suffix: 'ُوا', ar: 'حَاضِر مُذَكَّر جَمْع', en: 'second person masculine plural', imperative: '{base} (plural masculine)', prohibitive: 'do not {base} (plural masculine)' },
  { key: '2fs', suffix: 'ِي', ar: 'حَاضِر مُؤَنَّث وَاحِد', en: 'second person feminine singular', imperative: '{base} (singular feminine)', prohibitive: 'do not {base} (singular feminine)' },
  { key: '2fd', suffix: 'َا', ar: 'حَاضِر مُؤَنَّث تَثْنِيَة', en: 'second person feminine dual', imperative: '{base} (dual feminine)', prohibitive: 'do not {base} (dual feminine)' },
  { key: '2fp', suffix: 'ْنَ', ar: 'حَاضِر مُؤَنَّث جَمْع', en: 'second person feminine plural', imperative: '{base} (plural feminine)', prohibitive: 'do not {base} (plural feminine)' },
];

const PAST_SELECTION = ['3ms', '3mp', '2mp', '1p'];
const PAST_PASSIVE_SELECTION = ['3ms', '2mp', '1p'];
const MUDARI_SELECTION = ['3ms', '3mp', '2ms', '1p'];
const MUDARI_PASSIVE_SELECTION = ['3ms', '2mp', '1p'];
const MUDARI_NEGATIVE_SELECTION = ['3ms', '3mp'];
const COMMAND_SELECTION = ['2ms', '2mp'];
const PROHIBITIVE_SELECTION = ['2ms', '2mp'];

function fill(template, verb) {
  return template
    .replace('{base}', verb.baseMeaning.replace('to ', ''))
    .replace('{past}', `${verb.meaningStem}ed`)
    .replace('{present}', `${verb.meaningStem}ing`)
    .replaceAll('{passive}', `${verb.meaningStem}ed`);
}

function makeChoices(forms, answerForm, templateKey, verb) {
  const answer = fill(answerForm[templateKey], verb);
  const distractors = forms
    .filter((form) => form.key !== answerForm.key)
    .slice(0, 3)
    .map((form) => fill(form[templateKey], verb));
  return [answer, ...distractors];
}

function makePastQuestion(verb, form, category, index) {
  const passive = category === 'pastPassive';
  const forms = PAST_FORMS;
  const answerKey = passive ? 'passive' : 'active';
  const categoryLabel = passive ? 'Past passive' : 'Past active';

  return {
    id: `MOR-${passive ? 'PST-PAS' : 'PST-ACT'}-${String(index).padStart(3, '0')}`,
    topic: MORPHOLOGY_CATEGORY_TOPICS[category],
    category,
    scope: 'past',
    verb: `${passive ? verb.pastPassiveStem : verb.pastActiveStem}${form.suffix}`,
    baseVerb: verb.baseVerb,
    baseMeaning: verb.baseMeaning,
    meaningWord: verb.meaningStem,
    answer: fill(form[answerKey], verb),
    options: makeChoices(forms, form, answerKey, verb),
    arabicLabel: form.ar,
    englishLabel: form.en,
    explanation: `${categoryLabel} - ${form.ar} - ${form.en}.`,
  };
}

function makeMudariQuestion(verb, form, category, index) {
  const passive = category === 'mudariPassive';
  const negative = category === 'mudariNegative';
  const forms = MUDARI_FORMS;
  const answerKey = negative ? 'negative' : passive ? 'passive' : 'active';
  const categoryLabel = negative ? 'Negative mudari' : passive ? 'Mudari passive' : 'Mudari active';
  const stem = passive ? verb.mudariPassiveStem : verb.mudariStem;

  return {
    id: `MOR-${negative ? 'MDR-NEG' : passive ? 'MDR-PAS' : 'MDR-ACT'}-${String(index).padStart(3, '0')}`,
    topic: MORPHOLOGY_CATEGORY_TOPICS[category],
    category,
    scope: 'mudari',
    verb: `${negative ? 'لَا ' : ''}${form.prefix}${stem}${form.suffix}`,
    baseVerb: verb.baseVerb,
    baseMeaning: verb.baseMeaning,
    meaningWord: verb.meaningStem,
    answer: fill(form[answerKey], verb),
    options: makeChoices(forms, form, answerKey, verb),
    arabicLabel: form.ar,
    englishLabel: form.en,
    explanation: `${categoryLabel} - ${form.ar} - ${form.en}.`,
  };
}

function makeCommandQuestion(verb, form, category, index) {
  const prohibitive = category === 'prohibitive';
  const answerKey = prohibitive ? 'prohibitive' : 'imperative';
  const categoryLabel = prohibitive ? 'Prohibitive' : 'Imperative';
  const forms = COMMAND_FORMS;

  return {
    id: `MOR-${prohibitive ? 'CMD-NAH' : 'CMD-AMR'}-${String(index).padStart(3, '0')}`,
    topic: MORPHOLOGY_CATEGORY_TOPICS[category],
    category,
    scope: 'amrNahi',
    verb: prohibitive
      ? `لَا تَ${verb.imperativeStem}${form.suffix}`
      : `${verb.imperativePrefix}${verb.imperativeStem}${form.suffix}`,
    baseVerb: verb.baseVerb,
    baseMeaning: verb.baseMeaning,
    meaningWord: verb.meaningStem,
    answer: fill(form[answerKey], verb),
    options: makeChoices(forms, form, answerKey, verb),
    arabicLabel: form.ar,
    englishLabel: form.en,
    explanation: `${categoryLabel} - ${form.ar} - ${form.en}.`,
  };
}

function buildMorphologyBank() {
  const questions = [];
  let pastActiveIndex = 1;
  let pastPassiveIndex = 1;
  let mudariActiveIndex = 1;
  let mudariPassiveIndex = 1;
  let mudariNegativeIndex = 1;
  let imperativeIndex = 1;
  let prohibitiveIndex = 1;

  for (const verb of BASE_VERBS) {
    for (const form of PAST_FORMS.filter((f) => PAST_SELECTION.includes(f.key))) {
      questions.push(makePastQuestion(verb, form, 'pastActive', pastActiveIndex++));
    }
    for (const form of PAST_FORMS.filter((f) => PAST_PASSIVE_SELECTION.includes(f.key))) {
      questions.push(makePastQuestion(verb, form, 'pastPassive', pastPassiveIndex++));
    }
    for (const form of MUDARI_FORMS.filter((f) => MUDARI_SELECTION.includes(f.key))) {
      questions.push(makeMudariQuestion(verb, form, 'mudariActive', mudariActiveIndex++));
    }
    for (const form of MUDARI_FORMS.filter((f) => MUDARI_PASSIVE_SELECTION.includes(f.key))) {
      questions.push(makeMudariQuestion(verb, form, 'mudariPassive', mudariPassiveIndex++));
    }
    for (const form of MUDARI_FORMS.filter((f) => MUDARI_NEGATIVE_SELECTION.includes(f.key))) {
      questions.push(makeMudariQuestion(verb, form, 'mudariNegative', mudariNegativeIndex++));
    }
    for (const form of COMMAND_FORMS.filter((f) => COMMAND_SELECTION.includes(f.key))) {
      questions.push(makeCommandQuestion(verb, form, 'imperative', imperativeIndex++));
    }
    for (const form of COMMAND_FORMS.filter((f) => PROHIBITIVE_SELECTION.includes(f.key))) {
      questions.push(makeCommandQuestion(verb, form, 'prohibitive', prohibitiveIndex++));
    }
  }

  return questions;
}

export const morphology = buildMorphologyBank();

export function getMorphologyQuestions(scope = 'mixed') {
  if (scope === 'mixed') return morphology;
  return morphology.filter((question) => question.scope === scope);
}
