import { QUIZ_QUESTION_TARGETS } from '../config/subjects';
import { buildDailyReviewBank } from './daily-review';
import { shuffleArray } from './shuffle';

export const STANDARD_QUIZ_LENGTH = 10;

const FIQH_TOPIC_LOADERS = {
  INT: () => import('../data/fiqh/introduction.js').then((module) => module.introductionQuestions),
  NJS: () => import('../data/fiqh/najasah.js').then((module) => module.najasahQuestions),
  WTR: () => import('../data/fiqh/water.js').then((module) => module.waterQuestions),
  SJD: () =>
    import('../data/fiqh/sajdah-tilawah.js').then((module) => module.sajdahTilawahQuestions),
  WUD: () => import('../data/fiqh/wudhu.js').then((module) => module.wudhuQuestions),
  GHS: () => import('../data/fiqh/ghusl.js').then((module) => module.ghuslQuestions),
  TYM: () => import('../data/fiqh/tayammum.js').then((module) => module.tayammumQuestions),
  KHF: () => import('../data/fiqh/khuffs.js').then((module) => module.khuffsQuestions),
  JBR: () => import('../data/fiqh/jabair.js').then((module) => module.jabairQuestions),
  SLH: () => import('../data/fiqh/salah.js').then((module) => module.salahQuestions),
  ADH: () => import('../data/fiqh/adhan.js').then((module) => module.adhanQuestions),
  VEH: () => import('../data/fiqh/vehicles.js').then((module) => module.vehiclesQuestions),
  TRV: () => import('../data/fiqh/travel.js').then((module) => module.travelQuestions),
  MRD: () =>
    import('../data/fiqh/prayer-of-the-sick.js').then(
      (module) => module.prayerOfTheSickQuestions
    ),
  MSB: () => import('../data/fiqh/masbuq.js').then((module) => module.masbuqQuestions),
};

const FIQH_GROUP_TOPICS = {
  tahara: ['NJS', 'WTR', 'WUD', 'GHS', 'TYM', 'KHF', 'JBR'],
  prayer: ['SJD', 'SLH', 'ADH', 'VEH', 'TRV', 'MRD', 'MSB'],
};

const ARABIC_BANK_LOADERS = {
  irab: () => import('../data/arabic/irab.js').then((module) => module.irabQuestions),
  nounFeatures: () =>
    import('../data/arabic/noun-features.js').then((module) => module.nounFeaturesQuestions),
  roles: () => import('../data/arabic/roles.js').then((module) => module.rolesQuestions),
  vocab: () => import('../data/arabic/vocab.js').then((module) => module.vocabQuestions),
  morphology: () => import('../data/morphology.js').then((module) => module.morphology),
};

async function loadFiqhQuestions(topic = 'all') {
  if (topic === 'all') {
    const banks = await Promise.all(
      Object.values(FIQH_TOPIC_LOADERS).map((loadQuestions) => loadQuestions())
    );
    return banks.flat();
  }

  const groupTopics = FIQH_GROUP_TOPICS[topic];
  if (groupTopics) {
    const banks = await Promise.all(groupTopics.map((code) => FIQH_TOPIC_LOADERS[code]()));
    return banks.flat();
  }

  const loadTopic = FIQH_TOPIC_LOADERS[topic];
  return loadTopic ? loadTopic() : [];
}

async function loadDailyReviewBank() {
  const [
    irab,
    nounFeatures,
    roles,
    vocab,
    morphology,
    fiqh,
    hadith,
    tafsir,
  ] = await Promise.all([
    ARABIC_BANK_LOADERS.irab(),
    ARABIC_BANK_LOADERS.nounFeatures(),
    ARABIC_BANK_LOADERS.roles(),
    ARABIC_BANK_LOADERS.vocab(),
    ARABIC_BANK_LOADERS.morphology(),
    loadFiqhQuestions('all'),
    import('../data/hadith/index.js').then((module) => module.getHadithQuestions('all')),
    import('../data/tafsir/index.js').then((module) => module.getTafsirQuestions('all')),
  ]);

  return buildDailyReviewBank([
    { reviewCategory: 'arabic', reviewMode: 'irab', questions: irab },
    { reviewCategory: 'arabic', reviewMode: 'nounFeatures', questions: nounFeatures },
    { reviewCategory: 'arabic', reviewMode: 'roles', questions: roles },
    { reviewCategory: 'arabic', reviewMode: 'vocab', questions: vocab },
    { reviewCategory: 'arabic', reviewMode: 'morphology', questions: morphology },
    { reviewCategory: 'fiqh', reviewMode: 'fiqh', questions: fiqh },
    { reviewCategory: 'hadith', reviewMode: 'hadith', questions: hadith },
    { reviewCategory: 'tafsir', reviewMode: 'tafsir', questions: tafsir },
  ]);
}

export async function loadBank(mode, topic) {
  if (mode === 'fiqh') return loadFiqhQuestions(topic || 'all');
  if (mode === 'hadith') {
    return import('../data/hadith/index.js').then((module) =>
      module.getHadithQuestions(topic || 'all')
    );
  }
  if (mode === 'tafsir') {
    return import('../data/tafsir/index.js').then((module) =>
      module.getTafsirQuestions(topic || 'all')
    );
  }
  if (mode === 'review') return loadDailyReviewBank();

  const loadStaticBank = ARABIC_BANK_LOADERS[mode];
  return loadStaticBank ? loadStaticBank() : [];
}

export async function loadTafsirVerseBank(topic) {
  return import('../data/tafsir/index.js').then((module) =>
    module.getTafsirVerseRecords(topic || 'all')
  );
}

export function getQuestionTarget(mode, question) {
  return QUIZ_QUESTION_TARGETS[mode]?.(question) || '';
}

export function selectQuestions(
  bank,
  length = STANDARD_QUIZ_LENGTH,
  { shuffle = shuffleArray } = {}
) {
  if (!bank || bank.length === 0) {
    return { questions: [], usedRepeats: false };
  }

  if (bank.length < length) {
    const shuffled = shuffle(bank);
    const questions = [];
    for (let i = 0; i < length; i++) {
      questions.push(shuffled[i % shuffled.length]);
    }
    return { questions, usedRepeats: true };
  }

  return {
    questions: shuffle(bank).slice(0, length),
    usedRepeats: false,
  };
}
