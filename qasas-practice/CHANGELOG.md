# Changelog

This project was developed in phases before a formal changelog existed. The entries below summarize the completed Phase 1-10 work visible in the repository history and planning docs.

## Unreleased

### Phase 1 - Audit, CI, And Guardrails

- Added a repo/app audit in `docs/AUDIT.md`.
- Tightened ESLint coverage and added CI/repo hygiene baseline work.
- Documented high-risk architecture, Firestore, accessibility, performance, and testing issues for later phases.

### Phase 2 - Routing And Quiz/Weakness Foundations

- Moved practice and quiz screens onto React Router routes.
- Refactored quiz persistence and weakness tracking flow.
- Fixed quiz score display to use the actual saved `total`, including 15-question review quizzes.

### Phase 3 - Timed Quiz, Practice, And Admin Refactors

- Split the timed quiz engine into hook/renderer pieces.
- Shared more practice-session behavior across modes.
- Split admin data views and improved query/repository test coverage.

### Phase 4 - Firestore Rules And Indexes

- Refactored quiz persistence repositories.
- Added Firestore index definitions for leaderboard, recent-result, missed-answer, and topic-stat reads.
- Strengthened rules around append-only quiz results and answer events.

### Phase 5 - Lazy Loading And Bundle Guardrails

- Deferred question-bank loading with dynamic imports.
- Split protected app startup so initial load does less work.
- Added bundle budgets, Lighthouse CI config, and bundle analysis tooling.
- Added Sentry dependency/configuration with lazy runtime loading and sanitized events.

### Phase 6 - Design Token Foundation

- Added design token foundations in CSS.
- Tokenized question-card styles and broader component styling.
- Preserved the existing light/dark theme model and Arabic script attribute model.

### Phase 7 - Home, Quiz Picker, And Strength Map UX

- Redesigned the home study desk.
- Grouped the quiz picker by subject.
- Made the strength map more actionable.
- Refined leaderboard layout.

### Phase 8 - Practice And Timed Quiz UI Refinement

- Refined practice question layout.
- Refined timed quiz flow.
- Kept the mobile quiz header compact.

### Phase 9 - Branding, Emulator, And Test Tooling

- Renamed visible app branding toward Alimiyyah Practice.
- Added emulator and test tooling setup for Firestore rules and E2E coverage.
- Updated app metadata and route titles for the broader subject scope.

### Phase 10 - Security Headers And Documentation

- Added Vercel security headers including CSP in report-only mode, HSTS, nosniff, referrer policy, and permissions policy.
- Added cache headers for immutable hashed assets and non-cached SPA shell responses.
- Rewrote the app README.
- Added architecture and content documentation.
- Replaced root agent instructions with stable repo conventions.

