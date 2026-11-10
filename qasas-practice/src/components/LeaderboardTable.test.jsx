import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import LeaderboardTable from './LeaderboardTable';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'student-1' },
  }),
}));

vi.mock('../lib/quiz', () => ({
  formatLeaderboardTime: (seconds) => `${seconds}s`,
}));

describe('LeaderboardTable', () => {
  it('renders the stored quiz total for review and standard results', () => {
    const html = renderToStaticMarkup(
      <LeaderboardTable
        data={[
          {
            id: 'standard-result',
            userId: 'student-2',
            username: 'Zayd',
            score: 8,
            total: 10,
            durationSeconds: 180,
          },
        ]}
        userResult={{
          id: 'review-result',
          userId: 'student-1',
          username: 'Amina',
          score: 12,
          total: 15,
          durationSeconds: 420,
        }}
        userRank=">5"
      />
    );

    expect(html).toContain('12/15');
    expect(html).toContain('8/10');
  });
});
