import { ARABIC_TOPICS, FIQH_TOPICS, HADITH_TOPICS, TAFSIR_TOPICS } from '../config/subjects';

const warnedMissingQuestionMeta = new Set();

function warnMissingMetaOnce(key, message) {
  if (warnedMissingQuestionMeta.has(key)) return;
  warnedMissingQuestionMeta.add(key);
  console.warn(message);
}

export function topicGroupFor(topicCode, mode) {
  const fiqhTopic = FIQH_TOPICS.find((topic) => topic.code === topicCode);
  if (fiqhTopic) return fiqhTopic.group;
  const hadithTopic = HADITH_TOPICS.find((topic) => topic.code === topicCode);
  if (hadithTopic) return hadithTopic.code;
  const tafsirTopic = TAFSIR_TOPICS.find((topic) => topic.code === topicCode);
  if (tafsirTopic) return tafsirTopic.code;
  const arabicTopic = ARABIC_TOPICS.find((topic) => topic.code === topicCode);
  if (arabicTopic) return arabicTopic.mode;
  return mode === 'fiqh' ? null : mode;
}

export function questionResultFromAnswer({ question, correct, mode, index = 0 }) {
  const fallbackTopic = mode;
  const topicCode = question?.topic || fallbackTopic;
  const questionId = question?.id || `${mode}-${index + 1}`;

  if (!question?.topic) {
    warnMissingMetaOnce(
      `${mode}:topic`,
      `Question topic missing for ${mode}; falling back to "${fallbackTopic}" for weakness tracking.`
    );
  }

  if (!question?.id) {
    warnMissingMetaOnce(
      `${mode}:id`,
      `Question id missing for ${mode}; using a session fallback id for weakness tracking.`
    );
  }

  return {
    questionId,
    topic: topicCode,
    group: topicGroupFor(topicCode, mode),
    correct,
  };
}
