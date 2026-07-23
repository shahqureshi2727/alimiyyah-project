import { describe, expect, it, vi, afterEach } from 'vitest';
import { shuffleArray } from './shuffle';

describe('shuffleArray', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4];
    shuffleArray(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('returns a permutation with the same elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it('performs a real Fisher-Yates pass, not a sort-based shuffle', () => {
    // Math.random always returns 0 -> j is always 0 at every step,
    // pinning down the exact swap sequence a correct Fisher-Yates produces.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = shuffleArray([1, 2, 3, 4]);

    // i=3: swap(3,0) -> [4,2,3,1]
    // i=2: swap(2,0) -> [3,2,4,1]
    // i=1: swap(1,0) -> [2,3,4,1]
    expect(result).toEqual([2, 3, 4, 1]);
  });
});
