import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LeaveSessionDialog } from '@/app/sessions/[sessionId]/_components/LeaveSessionDialog';
import { fetchMock, resetFetchMock } from '@/test-utils/fetch';

describe('LeaveSessionDialog', () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it('keeps the confirm dialog flow while the session is still active', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          sessionId: 'session-123',
          status: 'left',
          redirectTo: '/dashboard',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

    render(
      <LeaveSessionDialog
        sessionId="session-123"
        peerLeft={false}
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    fireEvent.click(screen.getByRole('button', { name: 'Leave Session' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/sessions/session-123/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/matches/session-123', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(onSuccess).toHaveBeenCalledWith({
      sessionId: 'session-123',
      status: 'left',
      redirectTo: '/dashboard',
    });
  });

  it('redirects locally without calling the backend once the peer has already left', () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();

    render(
      <LeaveSessionDialog
        sessionId="session-123"
        peerLeft
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('');
    expect(onSuccess).toHaveBeenCalledWith({
      sessionId: 'session-123',
      status: 'left',
      redirectTo: '/dashboard',
    });
  });
});
