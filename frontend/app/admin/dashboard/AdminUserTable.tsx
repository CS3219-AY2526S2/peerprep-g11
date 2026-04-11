'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, X } from 'lucide-react';
import { DemotionVoteDialog, DemotionVoteItem } from './DemotionVoteDialog';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminUserTableProps {
  users: User[];
  currentUserId: string;
  demotionVotes: DemotionVoteItem[];
  onDelete: (id: string) => void;
  onStartVote: (targetUserId: string) => void;
  onVoteCast: () => void;
}

export function AdminUserTable({
  users,
  currentUserId,
  demotionVotes,
  onDelete,
  onStartVote,
  onVoteCast,
}: AdminUserTableProps) {
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'admin' ? -1 : 1;
    }
    return (
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
    );
  });

  if (sortedUsers.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-[12.5px] text-muted-foreground">
        No users found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide pl-6">
            ID
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Email
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Role
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Joined
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUsers.map((user) => {
          const activeVote = demotionVotes.find(
            (v) => v.targetUserId._id === user._id
          );
          const isOtherAdmin = user.role === 'admin' && user._id !== currentUserId;

          return (
            <TableRow
              key={user._id}
              className="border-border hover:bg-secondary transition-colors"
            >
              <TableCell className="pl-6 py-3">
                <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[120px] block">
                  {user._id}
                </span>
              </TableCell>

              <TableCell className="py-3 text-[12.5px] text-foreground">
                {user.email}
              </TableCell>

              <TableCell className="py-3">
                <Badge
                  variant="outline"
                  className={`text-[11px] rounded-full px-2.5 font-medium ${
                    user.role === 'admin'
                      ? 'text-accent bg-accent-soft border-accent/20'
                      : 'text-muted-foreground bg-secondary border-border'
                  }`}
                >
                  {user.role}
                </Badge>
              </TableCell>

              <TableCell className="py-3 text-[12px] text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-SG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>

              <TableCell className="py-3">
                <div className="flex items-center gap-2">
                  {user.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user._id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete user</span>
                    </Button>
                  )}
                  {isOtherAdmin && activeVote && (
                    <DemotionVoteDialog
                      vote={activeVote}
                      currentUserId={currentUserId}
                      onVoteCast={onVoteCast}
                    />
                  )}
                  {isOtherAdmin && !activeVote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStartVote(user._id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
