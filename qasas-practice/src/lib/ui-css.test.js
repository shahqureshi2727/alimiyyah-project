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
        (part) => part === selector || part.endsWith(`\n${selector}`) || part.endsWith(` ${selector}`)
      )
    ) {
      matches.push(rule[2]);
    }
  }

  return matches.join('\n');
}

describe('theme CSS', () => {
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
      'components/AdminPage.css': ['.back-to-home-btn', '.admin-tab', '.section-header', '.student-select'],
      'components/Auth.css': ['.auth-btn'],
      'components/Leaderboard.css': ['.back-btn', '.mode-tab', '.time-btn'],
      'components/LeaderboardPreview.css': ['.preview-mode-tab', '.preview-view-full'],
      'components/FiqhQuestionCard.css': ['.fiqh-choice-btn'],
    };

    for (const [file, selectors] of Object.entries(selectorsByFile)) {
      const content = css(file);
      for (const selector of selectors) {
        expect(
          rulesForSelector(content, selector),
          `${file} ${selector} should define min-height: 44px`
        ).toMatch(/min-height:\s*44px/);
      }
    }
  });
});
