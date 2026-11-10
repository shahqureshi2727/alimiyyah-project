# Qasas Practice Audit

Scope: every file under `qasas-practice/src`, plus `vite.config.js`, `eslint.config.js`,
`vercel.json`, `firestore.rules`, `firestore.indexes.json`, `index.html`, and `package.json`.
This is a map for later phases. It does not recommend refactoring application logic in this phase.

## 1. Architecture

- **P1** `MainApp` owns route-like state outside React Router: `currentMode`, `currentTopic`,
  `currentVariant`, `quizMode`, `quizTopic`, `quizInProgress`, and `showQuizPicker` all gate
  mutually exclusive screens before the declared `<Routes>` tree takes over. This creates two
  navigation sources of truth and makes refresh/deep-link behavior impossible for practice/quiz
  substates. See `src/App.jsx:69`, `src/App.jsx:88`, `src/App.jsx:135`, and `src/App.jsx:282`.
- **P1** `TimedQuiz.jsx` is a god component: bank selection, daily-review Firestore reads, timers,
  browser-back interception, result persistence, result screen rendering, and all Arabic/Fiqh/Hadith/
  Tafsir render branches live in one component. See `src/components/TimedQuiz.jsx:40`,
  `src/components/TimedQuiz.jsx:52`, `src/components/TimedQuiz.jsx:258`,
  `src/components/TimedQuiz.jsx:296`, `src/components/TimedQuiz.jsx:449`,
  `src/components/TimedQuiz.jsx:537`, and `src/components/TimedQuiz.jsx:653`.
- **P1** `AdminPage.jsx` is another god component: bank explorer, class stats, weakness admin, and
  auth gate are all nested in one 800+ line file. See `src/components/AdminPage.jsx:31`,
  `src/components/AdminPage.jsx:405`, `src/components/AdminPage.jsx:678`, and
  `src/components/AdminPage.jsx:796`.
- **P1** The eight practice modes duplicate the same self-paced loop: derive shuffled questions,
  track current index, block duplicate answers, increment session total/score, track weakness, and
  move next. Compare `src/components/FiqhPracticeMode.jsx:8`,
  `src/components/HadithPracticeMode.jsx:8`, `src/components/IrabMode.jsx:29`,
  `src/components/NounMode.jsx:23`, `src/components/RoleMode.jsx:7`,
  `src/components/VocabMode.jsx:7`, `src/components/MorphologyMode.jsx:35`, and
  `src/components/TafsirPracticeMode.jsx:18`.
- **P1** Subject metadata is only partially centralized. `QUIZ_MODES` is centralized, but
  `QuizPicker` still hand-builds mode cards and omits focused Tafsir quiz entries, while
  `HomeScreen` keeps a separate `MODE_LABELS` map. See `src/config/subjects.js:8`,
  `src/components/QuizPicker.jsx:4`, `src/components/QuizPicker.jsx:61`,
  `src/components/QuizPicker.jsx:68`, and `src/components/HomeScreen.jsx:50`.
- **P2** Presentational extraction has started for Fiqh/Hadith/Tafsir cards, but Arabic modes still
  duplicate check/X SVGs and feedback-class construction inside each mode and inside `TimedQuiz`.
  See `src/components/FiqhQuestionCard.jsx:8`, `src/components/HadithQuestionCard.jsx:4`,
  `src/components/TafsirQuestionCard.jsx:4`, `src/components/IrabMode.jsx:102`,
  `src/components/MorphologyMode.jsx:18`, and `src/components/TimedQuiz.jsx:241`.

## 2. Correctness Risks

- **P1** Quiz auto-advance timeouts are not stored or cleared. If a user exits/unmounts during the
  one-second dwell, the pending callback can still call `advanceQuestion`. See
  `src/components/TimedQuiz.jsx:434`, `src/components/TimedQuiz.jsx:511`, and
  `src/components/TimedQuiz.jsx:499`.
- **P1** Browser-back interception pushes history state on mount and again on every trapped
  `popstate`, but cleanup only removes the listener. It does not unwind the extra history entries,
  so repeated quiz starts can pollute session history. See `src/components/TimedQuiz.jsx:354`,
  `src/components/TimedQuiz.jsx:364`, `src/components/TimedQuiz.jsx:370`, and
  `src/components/TimedQuiz.jsx:373`.
- **P1** `submitQuizResult` and `submitAnswerEvents` are sequential. If the result write succeeds
  and answer-event/topic-stat writes fail, the learner sees a generic save error but Firestore now
  contains a leaderboard result without per-question telemetry. See `src/components/TimedQuiz.jsx:537`,
  `src/components/TimedQuiz.jsx:546`, and `src/components/TimedQuiz.jsx:555`.
- **P1** Daily review loads every wrong `answerEvents` document for the user without `limit()` or a
  date bound. A long-term user accumulates an ever-growing read before every review. See
  `src/components/TimedQuiz.jsx:297`, `src/components/TimedQuiz.jsx:299`,
  `src/components/TimedQuiz.jsx:300`, and `src/components/TimedQuiz.jsx:301`.
- **P1** Review and normal quiz totals are persisted correctly, but display code still hardcodes
  `/10` in personal history and leaderboard tables, so 15-question daily review scores are shown
  incorrectly. See `src/components/HomeScreen.jsx:356`, `src/components/LeaderboardTable.jsx:44`,
  and `src/components/LeaderboardTable.jsx:59`.
- **P1** Async effects do not guard against stale responses in leaderboard/home/admin/weakness
  fetches. Fast tab/user changes can allow an older request to overwrite newer state. See
  `src/components/Leaderboard.jsx:29`, `src/components/Leaderboard.jsx:95`,
  `src/components/LeaderboardPreview.jsx:27`, `src/components/HomeScreen.jsx:70`,
  `src/components/AdminPage.jsx:411`, and `src/components/WeaknessDashboard.jsx:95`.
- **P2** Several lists use array indexes as keys where stable IDs exist or where reordered content
  would preserve wrong DOM state. See `src/components/AdminPage.jsx:175`,
  `src/components/AdminPage.jsx:208`, `src/components/AdminPage.jsx:235`,
  `src/components/AdminPage.jsx:266`, `src/components/TimedQuiz.jsx:616`, and
  `src/components/TimedQuiz.jsx:820`.
- **P2** `handlePlayAgain` uses a tiny timeout to force a remount instead of keying the quiz
  instance. It works today but is brittle under StrictMode and scheduler changes. See
  `src/App.jsx:168`, `src/App.jsx:174`, and `src/main.jsx:10`.

## 3. Firestore

- **P1** Write site: `quizResults` is append-only from the client via `addDoc`. Rules constrain
  ownership, mode, bank source, score/total, duration, and timestamp, but they do not use
  `keys().hasOnly()`, so extra unvalidated fields can be attached by a modified client. See
  `src/lib/quiz.js:55`, `firestore.rules:69`, `firestore.rules:72`, and `firestore.rules:86`.
- **P1** Write site: `answerEvents` uses a batch and then topic-stat transactions. Rules validate
  required fields but accept arbitrary extra fields because there is no `keys().hasOnly()`;
  current client writes `group` and `quizResultId`, which are not constrained. See
  `src/lib/quiz.js:88`, `src/lib/quiz.js:91`, `src/lib/quiz.js:102`, `firestore.rules:96`,
  `firestore.rules:99`, and `firestore.rules:104`.
- **P1** Write site: topic stats run one Firestore transaction per answer event. A 15-question
  daily review can therefore issue 15 transactions after the answer-event batch. See
  `src/lib/topic-stats-firestore.js:31`, `src/lib/topic-stats-firestore.js:52`, and
  `src/lib/topic-stats-firestore.js:57`.
- **P1** Admin read site: class stats reads all quiz results with only `orderBy('completedAt')` and
  no limit or pagination. Cost grows with every quiz ever submitted. See `src/lib/quiz.js:248`,
  `src/lib/quiz.js:249`, and `src/components/AdminPage.jsx:415`.
- **P1** Admin read site: weakness admin reads a `collectionGroup('topicStats')` plus every user
  document. This is unbounded and may become the most expensive admin page load. See
  `src/lib/topic-stats-firestore.js:84`, `src/lib/topic-stats-firestore.js:86`, and
  `src/lib/topic-stats-firestore.js:87`.
- **P1** Review read site: daily review reads all wrong answer events for the user with no composite
  index declared for `answerEvents(userId, correct)`. Firestore may prompt for an index and the query
  is unbounded even after an index exists. See `src/components/TimedQuiz.jsx:297`,
  `src/components/TimedQuiz.jsx:300`, `src/components/TimedQuiz.jsx:301`, and
  `firestore.indexes.json:2`.
- **P2** `weaknessProfiles/{uid}` still allows any authenticated user to write any shape to their
  own profile, but current app code reads topic stats instead. The unused collection is more open
  than the active schema. See `firestore.rules:109`, `firestore.rules:112`,
  `src/lib/topic-stats-firestore.js:78`, and `src/components/WeaknessDashboard.jsx:97`.

## 4. Error Handling and Observability

- **P1** Many async paths log only to the console, so production failures are invisible after the
  user navigates away and there is no centralized event trail. Examples include auth-doc load,
  home recent results, leaderboard, admin stats, weakness, and quiz saving. See
  `src/contexts/AuthContext.jsx:32`, `src/components/HomeScreen.jsx:78`,
  `src/components/Leaderboard.jsx:85`, `src/components/AdminPage.jsx:418`,
  `src/components/WeaknessDashboard.jsx:101`, and `src/components/TimedQuiz.jsx:556`.
- **P1** Weakness tracking errors are swallowed after `console.error`, so untimed practice can look
  successful while spaced-repetition state is not updated. See
  `src/hooks/useWeaknessTracking.js:14`, `src/hooks/useWeaknessTracking.js:30`, and
  `src/hooks/useWeaknessTracking.js:31`.
- **P1** Daily-review load failure falls back to a generic bank, but the UI still says only
  "Loading quiz..." before silently changing selection behavior. See `src/components/TimedQuiz.jsx:327`,
  `src/components/TimedQuiz.jsx:329`, and `src/components/TimedQuiz.jsx:577`.
- **P2** Leaderboard error copy tells users to check the browser console for an index link, which is
  developer-oriented and not actionable for students. See `src/components/Leaderboard.jsx:86`.
- **P2** Settings storage failures are swallowed entirely. Private browsing/quota failures will not
  tell the learner that theme/script choices were not persisted. See
  `src/contexts/SettingsContext.jsx:12` and `src/contexts/SettingsContext.jsx:16`.

## 5. Accessibility

- **P1** The settings dialog has `role="dialog"` and `aria-modal`, but it has no focus trap and no
  Escape handler; focus can move behind the modal. See `src/components/AuthHeader.jsx:188`,
  `src/components/AuthHeader.jsx:190`, and `src/components/AuthHeader.jsx:193`.
- **P1** The exit dialog focuses Cancel and closes on Escape, but it does not trap Tab within the
  dialog or restore focus to the "Exit quiz" button on close. See `src/components/TimedQuiz.jsx:199`,
  `src/components/TimedQuiz.jsx:202`, `src/components/TimedQuiz.jsx:218`,
  `src/components/TimedQuiz.jsx:899`, and `src/components/TimedQuiz.jsx:917`.
- **P1** Sortable admin table headers are clickable `<th>` elements, not buttons, and do not expose
  keyboard activation or `aria-sort`. See `src/components/AdminPage.jsx:638`,
  `src/components/AdminPage.jsx:645`, `src/components/AdminPage.jsx:652`, and
  `src/components/AdminPage.jsx:660`.
- **P1** Vocab flashcards are clickable `<div>` elements with no keyboard handler or role, so
  keyboard users cannot reveal the card. See `src/components/VocabMode.jsx:46` and
  `src/components/TimedQuiz.jsx:888`.
- **P1** Feedback is largely visual color/icon state without live-region announcements, so screen
  reader users may not be told that an answer was correct, incorrect, saved, or failed. See
  `src/components/TimedQuiz.jsx:607`, `src/components/FiqhQuestionCard.jsx:66`,
  `src/components/HadithQuestionCard.jsx:74`, and `src/components/TafsirQuestionCard.jsx:77`.
- **P1** Measured contrast: light theme `--success` (`#22863a`) on `--parchment` (`#faf7f2`) is
  4.33:1, below WCAG AA 4.5:1 for normal text. The token and usages are at `src/App.css:28`,
  `src/App.css:10`, `src/components/TimedQuiz.css:117`, and `src/components/Auth.css:117`.
- **P1** The viewport disables pinch zoom (`maximum-scale=1.0, user-scalable=no`), which is an
  accessibility failure for low-vision users. The prompt says Phase 7 handles this, so leave it
  unchanged for now. See `index.html:6` and `index.html:7`.
- **P2** Existing CSS tests measure some touch targets and semantic tokens, but they are static CSS
  checks rather than rendered keyboard/focus/zoom tests. See `src/lib/ui-css.test.js:76` and
  `src/lib/ui-css.test.js:136`.

## 6. Performance

- **P1** The production build emits one JS chunk of about 1.19 MB minified / 329 KB gzip. Static
  imports pull all question banks into first load for routes that may not need them. See
  `src/components/TimedQuiz.jsx:11`, `src/components/TimedQuiz.jsx:15`,
  `src/lib/daily-review.js:1`, `src/lib/daily-review.js:5`, and `src/components/AdminPage.jsx:14`.
- **P1** Daily review eagerly constructs all review sources at module load, including all Fiqh,
  Hadith, and Tafsir questions. See `src/lib/daily-review.js:11`, `src/lib/daily-review.js:17`,
  `src/lib/daily-review.js:18`, and `src/lib/daily-review.js:19`.
- **P1** Admin bank viewer recomputes full pooled banks and filtered arrays on every render, not in
  `useMemo`, so typing in search scans all static banks repeatedly. See `src/components/AdminPage.jsx:102`,
  `src/components/AdminPage.jsx:108`, `src/components/AdminPage.jsx:110`, and
  `src/components/AdminPage.jsx:112`.
- **P1** Font loading blocks through CSS `@import` for Google Fonts, while the Indo-Pak Nastaleeq
  font is a remote TTF declared in app CSS. See `src/index.css:2`, `src/App.css:2`,
  `src/App.css:4`, and `src/App.css:135`.
- **P2** Unused starter assets remain in the source tree and may confuse future asset ownership,
  even if they are not currently imported: `src/assets/react.svg`, `src/assets/vite.svg`, and
  `src/assets/hero.png`.

## 7. UI/UX Consistency

- **P1** The app identity is still Qasas-specific on the home hero even though the app now includes
  Fiqh, Hadith, and Tafsir. See `src/components/HomeScreen.jsx:278`,
  `src/components/HomeScreen.jsx:279`, and `src/components/HomeScreen.jsx:280`.
- **P1** QuizPicker does not expose the same Tafsir-focused surfacing as HomeScreen: HomeScreen has
  a surah selector, but QuizPicker only has mixed Tafsir. See `src/components/HomeScreen.jsx:233`,
  `src/components/HomeScreen.jsx:252`, `src/components/HomeScreen.jsx:270`, and
  `src/components/QuizPicker.jsx:47`.
- **P1** Several pages use their own empty/loading/error presentation instead of shared states,
  producing different tone and spacing for similar failures. See `src/components/TimedQuiz.jsx:575`,
  `src/components/Leaderboard.jsx:143`, `src/components/LeaderboardPreview.jsx:100`,
  `src/components/AdminPage.jsx:580`, and `src/components/WeaknessDashboard.jsx:112`.
- **P2** Token coverage is incomplete: several component CSS files still hardcode radii and one-off
  colors rather than using a spacing/radius system. See `src/components/HomeScreen.css:66`,
  `src/components/LeaderboardTable.css:7`, `src/components/AdminPage.css:249`, and
  `src/components/AdminPage.css:330`.
- **P2** Arabic script support has the correct high-level attribute and line-height attention, but
  there is no automated rendered check across light/dark and Madina/Indo-Pak combinations. See
  `src/App.css:135`, `src/components/TafsirQuestionCard.css:45`,
  `src/components/HadithQuestionCard.css:44`, and `src/lib/ui-css.test.js:136`.

## 8. Testing

- **P1** Current tests cover data generation, scoring utilities, topic stats, daily review
  selection, Firestore write payload shape for `submitQuizResult`, and CSS static checks. See
  `src/data/hadith/hadith.test.js:5`, `src/data/tafsir/tafsir.test.js:11`,
  `src/lib/tafsir-scoring.test.js:4`, `src/lib/topic-stats.test.js:11`,
  `src/lib/daily-review.test.js:20`, `src/lib/quiz.test.js:32`, and `src/lib/ui-css.test.js:32`.
- **P1** There are almost no interaction tests for the core app flows: auth redirects, subject
  navigation, self-paced practice, timed quiz timers, exit dialog, leaderboard tabs, admin tabs, and
  settings modal are not rendered as user flows. See `src/components/TafsirPracticeMode.test.jsx:8`
  for the current component-level exception.
- **P1** Firestore query functions are not tested for query shape/index expectations; only
  `submitQuizResult` payload defaults are covered. See `src/lib/quiz.test.js:37`,
  `src/lib/quiz.js:117`, `src/lib/quiz.js:166`, `src/lib/quiz.js:209`, and `src/lib/quiz.js:249`.
- **P2** Ten highest-value missing tests:
  1. Timed quiz completes once and writes one quiz result plus answer events (`src/components/TimedQuiz.jsx:537`).
  2. Timed quiz exit/back does not save and clears pending auto-advance (`src/components/TimedQuiz.jsx:434`).
  3. Daily review uses weak/due/missed inputs and falls back visibly on Firestore read failure (`src/components/TimedQuiz.jsx:296`).
  4. Recent results and leaderboard display `result.total`, not `/10` (`src/components/HomeScreen.jsx:356`).
  5. Leaderboard tab changes ignore stale responses (`src/components/Leaderboard.jsx:29`).
  6. Admin class stats handles empty users, missing usernames, and large result sets (`src/components/AdminPage.jsx:405`).
  7. Settings modal traps focus and Escape closes it (`src/components/AuthHeader.jsx:188`).
  8. Vocab flashcard is keyboard-operable (`src/components/VocabMode.jsx:46`).
  9. Firestore rules reject extra fields on `quizResults` and `answerEvents` (`firestore.rules:69`).
  10. Rendered Arabic typography passes screenshot checks in light/dark and Madina/Indo-Pak (`src/App.css:135`).

## 9. Repo Hygiene and Security

- **P1** `content/_attachments/` has 30 tracked PDFs totaling about 158 MB; `Tafsir-106.pdf` is
  about 27 MB. Options: Git LFS keeps history stable and makes future clones lighter after migration
  but requires every contributor/deploy environment to have LFS; `git-filter-repo` plus external
  storage produces the cleanest repository but rewrites history and requires coordinated force-push
  and reclones. Do not rewrite history in this phase. Evidence path: `content/_attachments/Tafsir-106.pdf`
  (binary PDF; no line number).
- **P1** Generated/cache files are tracked today: `graphify-out/`, `scripts/__pycache__/`, and
  `content/.obsidian/workspace.json`. Part B adds ignores, but untracking should be deliberate in a
  later cleanup because those paths are outside app code. See `../.gitignore:7`,
  `../.gitignore:8`, and `../.gitignore:9`.
- **P1** `src/.DS_Store` and `src/data/.DS_Store` are inside the app source tree. They should be
  removed from the repo in a cleanup commit because `.DS_Store` is already ignored at repo root.
  Evidence paths: `src/.DS_Store` and `src/data/.DS_Store` (binary metadata; no line number).
- **P1** `npm install` reported 16 vulnerabilities (1 low, 6 moderate, 9 high). Do not run
  `npm audit fix --force` blindly; triage whether they are dev-only transitive packages and whether
  Firebase/Vite upgrades are available. See `package.json:16`, `package.json:22`, and
  `package-lock.json:1`.
- **P2** The one-off patch note `qasas-practice/qasas-ui-patch-header-and-feedback.md` appears
  implemented or superseded: it describes moving leaderboard into home, username menu, quiz focus
  mode, and inline feedback, all of which exist in current code. Keep it only if it is useful as
  historical context; otherwise archive/delete in a docs cleanup. See
  `qasas-ui-patch-header-and-feedback.md:1`, `src/components/HomeScreen.jsx:341`,
  `src/components/AuthHeader.jsx:134`, `src/components/TimedQuiz.jsx:899`, and
  `src/components/TimedQuiz.jsx:653`.
- **P2** Firebase config is correctly sourced from `import.meta.env.VITE_*`, and Part B added
  `.env.example` plus `.env` ignore coverage. See `src/lib/firebase.js:6`,
  `src/lib/firebase.js:11`, `.env.example:1`, `.gitignore:13`, and `.gitignore:15`.

## 10. TypeScript Recommendation

Recommendation: choose **option (b), JSDoc types plus `checkJs` for `src/lib`, `src/hooks`, and
`src/config` with zero file renames**. Stay plain JS for components/data in the near term, but add
typed seams where the app's data contracts and Firestore payloads are concentrated.

Evidence from sections 2 and 3:

- A type system would likely catch **2 of the 15 listed correctness/Firestore risks directly**:
  unsafe indexed/optional reads around current questions and mode config, and nullable user access in
  quiz saving if strict null checks are represented. See `src/components/TimedQuiz.jsx:262`,
  `src/components/TimedQuiz.jsx:407`, `src/components/TimedQuiz.jsx:537`, and
  `src/components/TimedQuiz.jsx:546`.
- A type system would help document but **not catch** timer cleanup, browser history pollution,
  stale async responses, unbounded Firestore reads, missing indexes, or permissive rules. Those are
  lifecycle/database design problems. See `src/components/TimedQuiz.jsx:434`,
  `src/components/TimedQuiz.jsx:370`, `src/components/Leaderboard.jsx:29`,
  `src/lib/quiz.js:249`, `src/components/TimedQuiz.jsx:297`, and `firestore.rules:96`.
- Discriminated-union types on question shapes **would prevent real breakage** around
  `getQuestionTarget` and card renderers. The current code branches by mode and reads
  `target`, `word`, `words[answerIndex]`, `verb`, `ar`, `prompt`, and `arabicText`; a new subject
  or renamed field can silently produce blank result rows or runtime errors. See
  `src/components/TimedQuiz.jsx:52`, `src/components/TimedQuiz.jsx:55`,
  `src/components/TimedQuiz.jsx:59`, `src/components/TimedQuiz.jsx:65`,
  `src/components/TimedQuiz.jsx:67`, `src/components/FiqhQuestionCard.jsx:99`,
  `src/components/HadithQuestionCard.jsx:35`, and `src/components/TafsirQuestionCard.jsx:35`.

Migration estimates:

- **(a) Stay plain JS:** 0-4 hours. No migration work; keep ESLint/Prettier/tests. This preserves
  speed but leaves question-shape and Firestore payload contracts informal. Relevant contracts are at
  `src/lib/quiz.js:46`, `src/lib/question-results.js:23`, and `src/config/subjects.js:8`.
- **(b) JSDoc + `checkJs` for `src/lib`, `src/hooks`, `src/config`:** 16-24 hours. Add
  `tsconfig.json` with `allowJs`/`checkJs`, define shared JSDoc typedefs for quiz modes, topic
  stats, answer events, and question result payloads, then fix surfaced errors without renaming
  files. This targets the highest-value contracts at `src/lib/quiz.js:46`,
  `src/lib/topic-stats-firestore.js:20`, `src/lib/topic-stats.js:20`,
  `src/hooks/useWeaknessTracking.js:10`, and `src/config/subjects.js:8`.
- **(c) Full `.ts`/`.tsx` migration:** 60-90 hours. The data banks, JSX components, Firebase mocks,
  and route components all need typed props and possibly `noUncheckedIndexedAccess` fixes. The
  largest cost is component/data coverage across `src/components/TimedQuiz.jsx:258`,
  `src/components/AdminPage.jsx:31`, `src/data/fiqh/index.js:1`,
  `src/data/hadith/index.js:458`, and `src/data/tafsir/index.js:543`.

What would change my mind: choose full TypeScript if the next phases add more subjects, dynamic
content loading, admin editing, or server-side validation, because question-shape unions would move
from "useful guardrail" to "core architecture." Choose option (a) only if the roadmap is limited to
small CSS/UI fixes and content additions with no Firestore/schema work.
