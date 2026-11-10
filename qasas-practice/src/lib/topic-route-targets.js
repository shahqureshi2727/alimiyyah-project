import {
  ARABIC_TOPICS,
  FIQH_TOPICS,
  HADITH_TOPICS,
  TAFSIR_TOPICS,
} from '../config/subjects';

const ARABIC_PRACTICE_MODES = {
  irab: 'irab',
  nounFeatures: 'noun',
  roles: 'role',
  vocab: 'vocab',
};

const MORPHOLOGY_SCOPE_BY_PREFIX = [
  ['MOR_PST_', 'past'],
  ['MOR_MDR_', 'mudari'],
  ['MOR_CMD_', 'amrNahi'],
];

function morphologyPracticeTopic(code) {
  const match = MORPHOLOGY_SCOPE_BY_PREFIX.find(([prefix]) => code.startsWith(prefix));
  return match?.[1] || 'mixed';
}

export function topicMetaForCode(code) {
  const fiqh = FIQH_TOPICS.find((topic) => topic.code === code);
  if (fiqh) return { ...fiqh, subject: 'fiqh', titleAr: 'الفِقْه' };

  const hadith = HADITH_TOPICS.find((topic) => topic.code === code);
  if (hadith) return { ...hadith, subject: 'hadith' };

  const tafsir = TAFSIR_TOPICS.find((topic) => topic.code === code);
  if (tafsir) return { ...tafsir, subject: 'tafsir' };

  const arabic = ARABIC_TOPICS.find((topic) => topic.code === code);
  if (arabic) return { ...arabic, subject: 'arabic', titleAr: 'العَرَبِيَّة' };

  return null;
}

export function practiceTargetForTopic(code) {
  const meta = topicMetaForCode(code);
  if (!meta) return null;

  if (meta.subject === 'fiqh' || meta.subject === 'hadith' || meta.subject === 'tafsir') {
    return { mode: meta.subject, topic: code };
  }

  if (meta.mode === 'morphology') {
    return { mode: 'morphology', topic: morphologyPracticeTopic(code) };
  }

  const mode = ARABIC_PRACTICE_MODES[meta.mode];
  return mode ? { mode } : null;
}

export function quizTargetForTopic(code) {
  const meta = topicMetaForCode(code);
  if (!meta) return null;

  if (meta.subject === 'fiqh' || meta.subject === 'hadith' || meta.subject === 'tafsir') {
    return { mode: meta.subject, topic: code };
  }

  if (meta.subject === 'arabic') {
    return { mode: meta.mode };
  }

  return null;
}
