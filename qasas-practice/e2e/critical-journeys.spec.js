import { expect, test } from '@playwright/test';
import {
  clearEmulators,
  documentExists,
  seedQuizResult,
  seedUser,
} from './firebase-emulator';

async function signIn(page, username, password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function answerTenQuizQuestions(page) {
  for (let question = 1; question <= 10; question += 1) {
    await expect(page.locator('.quiz-progress').getByText(`Question ${question} of 10`)).toBeVisible();
    await page.locator('.fiqh-choice-btn').first().click();
    await page.waitForTimeout(1100);
  }
}

test.beforeEach(async () => {
  await clearEmulators();
});

test('sign up, complete a quiz, and see the score on the leaderboard', async ({ page }) => {
  const username = `student${Date.now()}`;

  await page.goto('/signup');
  await page.getByLabel('Username *').fill(username);
  await page.getByLabel('Password *', { exact: true }).fill('password123');
  await page.getByLabel('Confirm Password *').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/quiz/fiqh/WUD');
  await answerTenQuizQuestions(page);
  await expect(page.locator('.results-score')).toContainText(/\/ 10/);

  await page.goto('/leaderboard');
  await page.getByRole('button', { name: 'Fiqh' }).click();
  await page.getByRole('button', { name: 'All time' }).click();
  await expect(page.getByRole('cell', { name: username })).toBeVisible();
});

test('sign in, run practice, and see weakness stats update', async ({ page }) => {
  const practiceUser = await seedUser({ username: 'practiceuser' });

  await signIn(page, 'practiceuser');
  await page.goto('/practice/fiqh/WUD');
  await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();
  await page.getByRole('group').getByRole('button').first().click();
  await expect
    .poll(() => documentExists(`users/${practiceUser.uid}/topicStats/fiqh_WUD`), {
      timeout: 15_000,
    })
    .toBe(true);

  await page.goto('/weakness');
  await expect(page.getByRole('heading', { name: 'Strength Map' })).toBeVisible();
  await expect(page.getByText('Wudhu').first()).toBeVisible();
});

test('admin sign-in can view class results', async ({ page }) => {
  await seedUser({ username: 'teacher', role: 'admin' });
  const student = await seedUser({ username: 'studentone' });
  await seedQuizResult({
    id: 'student-result',
    userId: student.uid,
    username: 'studentone',
    score: 7,
  });

  await signIn(page, 'teacher');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Class Stats' }).click();
  await expect(page.getByRole('heading', { name: 'Class Overview' })).toBeVisible();
  await expect(page.getByText('studentone')).toBeVisible();
});
