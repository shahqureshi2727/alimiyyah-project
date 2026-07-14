import { irabQuestions } from './irab.js';
import { nounFeaturesQuestions } from './noun-features.js';
import { rolesQuestions } from './roles.js';
import { vocabQuestions } from './vocab.js';

// Topic banks for Arabic questions, matching the pattern used in fiqh/index.js
const TOPIC_BANKS = {
  IRB: irabQuestions,
  NF: nounFeaturesQuestions,
  ROL: rolesQuestions,
  VOC: vocabQuestions,
};

// Mode-to-topic mapping for backwards compatibility with existing mode names
const MODE_TO_TOPIC = {
  irab: 'IRB',
  nounFeatures: 'NF',
  roles: 'ROL',
  vocab: 'VOC',
};

/**
 * Get all Arabic questions for a topic code (or mode name), or every topic if 'all'.
 * @param {string} topicOrMode - e.g. "IRB", "irab", or "all" for pooled mixed review.
 * @returns {Array} question objects
 */
export function getArabicQuestions(topicOrMode) {
  if (topicOrMode === 'all') {
    return Object.values(TOPIC_BANKS).flat();
  }
  // Support both topic codes (IRB) and mode names (irab)
  const topicCode = MODE_TO_TOPIC[topicOrMode] || topicOrMode;
  return TOPIC_BANKS[topicCode] || [];
}

// Re-export individual arrays for backwards compatibility with direct imports
// These maintain the original export names from bank.js
export const irab = irabQuestions;
export const nounFeatures = nounFeaturesQuestions;
export const roles = rolesQuestions;
export const vocab = vocabQuestions;

// Also export the question arrays with their new names
export { irabQuestions, nounFeaturesQuestions, rolesQuestions, vocabQuestions };
