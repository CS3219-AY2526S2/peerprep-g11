'use client';

import { useState } from 'react';
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
import { Check, X } from 'lucide-react';

interface AdminRequestUser {
  _id: string;
  username: string;
  email: string;
}

export interface AdminRequestItem {
  _id: string;
  userId: AdminRequestUser;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AdminRequestsTableProps {
  requests: AdminRequestItem[];
  onAction: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

export function AdminRequestsTable({ requests, onAction }: AdminRequestsTableProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  if (requests.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-[12.5px] text-muted-foreground">
        No pending admin requests.
      </div>
    );
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await onAction(id, status);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide pl-6">
            User
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Email
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Requested
          </TableHead>
          <TableHead className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow
            key={req._id}
            className="border-border hover:bg-secondary transition-colors"
          >
            <TableCell className="pl-6 py-3 text-[12.5px] text-foreground font-medium">
              {req.userId.username}
            </TableCell>
            <TableCell className="py-3 text-[12.5px] text-foreground">
              {req.userId.email}
            </TableCell>
            <TableCell className="py-3 text-[12px] text-muted-foreground">
              {new Date(req.createdAt).toLocaleDateString('en-SG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </TableCell>
            <TableCell className="py-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={processing === req._id}
                  onClick={() => handleAction(req._id, 'approved')}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-600/10"
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Approve</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={processing === req._id}
                  onClick={() => handleAction(req._id, 'rejected')}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Reject</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
