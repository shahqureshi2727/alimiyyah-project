import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QasasTranslationMode from './QasasTranslationMode';

vi.mock('../lib/shuffle', () => ({
  shuffleArray: (items) => [...items],
}));

vi.mock('../hooks/useWeaknessTracking', () => ({
  useWeaknessTracking: () => vi.fn(),
}));

describe('QasasTranslationMode', () => {
  it('grades a typed sentence word by word and moves to the next one', () => {
    render(<QasasTranslationMode onBack={() => {}} />);

    expect(screen.getByText('Chapter 1: The Seller of the Idols')).toBeInTheDocument();
    const input = screen.getByLabelText('Your translation, graded word by word');
    fireEvent.change(input, { target: { value: 'Before many days, very many' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText(/Every word correct/)).toBeInTheDocument();
    expect(screen.getByText('Textbook translation')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Your translation, graded word by word')).toHaveValue('');
  });

  it('shows the textbook meaning for a missed word', () => {
    render(<QasasTranslationMode onBack={() => {}} />);

    fireEvent.change(screen.getByLabelText('Your translation, graded word by word'), {
      target: { value: 'Before days' },
    });
    fireEvent.keyDown(screen.getByLabelText('Your translation, graded word by word'), {
      key: 'Enter',
    });

    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(screen.getAllByText('Expected: many').length).toBeGreaterThan(0);
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
  });
});
