const CORRECT_THRESHOLD = 0.8;
const CLOSE_THRESHOLD = 0.6;
const STOPWORD_WEIGHT = 0.75;

const CONTRACTIONS = [
  [/\bcan't\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'],
  [/\bweren't\b/g, 'were not'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bwhat's\b/g, 'what is'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bi'm\b/g, 'i am'],
];

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'we',
  'what',
  'who',
  'with',
  'you',
  'your',
]);

export function normalizeTranslation(value = '') {
  let normalized = String(value)
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');

  for (const [pattern, replacement] of CONTRACTIONS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  const normalized = normalizeTranslation(value);
  return normalized ? normalized.split(' ') : [];
}

function wordWeight(word) {
  return STOPWORDS.has(word) ? STOPWORD_WEIGHT : 1;
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function isCloseToken(referenceToken, answerToken) {
  if (referenceToken === answerToken) return true;
  const longest = Math.max(referenceToken.length, answerToken.length);
  if (longest < 5) return false;
  return editDistance(referenceToken, answerToken) <= 1;
}

function scoreAgainstReference(reference, answer) {
  const referenceTokens = tokenize(reference);
  const answerTokens = tokenize(answer);
  const matchedAnswerIndexes = new Set();
  const matchedWords = [];
  const missingWords = [];

  let matchedWeight = 0;
  const totalWeight = referenceTokens.reduce((sum, token) => sum + wordWeight(token), 0);

  for (const referenceToken of referenceTokens) {
    const answerIndex = answerTokens.findIndex((answerToken, index) => (
      !matchedAnswerIndexes.has(index) && isCloseToken(referenceToken, answerToken)
    ));

    if (answerIndex === -1) {
      missingWords.push(referenceToken);
      continue;
    }

    matchedAnswerIndexes.add(answerIndex);
    matchedWords.push(referenceToken);
    matchedWeight += wordWeight(referenceToken);
  }

  const extraWords = answerTokens.filter((_, index) => !matchedAnswerIndexes.has(index));
  const score = totalWeight === 0 ? 0 : Number((matchedWeight / totalWeight).toFixed(3));

  let status = 'review';
  if (score >= CORRECT_THRESHOLD) status = 'correct';
  else if (score >= CLOSE_THRESHOLD) status = 'close';

  return {
    score,
    status,
    matchedWords,
    missingWords,
    extraWords,
    referenceTokens,
    answerTokens,
  };
}

export function scoreTafsirAnswer(reference, answer, acceptableVariants = []) {
  const candidates = [reference, ...acceptableVariants].filter(Boolean);
  const scored = candidates.map((candidate) => scoreAgainstReference(candidate, answer));

  return scored.sort((left, right) => right.score - left.score)[0] || scoreAgainstReference('', answer);
}
