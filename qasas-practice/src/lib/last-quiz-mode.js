import { QUIZ_MODES } from '../config/subjects';

const STORAGE_KEY = 'lastQuizMode';

export function normalizeLastQuizMode(mode) {
  return QUIZ_MODES[mode] ? mode : 'irab';
}

export function getLastQuizMode(storage = globalThis.localStorage) {
  try {
    return normalizeLastQuizMode(storage?.getItem(STORAGE_KEY));
  } catch {
    return 'irab';
  }
}

export function setLastQuizMode(mode, storage = globalThis.localStorage) {
  const normalized = normalizeLastQuizMode(mode);
  try {
    storage?.setItem(STORAGE_KEY, normalized);
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
  return normalized;
}
