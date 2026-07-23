import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { tafsirMcqQuestions, tafsirVerseRecords } from '../data/tafsir';
import { scoreTafsirAnswer } from '../lib/tafsir-scoring';
import TafsirQuestionCard from './TafsirQuestionCard';
import TafsirVerseCard from './TafsirVerseCard';

describe('Tafsir practice components', () => {
  it('renders the MCQ card with ayah reference and Arabic text', () => {
    const question = tafsirMcqQuestions.find((item) => item.id === 'TFS-FIL-001-MCQ');

    const html = renderToStaticMarkup(
      <TafsirQuestionCard
        question={question}
        showFeedback={false}
        currentAnswer={null}
        onAnswer={() => {}}
      />
    );

    expect(html).toContain('Surah Al-Fil');
    expect(html).toContain('Ayah 1');
    expect(html).toContain(question.arabicText);
    expect(html).toContain('Choose the translation');
  });

  it('renders the verse card with textarea and word-level feedback', () => {
    const verse = tafsirVerseRecords.find((item) => item.id === 'TFS-FIL-005');
    const feedback = scoreTafsirAnswer(verse.referenceTranslation, 'leaving them like straw');

    const html = renderToStaticMarkup(
      <TafsirVerseCard
        verse={verse}
        answer="leaving them like straw"
        setAnswer={() => {}}
        feedback={feedback}
        onSubmit={() => {}}
        onNext={() => {}}
        isLastVerse={false}
      />
    );

    expect(html).toContain('textarea');
    expect(html).toContain('Missing words');
    expect(html).toContain('chewed');
    expect(html).toContain('Next ayah');
  });
});
