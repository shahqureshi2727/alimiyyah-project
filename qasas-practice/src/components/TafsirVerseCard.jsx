import './TafsirVerseCard.css';

const STATUS_LABELS = {
  correct: 'Correct',
  close: 'Close',
  review: 'Needs review',
};

function Percent({ value }) {
  return <span className="tafsir-score-percent">{Math.round(value * 100)}%</span>;
}

function WordList({ title, words, empty }) {
  return (
    <div className="tafsir-word-list">
      <span className="tafsir-word-list-title">{title}</span>
      {words.length > 0 ? (
        <div className="tafsir-word-chips">
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className="tafsir-word-chip">
              {word}
            </span>
          ))}
        </div>
      ) : (
        <span className="tafsir-word-empty">{empty}</span>
      )}
    </div>
  );
}

export default function TafsirVerseCard({
  verse,
  answer,
  setAnswer,
  feedback,
  onSubmit,
  onNext,
  isLastVerse,
}) {
  const canSubmit = answer.trim().length > 0 && !feedback;

  return (
    <div className="tafsir-verse-card">
      <div className="tafsir-source-row">
        <span className="tafsir-source-badge">{verse.surahName}</span>
        <span className="tafsir-ayah-number">Ayah {verse.ayah}</span>
      </div>

      <div className="tafsir-arabic-text tafsir-verse-arabic" dir="rtl" lang="ar">
        {verse.arabicText}
      </div>

      <form className="tafsir-answer-form" onSubmit={onSubmit}>
        <label className="tafsir-answer-label" htmlFor={`tafsir-answer-${verse.id}`}>
          Your translation
        </label>
        <textarea
          id={`tafsir-answer-${verse.id}`}
          className="tafsir-answer-input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={Boolean(feedback)}
          rows={4}
          placeholder="Type the ayah translation..."
        />
        {!feedback && (
          <button className="tafsir-submit-btn" type="submit" disabled={!canSubmit}>
            Submit
          </button>
        )}
      </form>

      {feedback && (
        <div className={`tafsir-feedback status-${feedback.status}`}>
          <div className="tafsir-feedback-header">
            <span>{STATUS_LABELS[feedback.status]}</span>
            <Percent value={feedback.score} />
          </div>

          <p className="tafsir-reference">
            Reference: {verse.referenceTranslation}
          </p>

          <WordList
            title="Missing words"
            words={feedback.missingWords}
            empty="No missing words"
          />
          <WordList
            title="Extra words"
            words={feedback.extraWords}
            empty="No extra words"
          />

          {verse.commentary?.length > 0 && (
            <div className="tafsir-notes">
              <span className="tafsir-notes-title">Tafsir notes</span>
              <ul>
                {verse.commentary.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="next-btn tafsir-next-btn" onClick={onNext}>
            {isLastVerse ? 'Finish surah' : 'Next ayah'}
          </button>
        </div>
      )}
    </div>
  );
}
