// Word-by-word grader for Qasas sentence translation.
//
// The student types one English sentence. Each Arabic word in the sentence has
// a list of accepted English renderings (first one is the textbook answer).
// We look for every word's meaning anywhere in the typed sentence (natural
// English word order is fine), then check definiteness: an accepted answer
// that starts with "a"/"an"/"the" requires that article in front of it, and a
// bare answer rejects a stray "the"/"a" in front of it.
//
// Only English answer text is normalized here. Arabic strings are never
// touched.

const ARTICLES = new Set(['a', 'an', 'the']);
const ARTICLE_WINDOW = 3;
const NEIGHBOR_DISTANCE = 3;

const CONTRACTIONS = [
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'],
  [/\bweren't\b/g, 'were not'],
  [/\bwouldn't\b/g, 'would not'],
  [/\bcouldn't\b/g, 'could not'],
  [/\bshouldn't\b/g, 'should not'],
  [/\bhaven't\b/g, 'have not'],
  [/\bhasn't\b/g, 'has not'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwho's\b/g, 'who is'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bi'm\b/g, 'i am'],
  [/\bi'll\b/g, 'i will'],
  [/\bwe'll\b/g, 'we will'],
  [/\bhe'll\b/g, 'he will'],
  [/\bit'll\b/g, 'it will'],
];

export const WORD_STATUS = {
  CORRECT: 'correct',
  ACCEPTED: 'accepted',
  TYPO: 'typo',
  ARTICLE: 'article',
  MISSING: 'missing',
  SKIPPED: 'skipped',
  NOTE: 'note',
};

const PASSING = new Set([WORD_STATUS.CORRECT, WORD_STATUS.ACCEPTED, WORD_STATUS.TYPO]);

export function isPassingStatus(status) {
  return PASSING.has(status);
}

export function normalizeEnglish(value = '') {
  let text = String(value)
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"');

  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/(\p{L})'s\b/gu, '$1')
    .replace(/s'(?=\s|$|\p{P})/gu, 's')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeEnglish(value) {
  const normalized = normalizeEnglish(value);
  return normalized ? normalized.split(' ') : [];
}

function articleKind(token) {
  if (token === 'the') return 'the';
  if (token === 'a' || token === 'an') return 'a';
  return null;
}

function parseAccepted(text) {
  const tokens = tokenizeEnglish(text);
  if (tokens.length > 1 && ARTICLES.has(tokens[0])) {
    return { text, article: articleKind(tokens[0]), core: tokens.slice(1) };
  }
  return { text, article: null, core: tokens };
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[right.length];
}

function typoDistance(expected, typed) {
  if (expected === typed) return 0;
  // Short words and articles are never "typos": the vs then, a vs as, etc.
  if (ARTICLES.has(typed) || ARTICLES.has(expected)) return Infinity;
  if (Math.min(expected.length, typed.length) < 4) return Infinity;
  const longest = Math.max(expected.length, typed.length);
  if (longest < 5) return Infinity;
  const distance = editDistance(expected, typed);
  const allowed = longest >= 8 ? 2 : 1;
  return distance <= allowed ? distance : Infinity;
}

function spanIsFree(claims, start, length) {
  for (let i = start; i < start + length; i += 1) {
    if (claims[i] !== null) return false;
  }
  return true;
}

function exactCandidates(alternatives, answerTokens) {
  const candidates = [];
  alternatives.forEach((alternative, altIndex) => {
    const { core } = alternative;
    if (core.length === 0) return;
    for (let start = 0; start + core.length <= answerTokens.length; start += 1) {
      let matches = true;
      for (let k = 0; k < core.length; k += 1) {
        if (answerTokens[start + k] !== core[k]) {
          matches = false;
          break;
        }
      }
      if (matches) candidates.push({ altIndex, start, length: core.length, distance: 0 });
    }
  });
  return candidates;
}

function typoCandidates(alternatives, answerTokens, claims) {
  const candidates = [];
  alternatives.forEach((alternative, altIndex) => {
    const { core } = alternative;
    if (core.length === 0) return;
    for (let start = 0; start + core.length <= answerTokens.length; start += 1) {
      if (!spanIsFree(claims, start, core.length)) continue;
      let distance = 0;
      for (let k = 0; k < core.length; k += 1) {
        distance += typoDistance(core[k], answerTokens[start + k]);
        if (distance === Infinity) break;
      }
      if (distance > 0 && distance !== Infinity) {
        candidates.push({ altIndex, start, length: core.length, distance });
      }
    }
  });
  return candidates.sort(
    (left, right) => left.distance - right.distance || left.start - right.start
  );
}

function claimSpan(claims, start, length, wordIndex) {
  for (let i = start; i < start + length; i += 1) claims[i] = wordIndex;
}

function findArticleBefore({ start, wordIndex, claims, answerTokens, adjacentOnly = false }) {
  if (adjacentOnly) {
    const position = start - 1;
    return position >= 0 && claims[position] === null && articleKind(answerTokens[position])
      ? position
      : -1;
  }

  let position = start - 1;
  let steps = 0;

  while (position >= 0 && steps < ARTICLE_WINDOW) {
    const owner = claims[position];
    const token = answerTokens[position];

    if (owner === null) {
      return articleKind(token) ? position : -1;
    }
    if (Math.abs(owner - wordIndex) > NEIGHBOR_DISTANCE) return -1;

    position -= 1;
    steps += 1;
  }

  return -1;
}

function articlePriority(entry) {
  const sameCore = entry.sameCoreAlternatives;
  const needsArticle = sameCore.every((alternative) => alternative.article !== null);
  const allowsBare = sameCore.some((alternative) => alternative.article === null);
  if (needsArticle) return 0;
  if (!allowsBare) return 1;
  return sameCore.some((alternative) => alternative.article !== null) ? 1 : 2;
}

/**
 * Grade a typed English translation against a Qasas sentence.
 * @param {{ words: Array<{ ar: string, en: string[], optional?: boolean, note?: string }> }} sentence
 * @param {string} answer
 */
export function gradeQasasTranslation(sentence, answer) {
  const answerTokens = tokenizeEnglish(answer);
  const claims = answerTokens.map(() => null);
  const words = sentence?.words || [];

  const entries = words.map((word, index) => {
    const alternatives = (word.en || []).map(parseAccepted).filter((alt) => alt.core.length > 0);
    return {
      index,
      word,
      alternatives,
      match: null,
      graded: alternatives.length > 0,
    };
  });

  // Pass 1: exact matches. Longest phrases first, then the most constrained
  // words (fewest places they could match), then sentence order.
  const exact = [];
  for (const entry of entries) {
    if (!entry.graded) continue;
    const candidates = exactCandidates(entry.alternatives, answerTokens);
    entry.candidateCount = candidates.length;
    for (const candidate of candidates) exact.push({ entry, ...candidate });
  }
  const optionalRank = (entry) => (entry.word.optional ? 1 : 0);
  exact.sort(
    (left, right) =>
      optionalRank(left.entry) - optionalRank(right.entry) ||
      right.length - left.length ||
      left.entry.candidateCount - right.entry.candidateCount ||
      left.entry.index - right.entry.index ||
      left.altIndex - right.altIndex ||
      left.start - right.start
  );
  for (const candidate of exact) {
    const { entry } = candidate;
    if (entry.match || !spanIsFree(claims, candidate.start, candidate.length)) continue;
    entry.match = candidate;
    claimSpan(claims, candidate.start, candidate.length, entry.index);
  }

  // Pass 2: small typos on whatever is still unclaimed (required words first).
  const typoOrder = [...entries].sort((left, right) => optionalRank(left) - optionalRank(right));
  for (const entry of typoOrder) {
    if (!entry.graded || entry.match) continue;
    const [best] = typoCandidates(entry.alternatives, answerTokens, claims);
    if (!best) continue;
    entry.match = best;
    claimSpan(claims, best.start, best.length, entry.index);
  }

  // Pass 3: definiteness. Words that must carry an article claim theirs
  // first, then flexible words, then words that must stay bare.
  const matched = entries.filter((entry) => entry.match);
  for (const entry of matched) {
    const matchedCore = entry.alternatives[entry.match.altIndex].core.join(' ');
    entry.sameCoreAlternatives = entry.alternatives
      .map((alternative, altIndex) => ({ ...alternative, altIndex }))
      .filter((alternative) => alternative.core.join(' ') === matchedCore);
  }
  matched.sort(
    (left, right) =>
      articlePriority(left) - articlePriority(right) || left.match.start - right.match.start
  );

  for (const entry of matched) {
    const articlePosition = findArticleBefore({
      start: entry.match.start,
      wordIndex: entry.index,
      claims,
      answerTokens,
      adjacentOnly: articlePriority(entry) === 2,
    });
    const foundArticle = articlePosition >= 0 ? articleKind(answerTokens[articlePosition]) : null;
    const satisfied = entry.sameCoreAlternatives.find(
      (alternative) => alternative.article === foundArticle
    );
    const bare = entry.sameCoreAlternatives.find((alternative) => alternative.article === null);

    if (satisfied) {
      entry.chosenAltIndex = satisfied.altIndex;
      if (foundArticle) {
        claims[articlePosition] = entry.index;
        entry.articlePosition = articlePosition;
      }
      continue;
    }

    if (foundArticle && bare) {
      // A stray article before a word that must stay indefinite/bare.
      entry.articleError = foundArticle === 'the' ? 'remove-the' : 'remove-a';
      entry.chosenAltIndex = bare.altIndex;
      claims[articlePosition] = entry.index;
      entry.articlePosition = articlePosition;
      continue;
    }

    const expected = entry.sameCoreAlternatives[0];
    entry.chosenAltIndex = expected.altIndex;
    entry.articleError = expected.article === 'the' ? 'needs-the' : 'needs-a';
    if (foundArticle) {
      claims[articlePosition] = entry.index;
      entry.articlePosition = articlePosition;
    }
  }

  const results = entries.map((entry) => {
    const { word } = entry;
    const expected = word.en?.[0] || '';
    const base = {
      ar: word.ar,
      expected,
      optional: Boolean(word.optional),
      note: word.note || null,
    };

    if (!entry.graded) {
      return { ...base, status: WORD_STATUS.NOTE, typed: null, articleError: null };
    }

    if (!entry.match) {
      return {
        ...base,
        status: word.optional ? WORD_STATUS.SKIPPED : WORD_STATUS.MISSING,
        typed: null,
        articleError: null,
      };
    }

    const typedStart =
      entry.articlePosition !== undefined
        ? Math.min(entry.articlePosition, entry.match.start)
        : entry.match.start;
    const typedTokens = answerTokens.slice(typedStart, entry.match.start + entry.match.length);
    const typed = typedTokens.join(' ');

    let status;
    if (entry.articleError) status = WORD_STATUS.ARTICLE;
    else if (entry.match.distance > 0) status = WORD_STATUS.TYPO;
    else if (
      entry.chosenAltIndex === 0 ||
      entry.alternatives[entry.chosenAltIndex].core.join(' ') ===
        entry.alternatives[0].core.join(' ')
    )
      status = WORD_STATUS.CORRECT;
    else status = WORD_STATUS.ACCEPTED;

    return { ...base, status, typed, articleError: entry.articleError || null };
  });

  const graded = results.filter(
    (result) =>
      result.status !== WORD_STATUS.NOTE &&
      !(result.optional && result.status === WORD_STATUS.SKIPPED)
  );
  const passed = graded.filter((result) => isPassingStatus(result.status));
  const extraWords = answerTokens.filter((_, index) => claims[index] === null);

  return {
    words: results,
    correctCount: passed.length,
    totalCount: graded.length,
    correct: graded.length > 0 && passed.length === graded.length,
    extraWords,
  };
}

export function articleErrorMessage(articleError) {
  switch (articleError) {
    case 'needs-the':
      return 'Needs "the" (definite)';
    case 'needs-a':
      return 'Needs "a/an" (indefinite)';
    case 'remove-the':
      return 'No "the" here (indefinite)';
    case 'remove-a':
      return 'No "a/an" here';
    default:
      return '';
  }
}
