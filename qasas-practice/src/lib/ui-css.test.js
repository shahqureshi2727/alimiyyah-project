import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '..');

function css(path) {
  return readFileSync(resolve(srcRoot, path), 'utf8');
}

function rulesForSelector(content, selector) {
  const matches = [];
  const rules = content.matchAll(/([^{}]+)\{([^{}]*)\}/g);

  for (const rule of rules) {
    const selectors = rule[1].split(',').map((part) => part.trim());
    if (
      selectors.some(
        (part) =>
          part === selector || part.endsWith(`\n${selector}`) || part.endsWith(` ${selector}`)
      )
    ) {
      matches.push(rule[2]);
    }
  }

  return matches.join('\n');
}

describe('theme CSS', () => {
  test('defines the approved design token system without changing color names', () => {
    const appCss = css('App.css');
    const requiredTokens = [
      '--font-body',
      '--font-arabic',
      '--font-data',
      '--type-caption',
      '--type-small',
      '--type-body',
      '--type-lead',
      '--type-title',
      '--type-display',
      '--arabic-line-compact',
      '--arabic-line-reading',
      '--arabic-line-display',
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-4',
      '--space-5',
      '--space-6',
      '--space-7',
      '--space-8',
      '--radius-sm',
      '--radius-md',
      '--radius-pill',
      '--shadow-rest',
      '--shadow-lift',
      '--shadow-overlay',
      '--duration-instant',
      '--duration-fast',
      '--duration-base',
      '--duration-slow',
      '--ease-standard',
      '--ease-enter',
      '--ease-exit',
      '--z-base',
      '--z-sticky',
      '--z-header',
      '--z-dropdown',
      '--z-modal',
      '--z-toast',
      '--touch-target-min',
    ];

    for (const token of requiredTokens) {
      expect(appCss, `App.css should define ${token}`).toContain(token);
    }
  });

  test('dark theme shadow tokens include a light edge so elevation remains visible', () => {
    const darkTheme = rulesForSelector(css('App.css'), ":root[data-theme='dark']");

    expect(darkTheme).toMatch(/--shadow-rest:[^;]*rgba\(243,\s*234,\s*219,\s*0\.06\)/);
    expect(darkTheme).toMatch(/--shadow-lift:[^;]*rgba\(243,\s*234,\s*219,\s*0\.08\)/);
    expect(darkTheme).toMatch(/--shadow-overlay:[^;]*rgba\(243,\s*234,\s*219,\s*0\.1\)/);
  });

  test('Arabic script modes provide fallback fonts and script-aware line heights', () => {
    const appCss = css('App.css');
    const indopak = rulesForSelector(appCss, ":root[data-arabic-script='indopak']");

    expect(indopak).toMatch(/--arabic-font:[^;]*Indopak Nastaleeq[^;]*Noto Nastaliq Urdu[^;]*Amiri/);
    expect(indopak).toMatch(/--arabic-line-compact:\s*2\b/);
    expect(indopak).toMatch(/--arabic-line-reading:\s*2\.45\b/);
    expect(indopak).toMatch(/--arabic-line-display:\s*2\.75\b/);
  });

  test('uses semantic text tokens instead of hardcoded dark text colors', () => {
    const files = [
      'index.css',
      'components/WeaknessDashboard.css',
      'components/Auth.css',
      'components/AdminPage.css',
      'components/LeaderboardTable.css',
      'components/FiqhQuestionCard.css',
      'components/TimedQuiz.css',
    ];

    const disallowedTextColors = [
      '#2c2416',
      '#b91c1c',
      '#b45309',
      '#6b6252',
      '#7a5c1e',
      '#166534',
      '#c2410c',
      '#1d4ed8',
      '#7c3aed',
      '#db2777',
      '#0d9488',
      '#d4af37',
      '#a8a8a8',
      '#cd7f32',
      '#22863a',
      '#d1242f',
      '#4a4030',
      '#d97706',
      '#6b8e5a',
      '#a65d57',
    ];

    for (const file of files) {
      for (const color of disallowedTextColors) {
        expect(css(file), `${file} should not hardcode text color ${color}`).not.toMatch(
          new RegExp(`(^|[;{]\\s*)color:\\s*${color.replace('#', '\\#')}\\b`, 'i')
        );
      }
    }
  });

  test('key interactive controls meet the 44px touch target minimum', () => {
    const selectorsByFile = {
      'components/HomeScreen.css': [
        '.subject-card',
        '.mode-card',
        '.quiz-entry-card',
        '.try-quiz-link',
      ],
      'components/TimedQuiz.css': [
        '.exit-quiz-btn',
        '.quiz-choice-btn',
        '.quiz-option-btn',
        '.quiz-check-btn',
        '.quiz-tappable-word',
        '.grade-btn',
        '.exit-dialog-btn',
        '.play-again-btn',
        '.home-btn',
      ],
      'components/ModeCommon.css': [
        '.back-btn',
        '.choice-btn',
        '.option-btn',
        '.check-btn',
        '.next-btn',
        '.tappable-word',
        '.grade-btn',
        '.morphology-scope-card',
      ],
      'components/AuthHeader.css': [
        '.user-menu-trigger',
        '.user-menu-item',
        '.settings-close',
        '.settings-option',
      ],
      'components/QuizPicker.css': ['.back-btn', '.quiz-start-btn'],
      'components/AdminPage.css': [
        '.back-to-home-btn',
        '.admin-tab',
        '.section-header',
        '.student-select',
      ],
      'components/Auth.css': ['.auth-btn'],
      'components/Leaderboard.css': ['.back-btn', '.mode-tab', '.time-btn'],
      'components/LeaderboardPreview.css': ['.preview-mode-tab', '.preview-view-full'],
      'components/FiqhQuestionCard.css': ['.fiqh-choice-btn'],
      'components/HadithQuestionCard.css': ['.hadith-choice-btn'],
    };

    for (const [file, selectors] of Object.entries(selectorsByFile)) {
      const content = css(file);
      for (const selector of selectors) {
        expect(
          rulesForSelector(content, selector),
          `${file} ${selector} should define the 44px touch target minimum`
        ).toMatch(/min-height:\s*(44px|var\(--touch-target-min\))/);
      }
    }
  });

  test('Hadith Arabic text uses the shared script font variable', () => {
    expect(
      rulesForSelector(css('components/HadithQuestionCard.css'), '.hadith-arabic-text')
    ).toMatch(/font-family:\s*var\(--arabic-font\)/);
  });
});
