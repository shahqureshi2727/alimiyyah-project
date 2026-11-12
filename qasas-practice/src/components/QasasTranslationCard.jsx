import { articleErrorMessage, WORD_STATUS } from '../lib/qasas-grading';
import './QasasTranslationCard.css';

const STATUS_LABELS = {
  [WORD_STATUS.CORRECT]: 'Correct',
  [WORD_STATUS.ACCEPTED]: 'Accepted',
  [WORD_STATUS.TYPO]: 'Typo accepted',
  [WORD_STATUS.ARTICLE]: 'Article',
  [WORD_STATUS.MISSING]: 'Missing',
  [WORD_STATUS.SKIPPED]: 'Optional',
  [WORD_STATUS.NOTE]: 'Not translated',
};

function WordDetail({ word }) {
  switch (word.status) {
    case WORD_STATUS.CORRECT:
      return <span className="qasas-word-typed">{word.typed}</span>;
    case WORD_STATUS.ACCEPTED:
    case WORD_STATUS.TYPO:
      return (
        <>
          <span className="qasas-word-typed">{word.typed}</span>
          <span className="qasas-word-expected">Textbook: {word.expected}</span>
        </>
      );
    case WORD_STATUS.ARTICLE:
      return (
        <>
          <span className="qasas-word-typed">{word.typed}</span>
          <span className="qasas-word-expected">
            {articleErrorMessage(word.articleError)}. Textbook: {word.expected}
          </span>
        </>
      );
    case WORD_STATUS.MISSING:
      return <span className="qasas-word-expected">Expected: {word.expected}</span>;
    case WORD_STATUS.SKIPPED:
      return <span className="qasas-word-expected">Optional here. Textbook: {word.expected}</span>;
    case WORD_STATUS.NOTE:
      return <span className="qasas-word-expected">{word.note}</span>;
    default:
      return null;
  }
}

function SummaryLine({ result, timedOut }) {
  if (timedOut) {
    return (
      <p className="qasas-summary-line">
        Time's up, so this sentence counts as missed. You had {result.correctCount} of{' '}
        {result.totalCount} words.
      </p>
    );
  }

  return (
    <p className="qasas-summary-line">
      {result.correct ? 'Every word correct' : 'Not quite'}: {result.correctCount} of{' '}
      {result.totalCount} words.
    </p>
  );
}

export default function QasasTranslationCard({
  question,
  headingId,
  answer,
  onAnswerChange,
  onSubmit,
  result,
  timedOut = false,
}) {
  const inputId = `qasas-answer-${question.id}`;
  const answered = Boolean(result);
  const canSubmit = !answered && answer.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  const passed = answered && result.correct && !timedOut;

  return (
    <div className="qasas-card">
      <div className="qasas-source-row">
        <span className="qasas-chapter-badge">
          Chapter {question.chapter}: {question.chapterTitle}
        </span>
      </div>

      <h2 id={headingId} className="qasas-heading">
        Translate the sentence
      </h2>

      <p className="qasas-arabic" dir="rtl" lang="ar">
        {question.ar}
      </p>

      <form className="qasas-answer-form" onSubmit={handleSubmit}>
        <label className="qasas-answer-label" htmlFor={inputId}>
          Your translation, graded word by word
        </label>
        <textarea
          id={inputId}
          className="qasas-answer-input"
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={answered}
          rows={3}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Type the English translation..."
        />
        {!answered && (
          <button className="qasas-submit-btn" type="submit" disabled={!canSubmit}>
            Check
          </button>
        )}
      </form>

      {answered && (
        <section
          className={`qasas-feedback ${passed ? 'is-correct' : 'is-incorrect'}`}
          aria-live="polite"
          aria-label="Word by word results"
        >
          <SummaryLine result={result} timedOut={timedOut} />

          <ol className="qasas-word-list">
            {result.words.map((word, index) => (
              <li key={`${word.ar}-${index}`} className={`qasas-word-row status-${word.status}`}>
                <span className="qasas-word-ar" dir="rtl" lang="ar">
                  {word.ar}
                </span>
                <span className="qasas-word-status">{STATUS_LABELS[word.status]}</span>
                <span className="qasas-word-detail">
                  <WordDetail word={word} />
                </span>
              </li>
            ))}
          </ol>

          <p className="qasas-reference">
            <span className="qasas-reference-label">Textbook translation</span>
            {question.en}
          </p>

          {result.extraWords.length > 0 && (
            <p className="qasas-extra">
              Not matched to any Arabic word: {result.extraWords.join(' ')}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
