<claude-mem-context>
# Memory Context

# [alimiyyah-project-main] recent context, 2026-07-23 4:35pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (21,215t read) | 1,340,916t work | 98% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 14, 2026
557 7:43p ✅ firestore.rules + AdminPage.css Updated — Step 6 Fully Complete
562 7:46p 🔵 firestore.rules Final State Verified — All 4 Collections Secured
563 " 🔵 answerEvents Query Uses Two Equality Filters — No Composite Index in firestore.indexes.json
564 " 🔵 qasas-practice Tech Stack — React 19, Firebase 12, Vite 8, vitest 4 (ESM)
565 7:47p ✅ firestore.indexes.json Extended with Two Per-User quizResults Composite Indexes
566 " 🔵 Git Status Shows Only 2 Unstaged Files — Majority of Weakness Finder Changes Were Committed
567 7:48p 🔵 Firebase Deploy Blocked — No Auth Credentials in Codex Environment
568 8:04p ⚖️ New Requirement: Extend Weakness Tracking to All Quiz Modes, Not Just TimedQuiz
569 8:05p 🔴 All Five Non-Timed Quiz Components Identified and Analyzed
570 " 🔴 Implementation Pattern for Per-Answer Tracking in Infinite Practice Modes
571 8:09p 🔴 Weakness Tracking Extended to All Quiz Modes — Clean Implementation Complete
572 " ⚖️ Pending: Commit Weakness-Tracking Changes Then Push Branch
### Jul 23, 2026
651 3:49p 🔵 Quiz System: Correct Answer Always First Option Bug Identified
652 3:50p 🔵 Quiz System: 9 Components Contain Multiple-Choice / Correct-Answer Logic
653 " 🔵 Confirmed: `answerIndex`-Based Correctness Bug in FiqhQuestionCard and TimedQuiz; `shuffleArray` Duplicated 7 Times
654 3:52p 🔵 Fiqh Data Bank: Vast Majority of MCQ Questions Have `answerIndex: 0`
655 " 🔵 MorphologyMode Is Correct; FiqhQuestionCard and TimedQuiz Morphology Path Are the Only Broken Sites
656 3:53p 🔵 RoleMode Uses `answerIndex` Correctly; AdminPage Display Uses It Safely; No Hardcoded `options[0]` Patterns Anywhere
657 " 🔵 TimedQuiz Morphology Path: Options Shuffled But Correctness Still Checked By Original Index — Live Bug Confirmed
658 3:54p 🔵 Correction: TimedQuiz Morphology Path Is Value-Based and Correct — Only FiqhQuestionCard MCQ Is Buggy
659 " 🔵 Project Uses `eslint-plugin-react-hooks` with `exhaustive-deps` — Fix Must Declare `useMemo` Dependencies Correctly
660 3:55p 🔵 Pre-Fix Baseline: Lint Passes Clean; `src/hooks/` Contains Only `useWeaknessTracking.js`
661 " 🔵 Test Files Exist Only in `src/lib/` — No Component or Hook Tests Present
662 " 🔵 Test Setup: Vitest 4.x with No jsdom or Testing Library — Hook Tests Must Target Pure Functions
663 " 🔵 TimedQuiz Architecture: `shuffleMorphologyOptions` Applied at Question Selection Time, Not Render Time; Fiqh MCQ Bug Also Affects Review Mode
664 " 🔵 TimedQuiz Question Preparation: Morphology Options Shuffled Once at Mount; Fiqh MCQ Options Pass Through Unmodified
665 " 🔵 No Biased `array.sort(() => Math.random())` Shuffle Exists Anywhere in the Codebase
666 3:56p 🔵 Complete `src/lib/` and `src/hooks/` Directory Contents Confirmed Before Implementation
667 " 🟣 Created `src/lib/shuffle.test.js` with Three Fisher-Yates Correctness Tests
668 3:57p 🟣 TDD Red Phase Confirmed: `shuffle.test.js` Fails with "Cannot find module './shuffle'"
669 " 🟣 Created `src/lib/shuffle.js` and `src/hooks/useShuffledOptions.js` — Shared Shuffle Infrastructure Now Exists
670 3:58p 🔴 FiqhQuestionCard: `useShuffledOptions` Hook Wired In — MCQ Options Now Shuffle Per Question
671 " 🔴 FiqhQuestionCard MCQ Bug Fixed: Options Now Shuffled and Correctness Determined by Value
672 " 🔄 Deduplication Started: Local `shuffleArray` Removed from `FiqhPracticeMode.jsx`, Replaced with Shared Import
673 " 🔄 Local `shuffleArray` Removed from `IrabMode.jsx` and `NounMode.jsx` — Shared Import Added
674 3:59p 🔄 Local `shuffleArray` Removed from `RoleMode.jsx` and `VocabMode.jsx` — 6 of 7 Duplicates Now Eliminated
675 " 🔵 MorphologyMode Has a Broken `shuffleOptions` Reference After Refactor — Immediate Follow-up Edit Required
676 " 🔄 MorphologyMode Fully Refactored: Local Shuffle Removed, `useShuffledOptions` Wired In, Render Updated
677 4:00p 🔴 TimedQuiz.jsx: Local `shuffleArray` Deleted, Shared Import Added — `shuffleMorphologyOptions` Retained and Now Uses Shared Implementation
S68 Fix quiz bug where correct answer is always first option shown — shared-level Fisher-Yates shuffle + value-based correctness refactor across all quiz components (Jul 23 at 4:03 PM)
680 4:04p ⚖️ UI Bug Fix Plan: Dark Mode Contrast + Button Spacing
681 " 🔵 alimiyyah-project: No Tailwind Config Found; Component-Scoped CSS Architecture
682 " 🔵 No Dark Mode Implemented at All in qasas-practice
683 " 🔵 Pre-existing Uncommitted Work: Shuffle Utilities and Quiz Mode Refactors
684 4:05p 🔵 Dark Mode Strategy: data-theme Attribute on :root via SettingsContext
685 " 🔵 Dark Mode Contrast Bug: Hardcoded Light Hex Colors in Component CSS Files
686 " 🔵 Button Spacing Bug: Timed Quizzes and Strength Map Cards Have No Gap
687 " 🔵 WeaknessTracking Already Integrated Across All Quiz Mode Components
688 4:06p 🔵 Complete Hardcoded Color Audit: Full Line-by-Line Findings Across All CSS Files
689 " 🔵 Touch Target Audit: All Interactive Controls Meet 44px Minimum
690 4:09p 🔴 Both UI Bugs Fully Fixed: All Tests Pass, Build Clean

Access 1341k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>