import { act, create } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePracticeSession } from './usePracticeSession';

const trackWeaknessAnswer = vi.fn();
const keepOrder = (items) => items;

vi.mock('./useWeaknessTracking', () => ({
  useWeaknessTracking: () => trackWeaknessAnswer,
}));

function PracticeProbe({ bank, mode = 'irab', checkAnswer, shuffle }) {
  const session = usePracticeSession({ bank, mode, checkAnswer, shuffle });
  return (
    <section
      data-index={session.currentIndex}
      data-current-id={session.current?.id}
      data-selected={JSON.stringify(session.selected)}
      data-answered={session.answered}
      data-score={session.score}
      data-total={session.sessionTotal}
    >
      <button type="button" onClick={() => session.answer('wrong')}>
        wrong
      </button>
      <button type="button" onClick={() => session.answer('right')}>
        right
      </button>
      <button type="button" onClick={session.next}>
        next
      </button>
      <button type="button" onClick={session.reset}>
        reset
      </button>
    </section>
  );
}

describe('usePracticeSession', () => {
  beforeEach(() => {
    trackWeaknessAnswer.mockReset();
  });

  it('records an answer, scores correct answers, and tracks weakness without awaiting it', () => {
    trackWeaknessAnswer.mockReturnValue(new Promise(() => {}));
    const bank = [{ id: 'q1', answer: 'right' }];
    let rendered;

    act(() => {
      rendered = create(
        <PracticeProbe
          bank={bank}
          checkAnswer={({ answer, question }) => answer === question.answer}
          shuffle={keepOrder}
        />
      );
    });

    act(() => {
      rendered.root.findAllByType('button')[1].props.onClick();
    });

    const section = rendered.root.findByType('section');
    expect(section.props['data-score']).toBe(1);
    expect(section.props['data-total']).toBe(1);
    expect(section.props['data-answered']).toBe(true);
    expect(trackWeaknessAnswer).toHaveBeenCalledWith({
      question: bank[0],
      correct: true,
      mode: 'irab',
      index: 0,
    });
  });

  it('ignores duplicate answers and wraps to the first shuffled question on next', () => {
    const bank = [
      { id: 'q1', answer: 'right' },
      { id: 'q2', answer: 'right' },
    ];
    let rendered;

    act(() => {
      rendered = create(
        <PracticeProbe
          bank={bank}
          checkAnswer={({ answer, question }) => answer === question.answer}
          shuffle={keepOrder}
        />
      );
    });

    const firstQuestionId = rendered.root.findByType('section').props['data-current-id'];
    const click = (buttonIndex) => {
      act(() => {
        rendered.root.findAllByType('button')[buttonIndex].props.onClick();
      });
    };

    click(1);
    click(0);
    click(2);
    click(1);
    click(2);

    const section = rendered.root.findByType('section');
    expect(section.props['data-index']).toBe(0);
    expect(section.props['data-current-id']).toBe(firstQuestionId);
    expect(section.props['data-score']).toBe(2);
    expect(section.props['data-total']).toBe(2);
    expect(trackWeaknessAnswer).toHaveBeenCalledTimes(2);
  });
});
