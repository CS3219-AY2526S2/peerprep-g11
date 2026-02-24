'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminUserTable({ users }: { users: User[] }) {
  if (users.length === 0) {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}