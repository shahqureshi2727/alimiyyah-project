import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FiqhQuestionCard from './FiqhQuestionCard';
import HadithQuestionCard from './HadithQuestionCard';
import TafsirQuestionCard from './TafsirQuestionCard';
import QuizQuestion from './quiz/QuizQuestion';

const optionSet = ['correct value', 'first distractor', 'second distractor', 'third distractor'];

function fiqhQuestion(overrides = {}) {
  return {
    id: 'FQH-WUD-QTEST',
    topic: 'WUD',
    type: 'mcq',
    prompt: 'Choose the correct value',
    options: optionSet,
    answerIndex: 0,
    explanation: 'Explanation',
    ...overrides,
  };
}

function hadithQuestion(overrides = {}) {
  return {
    id: 'HDT-ARB40-QTEST',
    topic: 'ARB40',
    collection: "Arba'een",
    hadithNumber: 1,
    prompt: 'Choose the translation',
    arabicText: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    options: optionSet,
    answerIndex: 0,
    correctTranslation: 'correct value',
    ...overrides,
  };
}

function tafsirQuestion(overrides = {}) {
  return {
    id: 'TFS-FIL-QTEST',
    topic: 'FIL',
    surahName: 'Al-Fil',
    ayah: 1,
    arabicText: 'أَلَمْ تَرَ',
    options: optionSet,
    answerIndex: 0,
    correctTranslation: 'correct value',
    ...overrides,
  };
}

describe('question cards', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['fiqh', FiqhQuestionCard, fiqhQuestion()],
    ['hadith', HadithQuestionCard, hadithQuestion()],
    ['tafsir', TafsirQuestionCard, tafsirQuestion()],
  ])('%s shuffles options but keeps correctness tied to the answer value', async (_mode, Card, question) => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(
      <Card
        question={question}
        headingId={`${_mode}-question`}
        showFeedback={false}
        currentAnswer={null}
        onAnswer={onAnswer}
      />
    );

    const choices = within(screen.getByRole('group')).getAllByRole('button');
    expect(choices[0]).not.toHaveTextContent('correct value');

    await user.click(screen.getByRole('button', { name: 'correct value' }));

    expect(onAnswer).toHaveBeenCalledWith(true, 'correct value');
  });

  it.each([
    [
      'irab',
      {
        mode: 'irab',
        question: {
          sentence: 'جَاءَ زَيْدٌ',
          target: 'زَيْدٌ',
          answer: 'raf',
        },
        answerName: /raf'/,
      },
    ],
    [
      'nounFeatures',
      {
        mode: 'nounFeatures',
        question: {
          word: 'الْكِتَابُ',
          def: 'marifa',
          gender: 'm',
          number: 'sing',
        },
        select: async (user) => {
          await user.click(
            within(screen.getByRole('group', { name: 'Definiteness' })).getByRole('button', {
              name: /مَعْرِفَةdefinite/,
            })
          );
          await user.click(
            within(screen.getByRole('group', { name: 'Gender' })).getByRole('button', {
              name: /masculine/,
            })
          );
          await user.click(
            within(screen.getByRole('group', { name: 'Number' })).getByRole('button', {
              name: /singular/,
            })
          );
          await user.click(screen.getByRole('button', { name: 'Check' }));
        },
      },
    ],
    [
      'roles',
      {
        mode: 'roles',
        question: {
          role: 'fāʿil',
          words: ['جَاءَ', 'زَيْدٌ'],
          answerIndex: 1,
        },
        answerName: 'زَيْدٌ',
      },
    ],
    [
      'morphology',
      {
        mode: 'morphology',
        question: {
          verb: 'كَتَبَ',
          baseVerb: 'كَتَبَ',
          baseMeaning: 'write',
          arabicLabel: 'past',
          options: ['wrong value', 'correct value'],
          answer: 'correct value',
          explanation: 'Explanation',
        },
        answerName: 'correct value',
      },
    ],
    [
      'vocab',
      {
        mode: 'vocab',
        question: {
          ar: 'كِتَابٌ',
          en: 'book',
        },
        select: async (user) => {
          await user.click(screen.getByRole('button', { name: 'Reveal vocabulary meaning' }));
          await user.click(screen.getByRole('button', { name: 'Knew it' }));
        },
      },
    ],
    [
      'fiqh',
      {
        mode: 'fiqh',
        question: fiqhQuestion(),
        answerName: 'correct value',
      },
    ],
    [
      'hadith',
      {
        mode: 'hadith',
        question: hadithQuestion(),
        answerName: 'correct value',
      },
    ],
    [
      'tafsir',
      {
        mode: 'tafsir',
        question: tafsirQuestion(),
        answerName: 'correct value',
      },
    ],
  ])('%s reports a correct answer through the shared quiz renderer', async (_label, scenario) => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();

    render(
      <QuizQuestion
        mode={scenario.mode}
        question={scenario.question}
        headingId={`${scenario.mode}-heading`}
        showFeedback={false}
        currentAnswer={null}
        isCorrect={false}
        onAnswer={onAnswer}
      />
    );

    if (scenario.select) {
      await scenario.select(user);
    } else {
      await user.click(screen.getByRole('button', { name: scenario.answerName }));
    }

    expect(onAnswer).toHaveBeenCalledWith(true, expect.anything());
  });
});
