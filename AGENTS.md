<claude-mem-context>
# Memory Context

# [alimiyyah-project-main] recent context, 2026-07-23 5:33pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (22,815t read) | 1,690,603t work | 99% savings

### Jul 13, 2026
S61 graphify . on alimiyyah-project-main — parallel knowledge graph extraction in progress, 6 of 9 chunks now complete (Jul 13 at 9:46 PM)
S62 graphify . on alimiyyah-project-main — persistent polling loop waiting for PDF extraction chunks 01, 03, 04 to complete (Jul 13 at 9:46 PM)
### Jul 23, 2026
663 3:55p 🔵 TimedQuiz Architecture: `shuffleMorphologyOptions` Applied at Question Selection Time, Not Render Time; Fiqh MCQ Bug Also Affects Review Mode
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
691 4:19p 🔵 topicStats not written after quiz submission — user-reported bug
695 4:27p 🔴 topicStats write bug resolved — Strength Map flow verified working end-to-end
696 4:28p 🟣 TDD RED phase started for aggregateTopicStatsFromEvents — historical migration utility
692 4:36p 🟣 topic-stats migration fully implemented and verified — lint, tests, build all green
693 " 🔵 firestore.indexes.json missing topicStats COLLECTION_GROUP index — admin Strength Map will fail
694 " 🔵 Root cause hypothesis for topicStats not appearing: Firestore rule rejects transaction write
697 4:52p 🔴 aggregateTopicStatsFromEvents implemented — TDD GREEN phase in progress
699 " 🟣 Migration script created: scripts/migrate-topic-stats.mjs with dry-run/apply modes
700 " 🔴 weakness-finder-plan.md updated to reflect shipped topicStats model — weaknessProfiles marked legacy
703 4:54p 🔴 Migration script fails: Node ESM requires explicit .js extensions on source imports
704 4:59p 🔴 Fixed ESM import extensions in topic-stats.js and weakness.js for Node compatibility
705 " 🔴 ESM extension fix verified — topic-stats imports correctly in raw Node.js, all gates pass
706 5:01p 🔵 Production Firestore confirmed: 36 topicStats docs across 4 users — collectionGroup query works
707 5:02p 🟣 Historical migration completed: 142 answerEvents → 36 topicStats docs written to production
708 5:04p 🔵 alimiyyah-implementation-plan.md: full 4-phase product roadmap with Phase 1 (Strength Map) now complete
709 5:05p 🔵 Phase 0 shuffle fix is already shipped — answerIndex is positional in data but UI compares by value after shuffle
710 5:29p 🔵 Alimiyyah Hadith PDF Collection Identified for Conversion
711 5:30p 🔵 alimiyyah-project-main: Existing Fiqh Quiz Architecture and Question Format
712 " 🔵 Hadith PDF Inventory: 25 Files Confirmed, Hadith 8 and 25 Missing
713 " 🔵 Hadith PDFs Are Canva Slide Decks — File Names Don't Match Hadith Numbers Inside
715 " 🟣 Hadith PDF Extraction Script Created: scripts/extract-hadith-sources.py
714 5:31p 🔵 Hadith PDF Page Count Inventory — Higher Page Counts Signal Multi-Hadith Files
716 " 🟣 Hadith Content Layer Bootstrapped: 195 Source Records Extracted Across 25 Decks
717 5:32p 🔵 Hadith Content Layer Validated and Untracked — Arabic RTL Text Preserved in CSV

Access 1691k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>