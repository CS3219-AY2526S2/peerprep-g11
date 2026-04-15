'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VoteEntry {
  voterId: { _id: string; username: string; email: string };
  vote: 'yes' | 'no';
  votedAt: string;
}

export interface DemotionVoteItem {
  _id: string;
  targetUserId: { _id: string; username: string; email: string };
  initiatorId: { _id: string; username: string; email: string };
  status: 'active' | 'approved' | 'rejected' | 'expired';
  votes: VoteEntry[];
  requiredVotes: number;
  expiresAt: string;
}

interface DemotionVoteDialogProps {
  vote: DemotionVoteItem;
  currentUserId: string;
  onVoteCast: (demoted?: boolean) => void;
}

export function DemotionVoteDialog({ vote, currentUserId, onVoteCast }: DemotionVoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const yesCount = vote.votes.filter((v) => v.vote === 'yes').length;
  const noCount = vote.votes.filter((v) => v.vote === 'no').length;
  const myVote = vote.votes.find((v) => v.voterId._id === currentUserId);
  const isTarget = vote.targetUserId._id === currentUserId;

  const daysLeft = Math.max(0, Math.ceil((new Date(vote.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleVote = async (voteValue: 'yes' | 'no') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/demotion-votes/${vote._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteValue }),
      });
      if (res.ok) {
        const data = await res.json();
        onVoteCast(data.demoted);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cast vote');
      }
    } catch {
      alert('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/demotion-votes/${vote._id}/vote`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        onVoteCast(data.demoted);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to withdraw vote');
      }
    } catch {
      alert('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer text-[11px] rounded-full px-2.5 font-medium text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800 hover:opacity-80"
        >
          Vote: {yesCount}/{vote.requiredVotes}
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px]" style={{ fontFamily: 'var(--font-serif)' }}>
            Demotion Vote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[12.5px]">
          <div className="space-y-1.5">
            <p>
              <span className="text-muted-foreground">Target:</span>{' '}
              <span className="font-medium">{vote.targetUserId.username ?? vote.targetUserId.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Initiated by:</span>{' '}
              <span className="font-medium">{vote.initiatorId.username ?? vote.initiatorId.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Tally:</span>{' '}
              <span className="font-medium">{yesCount} yes / {noCount} no</span>
              <span className="text-muted-foreground"> — needs {vote.requiredVotes}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Expires in:</span>{' '}
              <span className="font-medium">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
            </p>
          </div>

          {vote.votes.length > 0 && (
            <div className="border border-border rounded-lg p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Votes</p>
              {vote.votes.map((v) => (
                <div key={v.voterId._id} className="flex items-center justify-between">
                  <span>{v.voterId.username ?? v.voterId.email}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] rounded-full px-2 ${
                      v.vote === 'yes'
                        ? 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
                        : 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
                    }`}
                  >
                    {v.vote}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!isTarget && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={myVote?.vote === 'yes' ? 'default' : 'outline'}
                onClick={() => handleVote('yes')}
                disabled={loading}
                className="text-[12px] flex-1"
              >
                Vote Yes
              </Button>
              <Button
                size="sm"
                variant={myVote?.vote === 'no' ? 'default' : 'outline'}
                onClick={() => handleVote('no')}
                disabled={loading}
                className="text-[12px] flex-1"
              >
                Vote No
              </Button>
              {myVote && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="text-[12px]"
                >
                  Withdraw
                </Button>
              )}
            </div>
          )}

          {isTarget && (
            <p className="text-muted-foreground italic">You cannot vote on your own demotion.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
