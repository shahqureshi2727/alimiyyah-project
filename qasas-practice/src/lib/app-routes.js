import {
  FIQH_GROUPS,
  FIQH_TOPICS,
  HADITH_TOPICS,
  MORPHOLOGY_TOPICS,
  QUIZ_MODES,
  TAFSIR_TOPICS,
  UNTITLED_PRACTICE_MODES,
} from '../config/subjects';

const APP_NAME = 'Qasas Practice';
const VALID_TAFSIR_VARIANTS = new Set(['mcq', 'verse']);

function encodeSegment(segment) {
  return encodeURIComponent(segment);
}

function byId(items, id) {
  return items.find((item) => item.id === id);
}

function byCode(items, code) {
  return items.find((item) => item.code === code);
}

function invalid(message) {
  return { status: 'invalid', message };
}

export function practicePath({ mode, topic = null, variant = 'mcq' }) {
  const base = topic ? `/practice/${encodeSegment(mode)}/${encodeSegment(topic)}` : `/practice/${encodeSegment(mode)}`;
  if (mode === 'tafsir' && variant === 'verse') {
    return `${base}?variant=verse`;
  }
  return base;
}

export function quizPath({ mode, topic = null }) {
  const path = topic ? `/quiz/${encodeSegment(mode)}/${encodeSegment(topic)}` : `/quiz/${encodeSegment(mode)}`;
  return {
    path,
    leaderboardMode: mode === 'review' ? 'review' : mode,
  };
}

export function routeTitle(kind, details = {}) {
  switch (kind) {
    case 'home':
      return APP_NAME;
    case 'login':
      return `Sign In | ${APP_NAME}`;
    case 'signup':
      return `Create Account | ${APP_NAME}`;
    case 'forgotPassword':
      return `Reset Password | ${APP_NAME}`;
    case 'practice':
      return `Practice: ${details.label} | ${APP_NAME}`;
    case 'quiz':
      return `Quiz: ${details.label} | ${APP_NAME}`;
    case 'leaderboard':
      return `Leaderboard | ${APP_NAME}`;
    case 'weakness':
      return `Strength Map | ${APP_NAME}`;
    case 'admin':
      return `Admin | ${APP_NAME}`;
    case 'notFound':
      return `Page Not Found | ${APP_NAME}`;
    default:
      return APP_NAME;
  }
}

function fiqhTopicLabel(topic) {
  if (topic === 'all') return 'Fiqh Review';
  return byCode(FIQH_TOPICS, topic)?.label || byCode(FIQH_GROUPS, topic)?.label || null;
}

function hadithTopicLabel(topic) {
  if (topic === 'all') return 'Hadith Review';
  return byCode(HADITH_TOPICS, topic)?.label || null;
}

function tafsirTopicLabel(topic) {
  if (topic === 'all') return 'Tafsir Review';
  return byCode(TAFSIR_TOPICS, topic)?.label || null;
}

function morphologyTopicLabel(topic) {
  return byCode(MORPHOLOGY_TOPICS, topic)?.label || null;
}

export function resolvePracticeRoute({ mode, topic = null, variant = 'mcq' }) {
  const simpleMode = byId(UNTITLED_PRACTICE_MODES, mode);
  if (simpleMode) {
    if (topic) return invalid(`Practice mode "${mode}" does not use a topic.`);
    return { status: 'ok', mode, topic: null, variant: 'mcq', label: simpleMode.label };
  }

  if (mode === 'morphology') {
    if (!topic) return { status: 'ok', mode, topic: null, variant: 'mcq', label: 'Morphology' };
    const label = morphologyTopicLabel(topic);
    if (!label) {
      return invalid("That morphology topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic, variant: 'mcq', label };
  }

  if (mode === 'fiqh') {
    const nextTopic = topic || 'all';
    const label = fiqhTopicLabel(nextTopic);
    if (!label) {
      return invalid("That fiqh topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, variant: 'mcq', label };
  }

  if (mode === 'hadith') {
    const nextTopic = topic || 'all';
    const label = hadithTopicLabel(nextTopic);
    if (!label) {
      return invalid("That hadith topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, variant: 'mcq', label };
  }

  if (mode === 'tafsir') {
    const nextTopic = topic || 'all';
    const nextVariant = VALID_TAFSIR_VARIANTS.has(variant) ? variant : 'mcq';
    const label = tafsirTopicLabel(nextTopic);
    if (!label) {
      return invalid("That tafsir topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, variant: nextVariant, label };
  }

  return invalid("That practice mode doesn't exist.");
}

export function resolveQuizRoute({ mode, topic = null }) {
  if (!QUIZ_MODES[mode]) return invalid("That quiz mode doesn't exist.");
  if (mode === 'review') {
    if (topic) return invalid("Today's review does not use a topic.");
    return { status: 'ok', mode, topic: null, label: QUIZ_MODES.review.label };
  }

  if (mode === 'fiqh') {
    const nextTopic = topic || 'all';
    const label = fiqhTopicLabel(nextTopic);
    if (!label) {
      return invalid("That fiqh quiz topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, label };
  }

  if (mode === 'hadith') {
    const nextTopic = topic || 'all';
    const label = hadithTopicLabel(nextTopic);
    if (!label) {
      return invalid("That hadith quiz topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, label };
  }

  if (mode === 'tafsir') {
    const nextTopic = topic || 'all';
    const label = tafsirTopicLabel(nextTopic);
    if (!label) {
      return invalid("That tafsir quiz topic doesn't exist yet.");
    }
    return { status: 'ok', mode, topic: nextTopic, label };
  }

  if (topic) return invalid(`Quiz mode "${mode}" does not use a topic.`);
  return { status: 'ok', mode, topic: null, label: QUIZ_MODES[mode].label };
}
