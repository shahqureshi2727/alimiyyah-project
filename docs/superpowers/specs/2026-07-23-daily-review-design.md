# Daily Review Quiz Design

## Goal

Turn the existing "Review Your Weak Spots" quiz into a true daily review session that adapts across Arabic, Fiqh, Hadith, and Tafsir. The session should feel like the student's daily study loop: short, mixed, and guided by their weakest and due topics.

## User-Facing Structure

The home screen keeps the existing quiz entry area, with the adaptive review presented as the first quiz option. The quiz picker labels it "Today's Review" and describes it as a 12-15 question adaptive mix.

Starting the review opens the existing timed quiz shell. The header, timer, answer feedback, results screen, and answer-event saving behavior stay familiar. The visible progress and final score use the actual daily review length rather than the old fixed 10-question count.

## Session Composition

Daily review builds one mixed question list of up to 15 questions:

- 40% weak-topic questions from the lowest `ewmaScore` topic stats across all categories.
- 30% due spaced-review topics where `nextDueAt` is at or before the current time.
- 30% general mixed questions sampled broadly across Arabic, Fiqh, Hadith, and Tafsir.

When the user has too little history, the review falls back to a broad general mix. This prevents a new user from seeing an empty or oddly narrow review before `topicStats` has enough signal.

Questions continue to render through their existing mode-specific cards. Review questions carry `reviewMode` so the shared timed quiz can render Arabic, Fiqh, Hadith, and Tafsir items in one session.

## Spaced Repetition

Topic stats gain two optional fields:

```js
{
  nextDueAt: Timestamp | Date | string | null,
  reviewIntervalDays: number
}
```

On each recorded attempt:

- Correct answer: keep at least a 1-day interval, multiply the previous interval by 1.8, cap at 30 days, and set `nextDueAt` to now plus the new interval.
- Incorrect answer: reset `reviewIntervalDays` to 1 and set `nextDueAt` to tomorrow.

Spacing remains topic-level rather than per-question. That keeps the model small and matches the strength map's existing category/subtopic granularity.

## Data Flow

`TimedQuiz` asks a pure daily-review selector for questions when `mode === 'review'`. The selector consumes:

- all static question banks
- the user's `topicStats`
- recently missed question ids
- the current timestamp

Firestore remains the persistence layer:

- `quizResults` stores the quiz-level score, actual total, mode `review`, and bankSource `mixed`.
- `answerEvents` stores every answered question.
- `users/{uid}/topicStats/{category}_{subtopic}` stores EWMA strength plus the new spacing fields.

Firestore rules must permit the new topic-stat keys and the larger review result total while keeping normal quiz totals constrained.

## Error Handling

If adaptive Firestore reads fail, the app logs the error and falls back to a broad local mixed review. If a bank has fewer available items than requested, the selector uses as many unique questions as it can, then fills with non-selected questions before allowing repeats.

## Testing

Pure tests cover:

- weak-topic selection across categories
- due-topic selection by `nextDueAt`
- cold-start broad mixing
- duplicate avoidance
- SRS interval changes for correct and incorrect attempts
- dynamic quiz result totals

Existing integration tests continue to cover topic categorization, answer events, and Tafsir metadata.

Manual checks cover:

- Quiz picker shows "Today's Review"
- Daily review loads mixed categories
- Progress and final score show the actual question count
- Results save without Firestore rule rejection

## Out Of Scope

- Per-question flashcard-grade SRS.
- AI-generated remediation.
- Teacher-editable review rules.
- A separate daily streak or calendar system.
