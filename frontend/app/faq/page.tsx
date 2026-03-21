'use client';

import { useEffect, useState } from 'react';
import { NavBar } from '@/components/ui/navBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';

const faqItems = [
  {
    question: 'What is PeerPrep?',
    answer:
      'PeerPrep is a collaborative platform for practising technical interview questions with peers. You can browse questions, match with other users, and solve problems together in real-time coding sessions.',
  },
  {
    question: 'How does matching work?',
    answer:
      'Navigate to the Matching page and select your preferred difficulty and topic. PeerPrep will pair you with another user who has similar preferences. Once matched, you will both be placed into a live coding session.',
  },
  {
    question: 'Can I practise on my own?',
    answer:
      'Yes! You can browse the Questions page to view all available problems and their descriptions. However, live coding sessions require a matched peer.',
  },
  {
    question: 'How do I update my profile?',
    answer:
      'Click on your avatar in the top-right corner and select "Profile" from the dropdown menu. From there you can update your username and password.',
  },
  {
    question: 'What are admin users?',
    answer:
      'Admin users have additional privileges such as managing the question bank and viewing all registered users. If you would like admin access, you can submit a request below.',
  },
  {
    question: 'How do I report an issue?',
    answer:
      'Please reach out to the PeerPrep team via the project\'s GitHub repository to report bugs or suggest improvements.',
  },
];

export default function FAQPage() {
  const { user } = useRequireAuth();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'exists'>('idle');
  const [hasPending, setHasPending] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setCheckLoading(false);
      return;
    }

    fetch('/api/users/admin-requests/mine')
      .then((res) => res.json())
      .then((data) => setHasPending(data.hasPending))
      .catch(() => {})
      .finally(() => setCheckLoading(false));
  }, [user]);

  const handleRequestAdmin = async () => {
    setRequestStatus('loading');
    try {
      const res = await fetch('/api/users/admin-requests', { method: 'POST' });

      if (res.status === 201) {
        setRequestStatus('success');
        setHasPending(true);
      } else if (res.status === 409) {
        setRequestStatus('exists');
        setHasPending(true);
      } else {
        setRequestStatus('error');
      }
    } catch {
      setRequestStatus('error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <Skeleton />
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="px-10 pt-20 py-8 pb-16 max-w-[720px] mx-auto">
        <div className="mb-8">
          <h1
            className="text-[22px] font-semibold text-foreground mb-1"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Frequently Asked Questions
          </h1>
          <p className="text-[12.5px] text-muted-foreground">
            Common questions about using PeerPrep
          </p>
        </div>

        <Card className="border-border shadow-[var(--shadow)] mb-8">
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="px-6">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-[13px] font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[12.5px] text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {!isAdmin && (
          <Card className="border-border shadow-[var(--shadow)]">
            <CardHeader className="pb-3">
              <CardTitle
                className="text-[15px] font-semibold"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Request Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-[12.5px] text-muted-foreground">
                Would you like to help manage PeerPrep? Submit a request to be promoted to admin.
                An existing admin will review and approve your request.
              </p>

              {requestStatus === 'success' && (
                <Alert>
                  <AlertDescription className="text-[12px]">
                    Your request has been submitted. An admin will review it shortly.
                  </AlertDescription>
                </Alert>
              )}

              {requestStatus === 'exists' && (
                <Alert>
                  <AlertDescription className="text-[12px]">
                    You already have a pending request. Please wait for an admin to review it.
                  </AlertDescription>
                </Alert>
              )}

              {requestStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription className="text-[12px]">
                    Failed to submit request. Please try again later.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleRequestAdmin}
                disabled={requestStatus === 'loading' || hasPending || checkLoading}
                className="w-fit h-9 text-[12.5px] font-semibold"
              >
                {checkLoading
                  ? 'Checking…'
                  : hasPending
                    ? 'Request Pending'
                    : requestStatus === 'loading'
                      ? 'Submitting…'
                      : 'Request Admin Access'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
