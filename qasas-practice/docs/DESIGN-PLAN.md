# Qasas Practice Design Plan

This plan is based on `docs/AUDIT.md` section 7, then a read-through of the current route shell, every component file under `src/components/`, and the app CSS files. It keeps the settled manuscript palette exactly as-is: parchment `#faf7f2`, cream `#f5f0e6`, ink `#2c2416`, deep teal `#1a6b6d`, and the existing dark theme under `[data-theme='dark']`.

## 1. Current-State IA Map

### Route And Screen Map

```text
Unauthenticated
  /login
    shows sign-in form, forgot password link, create account link
    on success returns to deep link or /
  /signup
    shows account creation form with optional recovery email
    on success goes to /
  /forgot-password
    shows username reset form
    links back to /login

Authenticated shell
  AuthHeader
    user menu -> /weakness
    user menu -> settings modal
    user menu -> sign out
    admin users -> /admin
    hidden automatically on /quiz/:mode and /quiz/:mode/:topic

Student home
  /
    header identity
    subject doorway: Arabic, Fiqh, Hadith, Tafsir
    subject detail in local state, not its own URL
      Arabic -> mixed morphology review + five Arabic practice modes
      Fiqh -> mixed review + group review + focused topic review
      Hadith -> mixed review + focused Arba'een review
      Tafsir -> mixed MCQ review + surah select for verse-by-verse practice
    quizzes entry -> /quiz
    strength map entry -> /weakness
    leaderboard preview -> /leaderboard
    recent results -> /quiz

Practice
  /practice/irab
  /practice/noun
  /practice/role
  /practice/vocab
  /practice/morphology
    no topic shows internal scope picker
  /practice/morphology/:topic
  /practice/fiqh/:topic
  /practice/hadith/:topic
  /practice/tafsir/:topic
  /practice/tafsir/:topic?variant=verse
    shared PracticeShell for most live questions
    Fiqh/Hadith/Tafsir loading and empty/error states bypass PracticeShell

Quiz
  /quiz
    flat list of quiz modes
    includes today's review, Arabic quiz modes, mixed Tafsir, Fiqh all/groups,
    Hadith topics
  /quiz/:mode
  /quiz/:mode/:topic
    timed question screen
    exit confirmation
    completion results screen
    play again restarts same mode/topic in-place
    home returns to /

Weakness
  /weakness
    Strength Map grouped by Fiqh, Hadith, Tafsir, Arabic
    cells show status, score, attempts
    no action from a weak cell into that exact topic

Leaderboard
  /leaderboard
    mode tabs from QUIZ_MODES
    week/all-time toggle
    table of top 20 plus current user's outside-rank row
  Home leaderboard preview
    separate compact version, same data concept with top 5

Admin
  /admin
    separate admin check
    Bank tab: searchable collapsible question bank
    Class Stats tab: overview cards and sortable student table
    Weakness tab: reteach list, class heatmap, student drill-down

System states
  invalid route
  not found
  admin denied
  route error boundary
  quiz question render fallback
```

### Where The Hierarchy Is Wrong

Home treats "Choose a Subject" as the main action, but after a subject is chosen the student loses the global context. The most important next question is usually "practice, quiz, or review this weak thing?", yet the page splits those into separate vertical sections. Subject detail, quiz entry, strength map, leaderboard, and recent results all compete at the same level.

Arabic is still structurally privileged from the original app. It has five named practice modes and an extra mixed review card; Fiqh has groups plus topics; Hadith has one topic; Tafsir has a special surah selector and verse mode. Those are legitimate subject differences, but the layout makes them feel like unrelated products rather than one study system.

The home identity is still Qasas-specific even though the app now covers Fiqh, Hadith, and Tafsir. That makes the hero text less truthful than the current curriculum.

The quiz question screen gives the timer the center of the header. Under time pressure, the Arabic or prompt should be the visual center. The timer must be glanceable, but not the central object.

The weakness dashboard shows the app's strongest learning signal, but it is passive. A weak topic has no "practice this" or "quiz this" path, so the student must remember the label, return home, pick the right subject, and find the matching topic manually.

### Where The Same Information Appears Two Ways

Home and QuizPicker present subjects differently. Home starts with four subject doorways and then reveals subject-specific choices; QuizPicker is a long flat list mixing today's review, Arabic modes, Tafsir mixed review, Fiqh groups, and Hadith topics.

Tafsir focus appears differently across screens. Home exposes surah selection for verse-by-verse practice, while QuizPicker only exposes mixed Tafsir quiz despite route support for `/quiz/tafsir/:topic`.

Leaderboard appears as a compact preview on Home and a full page with nearly identical mode tabs. The preview and full page share a table component but use separate loading/error/empty copy and spacing.

Loading, empty, and error states vary by screen: TimedQuiz, Leaderboard, LeaderboardPreview, WeaknessDashboard, AdminPage, and the async practice modes each style them differently.

Score/progress appears as top-right score in PracticeShell, central timer header in TimedQuiz, large score reveal in results, table score in leaderboard, and recent-result rows on home. Some variation is expected, but the hierarchy and labels should be more consistent.

### Where Flows Take Too Many Steps

Focused practice from home often takes one extra conceptual step. A student chooses a subject, then scans an entire revealed page for mixed review, group review, or topic review. Fiqh especially requires a long scroll through mixed review, groups, then focused topics.

Focused quiz takes too many steps for Tafsir. The app has topic route support, but the QuizPicker does not expose surah-level quiz choices.

Weakness-to-practice is too long. Current path is `/weakness` -> read weak topic -> `/` -> choose subject -> locate topic -> start practice. It should be one tap from the weak topic cell to the exact practice route, plus an optional timed quiz action.

Returning home mid-practice is visually available as Back, but it is named like browser history, not like the actual action. In practice it exits to Home; in morphology without an initial scope it first returns to the internal scope picker. Those two meanings are easy to confuse.

Play again on quiz results is short and good for repetition, but it should preserve the exact mode/topic in visible copy so students know they are repeating the same bank.

## 2. Layout Proposals

### Home / Subject Selection

#### Option A: Study Desk With Subject Rail

```text
+------------------------------------------------------------+
| account menu                                         user   |
+------------------------------------------------------------+
| Alimiyyah Practice                                         |
| Pick today's work from the lesson table.                   |
+---------------------+--------------------------------------+
| Subjects            | Today's work                         |
| > Arabic            | +----------------------------------+ |
|   Fiqh              | | Continue / Daily review           | |
|   Hadith            | | 15 timed questions                | |
|   Tafsir            | +----------------------------------+ |
|                     | Weak topics                         |
|                     | [Wudhu] [Surah Al-Asr] [Vocab]      |
+---------------------+--------------------------------------+
| Arabic                                                        |
| + Mixed review --------------------------------------------+ |
| | Grammar modes                                             | |
| | I'rab | Noun features | Roles | Vocab | Morphology        | |
+------------------------------------------------------------+
| Recent results                         Leaderboard preview  |
+------------------------------------------------------------+
```

Rationale: This option treats the home screen as a study desk, not a marketing landing page. The left rail makes the four subjects stable and scannable, while the right side keeps today's most useful actions visible: daily review and weak topics. Subject-specific practice stays below as the selected "open book." It removes the current all-or-nothing subject doorway feeling and makes the weakness signal part of the home hierarchy. On mobile, the rail becomes a horizontal subject selector above Today's work.

#### Option B: Subject Ledger

```text
+------------------------------------------------------------+
| Alimiyyah Practice                                  user    |
+------------------------------------------------------------+
| Today                                                       |
| + Daily review ---------+ + Weakest due topic ------------+ |
| | 15 questions          | | Wudhu       Practice | Quiz    | |
| +-----------------------+ +-------------------------------+ |
+------------------------------------------------------------+
| Subjects                                                    |
| Arabic        Practice modes: I'rab, Noun, Role, Vocab...   |
|               Review | Practice | Quiz                      |
| Fiqh          Tahara, Prayer                                |
|               Review | Topics | Quiz                        |
| Hadith        Arba'een                                      |
|               Review | Topic | Quiz                         |
| Tafsir        Surah study                                   |
|               Mixed | Verse-by-verse | Quiz                 |
+------------------------------------------------------------+
| Recent results                                              |
| Leaderboard preview                                         |
+------------------------------------------------------------+
```

Rationale: This option keeps everything in one vertical document and uses a classical ledger rhythm: subject name in the margin, actions in the main column. It is calmer than the current grid of cards, and it makes differences between subjects explicit without forcing every subject into the same shape. It is strongest if the app wants to feel like a course notebook with marginal headings. I recommend Option A because it keeps the next action more visible and handles the growing subject list better.

### Quiz Picker

#### Option A: Same Subject Rail As Home

```text
+------------------------------------------------------------+
| Back to home                         Choose a timed quiz    |
+---------------------+--------------------------------------+
| Today's review      | Details                              |
| > Daily review      | 15 questions                         |
|                     | weak + due topic mix                 |
| Subjects            | [Start today's review]               |
|   Arabic            |                                      |
|   Fiqh              | Arabic                               |
|   Hadith            | + I'rab       10 q 20s  [Start]      |
|   Tafsir            | + Noun        10 q 10s  [Start]      |
|                     | + Roles       10 q 20s  [Start]      |
+---------------------+--------------------------------------+
```

Rationale: This makes QuizPicker feel like the timed counterpart to Home, not a separate index. Today's review remains first because it is the adaptive habit-forming action. Subjects then disclose their timed options with consistent metadata: question count, timer, and focus. It solves the current flat-list scan problem and gives Tafsir a place to expose surah-level quizzes.

#### Option B: Three Lanes

```text
+------------------------------------------------------------+
| Choose a timed quiz                                Back     |
+------------------------------------------------------------+
| Due now                                                    |
| + Today's review                                           |
+------------------------------------------------------------+
| By subject                                                 |
| Arabic: I'rab | Noun | Role | Vocab | Morphology           |
| Fiqh:   Mixed | Tahara | Prayer                            |
| Hadith: Mixed | Arba'een                                   |
| Tafsir: Mixed | Al-Asr | Al-Fil | Quraysh | ...             |
+------------------------------------------------------------+
| Recent quiz                                                |
| Repeat: Tafsir mixed                          [Start]       |
+------------------------------------------------------------+
```

Rationale: This is simpler to build and easier on mobile because it avoids a rail. It makes the current flat list into grouped rows. The downside is that it can become dense as Fiqh and Tafsir grow. I recommend Option A if Home also adopts the rail; choose Option B if implementation needs to be smaller.

### Timed Quiz Question Screen

```text
+------------------------------------------------------------+
| Exit        Question 4 of 10                       Score 2  |
|                                      18s                   |
+------------------------------------------------------------+
|                                                            |
|                 [source/topic, small]                      |
|                                                            |
|        ********************************************        |
|        *                                          *        |
|        *          Arabic / primary prompt         *        |
|        *          generous line height            *        |
|        *                                          *        |
|        ********************************************        |
|                                                            |
|        Instruction or role label                          |
|                                                            |
|        [answer choice]                                     |
|        [answer choice]                                     |
|        [answer choice]                                     |
|                                                            |
+------------------------------------------------------------+
```

Rationale: The timer should live in the top-right area of the header as a compact numeric badge with a quiet decreasing hairline or ring beside it, not in the center. It remains glanceable because it is fixed, high-contrast, and always in the same place; it does not steal the student's first fixation from the Arabic text. The center of the screen belongs to the Arabic display or primary prompt, with answer choices below. On mobile, the header should be a single row: Exit, progress, timer, score. When time falls under 25%, the timer can change color using existing warning/error tokens, but should not pulse.

### Quiz Results Screen

```text
+------------------------------------------------------------+
|                                                            |
|                  You completed Tafsir: Al-Asr              |
|                                                            |
|                   8 / 10                                   |
|              2:14 total time                               |
|              Saved                                         |
|                                                            |
|           [Practice weak topics] [Play again] [Home]       |
+------------------------------------------------------------+
| Question review                                            |
| Q1  Al-Asr 1        correct      12.4s                     |
| Q2  Al-Asr 2        review       18.9s                     |
| Q3  Al-Asr 3        correct      10.1s                     |
+------------------------------------------------------------+
```

Rationale: Results should answer three things in order: what did I just complete, how did I do, and what should I do next. The current screen starts with the score and confetti for high scores, but the learning loop needs stronger next steps. Keep Play Again, but add a primary learning action when missed topics exist: practice weak topics from this attempt. Save status stays near the score because it affects trust. The breakdown remains below, but it should read as review notes rather than celebration debris.

### Practice Mode Question Screen

```text
+------------------------------------------------------------+
| Home / Change topic                         Score 6 / 9     |
+------------------------------------------------------------+
| I'rab Identification                                       |
|                                                            |
|        ********************************************        |
|        *          Arabic sentence / word          *        |
|        ********************************************        |
|                                                            |
| [choice] [choice] [choice]                                 |
|                                                            |
| Feedback appears here after answer                         |
| [Next]                                                     |
+------------------------------------------------------------+
```

Rationale: Practice should feel calmer than quiz but use the same content hierarchy: source/context small, Arabic large, answer controls stable, feedback below. Rename Back to Home or Change topic based on the actual behavior so the navigation is honest. For morphology's internal picker, the first screen should visually match topic selection, then the selected scope should behave like every other practice route.

### Weakness Dashboard

```text
+------------------------------------------------------------+
| Strength Map                                               |
| Recent answers carry the most weight.                      |
+------------------------------------------------------------+
| Due / weak                                                 |
| + Wudhu                 Weak       42%   7 attempts         |
| | Practice exact topic | Timed quiz                         |
| + Surah Al-Asr          Developing 68%   4 attempts         |
+------------------------------------------------------------+
| Fiqh                                                        |
| Tahara                                                     |
| [Najasah weak] [Water strong] [Wudhu weak] ...              |
| Prayer                                                     |
| [Salah developing] [Travel empty] ...                       |
+------------------------------------------------------------+
| Hadith                                                     |
| Tafsir                                                     |
| Arabic                                                     |
+------------------------------------------------------------+
```

Rationale: The dashboard should become the routing hub for improvement. Pull weak/due topics into a top "Due / weak" section with direct Practice and Timed quiz actions. Keep the heatmap for overview, but make cells actionable and consistent with subject routes. This is the app's value proposition: the student sees a weakness and can immediately drill that exact topic.

### Leaderboard

```text
+------------------------------------------------------------+
| Back                                  Speed & Accuracy     |
+------------------------------------------------------------+
| Subject/mode tabs: Review Arabic Fiqh Hadith Tafsir        |
| [mode selector within subject when needed]                  |
| This week | All time                                        |
+------------------------------------------------------------+
| Your best                                                   |
| Rank >20       8 / 10       2:14                            |
+------------------------------------------------------------+
| Rank  Name               Score        Time                  |
| 1     ...                10 / 10      1:22                  |
| 2     ...                 9 / 10      1:31                  |
+------------------------------------------------------------+
```

Rationale: The leaderboard is useful, but the current mode tabs become crowded as modes grow. Group tabs by subject first, then show a second compact selector only when a subject has multiple modes. Bring "Your best" above the table so the student does not have to infer their status from a banner or an outside-rank row. Keep the table restrained and data-focused.

## 3. Flow Changes

Remove the Home subject dead end. Selecting a subject should not replace the whole home context. It should update a stable subject panel while Today's work, weak topics, and recent results remain reachable.

Merge Home and QuizPicker mental models. Use the same subject grouping on both screens: Today, Arabic, Fiqh, Hadith, Tafsir. A student should not have to relearn the course map when switching from practice to quiz.

Expose Tafsir topic quizzes. If `/quiz/tafsir/:topic` is valid, QuizPicker should list Tafsir mixed plus individual surahs.

Make weakness cells actionable. Each topic cell should know its target:
`practicePath({ mode, topic })` for Fiqh/Hadith/Tafsir; `practicePath({ mode })` or morphology scope mapping for Arabic. Add an adjacent timed action where a valid quiz route exists.

Shorten the weak-topic path. Current path: Strength Map -> remember topic -> Home -> subject -> topic. Proposed path: Strength Map -> topic cell -> Practice exact topic. Optional secondary path: Strength Map -> topic cell -> Timed quiz exact topic.

Clarify return home mid-practice. Use "Home" when it exits to `/`. Use "Change morphology scope" when it returns to the internal morphology picker. In timed quiz, keep "Exit quiz" because unsaved progress is at stake.

Preserve exact repeat on Play Again. Results should say "Play Tafsir: Al-Asr again" or equivalent context. The current behavior already restarts the same route; the design should make that visible.

Add a post-results study route. If the quiz records missed topics, show "Practice missed topics" as the primary action. If no missed topics exist, make Play Again primary.

Unify loading/error/empty states. Use one state pattern across Home recent results, Leaderboard, LeaderboardPreview, WeaknessDashboard, TimedQuiz loading, and async practice modes: title, short explanation, optional retry, optional route back.

## 4. Token System

These tokens add structure on top of the existing colors. They do not replace the palette.

### Type Scale

Use Crimson Text for English prose and UI labels, Amiri or the active Arabic script font for Arabic. Arabic gets larger line-height by default; Indo-Pak mode can increase the Arabic line-height token without changing component code.

```css
--font-body: 'Crimson Text', Georgia, serif;
--font-arabic: var(--arabic-font);
--font-data: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

--type-caption: 0.8125rem;  /* 13px, line-height 1.35 */
--type-small: 0.9375rem;    /* 15px, line-height 1.45 */
--type-body: 1rem;          /* 16px, line-height 1.55 */
--type-lead: 1.1875rem;     /* 19px, line-height 1.45 */
--type-title: 1.5rem;       /* 24px, line-height 1.25 */
--type-display: 2rem;       /* 32px, line-height 1.15 */

--arabic-line-compact: 1.75;
--arabic-line-reading: 2.15;
--arabic-line-display: 2.35;
```

For `[data-arabic-script='indopak']`, plan for:

```css
--arabic-line-compact: 2;
--arabic-line-reading: 2.45;
--arabic-line-display: 2.75;
```

### Spacing Scale

4px base, eight steps:

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-5: 1.5rem;  /* 24px */
--space-6: 2rem;    /* 32px */
--space-7: 3rem;    /* 48px */
--space-8: 4rem;    /* 64px */
```

### Radii

Cards are kept at 8px or less unless a control is intentionally pill-shaped.

```css
--radius-sm: 4px;       /* highlights, small badges */
--radius-md: 8px;       /* cards, inputs, panels */
--radius-pill: 999px;   /* status chips only */
```

### Shadows

Light theme:

```css
--shadow-rest: 0 1px 2px rgba(44, 36, 22, 0.08);
--shadow-lift: 0 8px 20px rgba(44, 36, 22, 0.12);
--shadow-overlay: 0 18px 48px rgba(44, 36, 22, 0.22);
```

Dark theme:

```css
--shadow-rest: 0 0 0 1px rgba(243, 234, 219, 0.06);
--shadow-lift: 0 8px 24px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(243, 234, 219, 0.08);
--shadow-overlay: 0 24px 64px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(243, 234, 219, 0.1);
```

The dark shadows include a light edge because black-alpha alone disappears against `#181713`.

### Motion

```css
--duration-instant: 80ms;
--duration-fast: 150ms;
--duration-base: 220ms;
--duration-slow: 360ms;

--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-enter: cubic-bezier(0, 0, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
```

Use motion only for state clarity: menu open, answer feedback, modal enter, and the one signature element. Respect `prefers-reduced-motion`.

### Z-Index

```css
--z-base: 0;
--z-sticky: 20;   /* quiz header, fixed navigation */
--z-header: 50;   /* AuthHeader */
--z-dropdown: 100;
--z-modal: 200;
--z-toast: 300;
```

### Touch Target

Every interactive control should be at least:

```css
--touch-target-min: 44px;
```

This includes text links that act like buttons, tabs, table row actions, heatmap cells, and icon-only controls.

## 5. Signature Element

Pick exactly one memorable treatment: the Arabic display inside question screens.

The primary Arabic text should sit in a "teaching folio" panel: cream surface, very restrained border, slightly heavier block-start and block-end rules in accent-light, generous script-aware line-height, and a narrow marginal metadata rail for source/ayah/hadith/topic when available. The text itself remains the center: no busy ornament, no animation around every card, no decorative geometry competing with the script. For I'rab and role questions, the target highlight becomes an inline annotation treatment inspired by manuscript gloss: accent underline plus a soft wash, with enough vertical padding to avoid clipping diacritics. For Tafsir and Hadith, the source badge moves into the margin rather than sitting above as a separate chip row.

This is the one place the app should feel distinctive. Results, dashboards, tabs, and cards stay quiet.

## 6. Self-Critique And Replacements

Generic default: card grid with icons on Home. The current subject cards and quiz entry cards lean this way. Replacement: use a study-desk or ledger structure where subject names act like marginal headings and actions sit as text-led rows. Icons are not needed to explain Fiqh, Hadith, Tafsir, or Arabic.

Generic default: circular progress ring for timer. The current quiz puts a timer ring in the center of the header. Replacement: a compact timer badge in the upper-right header with a quiet rule or small inline ring, because the Arabic must stay central under time pressure.

Generic default: big number plus confetti for results. Replacement: a restrained completion folio with score, saved state, and next study action. The student's next topic matters more than celebration effects.

Generic default: heatmap as colored cards only. Replacement: weakness cells behave like marginalia in a lesson text: concise status, score/attempt notes, and direct "practice this" action. The map should read as study guidance, not just analytics.

Generic default: gradient accent call-to-action. The current home quiz entry uses a teal gradient. Replacement: use the settled accent as a flat, serious action color and reserve visual richness for the Arabic folio.

Generic default: subject tabs everywhere. Replacement: subject grouping is useful, but it should carry course structure. Fiqh can show Tahara/Prayer, Tafsir can show surahs, Arabic can show grammar/vocabulary/morphology, and Hadith can show collections. The grouping must reflect the material, not merely product navigation.

## 7. Risk List

Home IA redesign:
Risk: students may not immediately find a mode they used before. Notice by checking that every current practice path remains reachable from Home in one or two taps and by testing keyboard navigation through the new subject selector.

Home identity update:
Risk: changing Qasas-specific identity could feel like a product rename. Notice by reviewing all auth, error, title, and header copy for consistent naming before implementation.

QuizPicker grouping:
Risk: hidden subject sections could make starting a familiar quiz slower. Notice by counting taps from `/quiz` to each existing quiz mode and ensuring no existing quiz takes more taps than today, except where a subject disclosure is deliberately chosen and visible.

Tafsir topic quiz surfacing:
Risk: route support may exist while bank loading behavior has edge cases for individual surahs. Notice by running each Tafsir topic quiz route and verifying it loads non-empty questions or a clear empty state.

Timed quiz header and timer move:
Risk: timer may become too subtle under pressure. Notice with mobile and desktop screenshots at full time, 50%, and 25%, plus a quick timed manual run to confirm the countdown is visible without drawing the eye away from the Arabic.

Arabic folio treatment:
Risk: diacritics or Indo-Pak Nastaleeq glyphs could clip if padding/line-height is too tight. Notice by checking light/dark x Uthmani/Indo-Pak screenshots for I'rab, Hadith, Tafsir, and morphology.

Practice navigation labels:
Risk: renaming Back to Home or Change topic could miss one special route behavior. Notice by manually entering `/practice/morphology`, `/practice/morphology/past`, and non-morphology routes and checking each label matches what happens.

Weakness direct actions:
Risk: topic codes may not map one-to-one to route topics for Arabic morphology subtopics. Notice by auditing `ARABIC_TOPICS`, `MORPHOLOGY_TOPICS`, and `practicePath()` mappings before wiring actions; unresolved mappings should show no direct action rather than a wrong one.

Post-results missed-topic action:
Risk: quiz result records may not currently retain enough topic detail for every renderer. Notice by inspecting `engine.results` payloads for all modes before designing the action's data contract.

Unified state components:
Risk: a shared empty/error component could flatten important context-specific copy. Notice by reviewing each state for the correct action: retry, go home, skip question, or start a quiz.

Leaderboard subject grouping:
Risk: changing mode tabs could obscure exact ranking mode, especially Arabic's multiple modes. Notice by ensuring the active mode label is always visible above the table and that leaderboard queries still receive the same `mode` and `bankSource`.

Token rollout:
Risk: replacing one-off values could unintentionally alter layout density across admin and auth screens. Notice by scoping student-facing tokens first, then reviewing admin/auth separately before applying global class changes.

Motion restraint:
Risk: removing confetti or hover lifts could make the app feel less responsive. Notice by preserving immediate answer feedback, clear focus states, and small state transitions while avoiding decorative animation.

Touch target enforcement:
Risk: tables and compact tabs may become too tall on mobile. Notice by checking that 44px controls do not push primary content below the fold in timed quiz and leaderboard.

Dark-theme shadows:
Risk: new edge shadows could look like bright outlines if overused. Notice by testing overlays, dropdowns, and cards in dark mode and limiting shadows to lifted or modal surfaces.
