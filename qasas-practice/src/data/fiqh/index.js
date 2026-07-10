import { wudhuQuestions } from './wudhu.js';

const TOPIC_BANKS = {
  WUD: wudhuQuestions,
};

/**
 * Get all Fiqh questions for a topic code, or every topic if 'all'.
 * @param {string} topicCode - e.g. "WUD", or "all" for pooled mixed review.
 * @returns {Array} question objects
 */
export function getFiqhQuestions(topicCode) {
  if (topicCode === 'all') {
    return Object.values(TOPIC_BANKS).flat();
  }
  return TOPIC_BANKS[topicCode] || [];
}
