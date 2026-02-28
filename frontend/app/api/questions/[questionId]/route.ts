// TODO: Replace mock implementation with actual fetch to QUESTION_SERVICE_URL
// when the question microservice is available.

import { NextRequest, NextResponse } from 'next/server';
import type { Question } from '@/app/questions/types';

// TODO: Use this when question service is ready
// const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? 'http://localhost:3001';

// TODO: Remove this mock data when the question service is available.
const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Two Sum Variations',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    topics: ['Arrays', 'Hash Table'],
    difficulty: 'Easy',
    status: 'Completed',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      'Only one valid answer exists.',
    ],
  },
  {
    id: 'q2',
    title: 'Network Delay Time',
    description:
      'You are given a network of **n** nodes, labeled 1 to n. Each directed edge is described by a travel time (u, v, w), which means it takes w time for a signal to travel from u to v.\n\nStarting from node k, send a signal to all nodes. Return the time it takes for all nodes to receive the signal. If it is impossible for all nodes to receive the signal, return -1.',
    topics: ['Graphs', 'Shortest Path'],
    difficulty: 'Medium',
    status: 'In Review',
    examples: [
      {
        input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2',
        output: '2',
        explanation: 'The signal reaches all nodes in 2 units of time.',
      },
    ],
    constraints: [
      '1 ≤ n ≤ 100',
      '1 ≤ w ≤ 100',
      'Multiple edges between the same nodes may exist.',
    ],
  },
  {
    id: 'q3',
    title: 'Longest Increasing Subsequence',
    description:
      'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nA subsequence is a sequence that can be derived from the array by deleting some or no elements without changing the order of the remaining elements.',
    topics: ['Dynamic Programming', 'Binary Search'],
    difficulty: 'Medium',
    status: 'Pending',
    examples: [
      {
        input: 'nums = [10,9,2,5,3,7,101,18]',
        output: '4',
        explanation: 'The longest increasing subsequence is [2,3,7,101], therefore the length is 4.',
      },
    ],
    constraints: [
      '1 ≤ nums.length ≤ 2500',
      '-10⁴ ≤ nums[i] ≤ 10⁴',
    ],
  },
  {
    id: 'q4',
    title: 'Design Rate Limiter',
    description:
      'Design a rate limiter that limits the number of requests a client can make to an API within a given time window.\n\nYour rate limiter should support two operations:\n- `allowRequest(clientId, timestamp)` — returns true if the request is allowed, false otherwise.\n- `configure(maxRequests, windowSeconds)` — configures the rate limit parameters.',
    topics: ['System Design', 'Queue'],
    difficulty: 'Hard',
    status: 'Pending',
    examples: [
      {
        input: 'configure(3, 60); allowRequest("client1", 1); allowRequest("client1", 30); allowRequest("client1", 50); allowRequest("client1", 55)',
        output: 'true, true, true, false',
        explanation: 'The 4th request exceeds the limit of 3 requests within 60 seconds.',
      },
    ],
    constraints: [
      '1 ≤ maxRequests ≤ 10⁶',
      '1 ≤ windowSeconds ≤ 86400',
    ],
  },
  {
    id: 'q5',
    title: 'Valid Parentheses',
    description:
      "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.",
    topics: ['Stack', 'Strings'],
    difficulty: 'Easy',
    status: 'Completed',
    examples: [
      {
        input: 's = "([]){}"',
        output: 'true',
      },
      {
        input: 's = "([)]"',
        output: 'false',
      },
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁴',
      "s consists of parentheses only '()[]{}'.",
    ],
  },
  {
    id: 'q6',
    title: 'Merge K Sorted Lists',
    description:
      'You are given an array of `k` linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    topics: ['Linked List', 'Heap'],
    difficulty: 'Hard',
    status: 'Pending',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
      },
    ],
    constraints: [
      'k == lists.length',
      '0 ≤ k ≤ 10⁴',
      '0 ≤ lists[i].length ≤ 500',
      '-10⁴ ≤ lists[i][j] ≤ 10⁴',
    ],
  },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;

    // TODO: Replace with fetch(`${QUESTION_SERVICE_URL}/questions/${questionId}`)
    const question = MOCK_QUESTIONS.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch {
    return NextResponse.json(
      { error: 'Question service unavailable' },
      { status: 503 }
    );
  }
}
