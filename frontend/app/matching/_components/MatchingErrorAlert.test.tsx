import { render, screen } from '@testing-library/react';
import { MatchingErrorAlert } from '@/app/matching/_components/MatchingErrorAlert';

describe('MatchingErrorAlert', () => {
  it('renders a rejoin link when a match id is provided', () => {
    render(
      <MatchingErrorAlert
        message="You are already in a session."
        matchId="match-123"
      />
    );

    expect(screen.getByText('You are already in a session.')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Rejoin session' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/sessions/match-123');
  });

  it('does not render a rejoin link when no match id is available', () => {
    render(<MatchingErrorAlert message="You are already in a session." />);

    expect(screen.queryByRole('link', { name: 'Rejoin session' })).not.toBeInTheDocument();
  });
});
