# Update Prompt — UI Patch: Header rework, quiz focus mode, inline feedback

Small UI cleanup pass. No new features, no data model changes, no Firestore changes.
Four coordinated adjustments to the existing app:

1. Move the leaderboard entry point off the top header and onto the home page.
2. Rework the top header so the username is the menu (tap to reveal Sign out).
3. Hide the header entirely during a quiz, with a small Exit-quiz button in its place.
4. Replace the overlay checkmark/X feedback during quizzes with inline coloring
   directly on the answer choices.

---

## 1. Move the leaderboard entry to the home page

Remove the "Leaderboard" button from the top header. Do NOT remove the `/leaderboard`
route or the LeaderboardPage component — direct URL access still works for anyone who
bookmarks it.

On the home page, add a new **"Leaderboard"** section positioned:

- **Above** "Your recent results" (public → personal reads naturally).
- **Below** the mode cards (untimed practice + Quizzes).

This section should be a compact preview, not the full leaderboard page:

- A section heading "Leaderboard" with a small "This week" subtitle.
- A tab strip for the four modes (I'rab · Noun Features · Roles · Vocab), same as
  the full leaderboard page. Default to the mode the user most recently played, else
  I'rab.
- Show the **top 5** for the selected mode/window (not top 20 — that's the full page).
  Same columns: rank, username, score, time. Highlight the current user's row if
  present.
- A "View full leaderboard →" link at the bottom of the section that navigates to
  `/leaderboard` (which keeps the top-20, all-time toggle, and out-of-top-N "You: #47"
  behavior from Pass 2).
- If the current user has no result this week in the selected mode, show the same
  inline banner as the full page: "Take a quiz in this mode to appear on the
  leaderboard."

The compact preview should reuse the LeaderboardTable component from Pass 2 with a
`limit` prop (default 20 on the full page, 5 here) rather than being a separate
implementation — keep the query and rendering logic single-sourced.

## 2. Header rework: username-as-menu

Remove the persistent "Sign out" button from the top header. Instead:

- The header shows the app title/logo on the left and the **username** on the right,
  styled as a tap target (subtle underline on hover, a small chevron `▾` after it to
  hint it opens something).
- Tapping the username opens a small dropdown/popover with a single item: **Sign out**.
  Later passes may add more items (e.g. "Change password") — leave the dropdown
  structure obviously extensible.
- Dropdown behavior: opens on tap, closes on tap outside, closes on Escape, closes
  after any item is selected. On mobile it should render as a small anchored menu,
  not a full-screen sheet — this is a lightweight menu, not a page.
- For admins, add an **Admin** menu item above Sign out. This is a small, deliberate
  concession: admins have already been promoted via the Firebase Console, so revealing
  the `/admin` route to them here doesn't create the exposure risk that a general
  "Admin" button in the header would. Non-admins never see this item because their
  role check returns false. (Continue to render the 404-style page if a non-admin
  reaches `/admin` directly — the menu item is a convenience, not the access control.)

Accessibility:
- The username button needs `aria-haspopup="menu"` and `aria-expanded` state.
- Menu items use `role="menuitem"`.
- Keyboard navigation: Enter/Space opens, ArrowDown/ArrowUp move between items,
  Enter activates, Escape closes.

## 3. Quiz focus mode: hide the header, add Exit quiz

While a quiz is in progress (from "Start" through the final question submission,
but NOT on the results screen), the top app header is completely hidden. In its
place, a small **Exit quiz** control appears in the top-left corner:

- Text: "Exit quiz" (not just an X icon on its own — the label matters for
  accessibility and clarity).
- Small, understated — this is an escape hatch, not a primary action. The countdown
  ring and question content remain the emotional focus.
- On tap, show a confirmation dialog: **"Exit quiz? Your progress won't be saved."**
  with **"Cancel"** and **"Exit"** buttons. Default focus on Cancel (safer default).
- If confirmed: pause the timer (already paused during the dialog is fine),
  discard all quiz state, do NOT write a quizResults document to Firestore, navigate
  back to the home screen. Nothing about this attempt should persist anywhere.
- The confirmation dialog uses the same style as any other modal in the app.

The header returns as normal on the results screen (after question 10 submits) —
students will want to navigate away from there.

Edge case: if the browser back button is pressed mid-quiz, treat that the same as
Exit — show the confirmation. (This may require blocking the navigation with the
router's leave guard.) Don't silently lose the quiz to a stray back-swipe.

## 4. Inline answer feedback (remove the overlay)

Currently, the quiz shows a floating checkmark or X modal in front of the answer
choices for ~1 second after each answer. This blocks visibility of what was
answered. Replace it as follows:

### For multiple-choice modes (I'rab):

- On tap, the tapped choice takes on a colored state:
  - Correct → green background + subtle inline ✓ inside the choice tile.
  - Wrong → red background + subtle inline ✗ inside the choice tile.
- If the tap was wrong, ALSO highlight the correct choice with a softer green outline
  (no icon) so the student sees what the right answer was.
- The other, untapped, unrelated choices dim slightly (~50% opacity) so the eye is
  drawn to the answered/correct pair.
- Everything stays in place — no floating overlay, no shift, no cover.
- Dwell time before auto-advance: same ~1 second as before.

### For noun-feature tagging:

- After "Check" is tapped, each of the three tag groups shows its result inline:
  - Each individual tag (definite/indefinite, m/f, sing/dual/plural) that was
    tapped correct → green tint + ✓ next to it.
  - Each tapped wrong → red tint + ✗, and the correct tag in that group gets a
    softer green outline.
- No floating overlay.

### For tap-the-word (grammatical role):

- The word the student tapped colors green (correct) or red (wrong) in place.
- If wrong, the correct word ALSO highlights with a softer green outline.
- All other words in the sentence dim slightly.

### For vocab flashcards:

- The self-graded "Knew it" / "Didn't know" buttons briefly color to confirm the
  choice was registered — green for "Knew it" tapped, neutral gray for "Didn't
  know" tapped (this isn't a right/wrong scenario, it's self-report, so no red).
- No floating overlay.

### Color choices:

- Correct green: a calm, muted green that fits the app's existing warm palette —
  NOT bright neon. Aim for something like the color of an olive leaf. About 65%
  saturation, medium lightness. Same green throughout.
- Wrong red: a warm, restrained red — think dried brick, not fire-engine red.
  Same restraint as the green.
- Dim state: reduce opacity on untapped/unrelated elements to about 45%.
- Ensure adequate contrast: the ✓ and ✗ marks must be clearly readable against
  the tinted background. Test with the current app palette.

## 5. Timing and animation

- The ~1s dwell before auto-advance is unchanged.
- The color transition on tap should be immediate (no fade-in) — students should
  feel the response is instant. The dim-others transition can be a subtle
  ~150ms fade to avoid feeling jarring.
- The advance to the next question can use a very brief slide/fade (~200ms) —
  keep it subtle. The countdown ring should reset on the new question without
  visible flicker.

## What must NOT change

- The four practice modes' untimed behavior is unchanged. This patch only affects
  the quiz mode and the top-level header/home.
- Firestore rules, indexes, and data model are unchanged.
- The Class Stats admin tab is unchanged.
- The bank in `src/data/bank.js` is unchanged.
- The results screen (score summary + per-question breakdown + Play again / Home)
  is unchanged. Inline feedback applies only during questions, not on the
  end-of-quiz recap.

## Acceptance checklist

- [ ] The top header no longer has a Leaderboard button.
- [ ] The home page shows a Leaderboard preview section above "Your recent results",
      with mode tabs and top-5 rows and a "View full leaderboard →" link.
- [ ] Tapping the username in the header opens a small dropdown with Sign out (and
      Admin, for admin users), closes on outside tap and Escape, and is keyboard-
      navigable.
- [ ] During a quiz, the top header is hidden. A small "Exit quiz" control is present
      in the top-left.
- [ ] Tapping Exit quiz shows a confirmation dialog; confirming discards the quiz
      without writing to Firestore; cancelling returns to the question in progress.
- [ ] Browser back mid-quiz triggers the same confirmation.
- [ ] Inline feedback replaces the floating overlay: tapped-correct is green with
      ✓ inline, tapped-wrong is red with ✗ inline plus the correct answer softly
      outlined, other choices dim.
- [ ] All four mode types (i'rab, noun features, roles, vocab) use the appropriate
      inline feedback pattern.
- [ ] The header returns to normal on the results screen at end of quiz.
- [ ] The `/leaderboard` route and LeaderboardPage still function via direct
      navigation.

## After building

Print a short summary of the four changes and remind me to sanity-check them by:
1. Starting a quiz — confirm the header is gone and Exit quiz works.
2. Answering a question wrong on purpose — confirm inline red + correct-answer
   outline, no overlay.
3. Tapping the username — confirm the dropdown opens with Sign out.
4. Returning to the home page — confirm the Leaderboard preview shows and links
   through to the full leaderboard.
