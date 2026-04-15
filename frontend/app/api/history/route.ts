import { NextRequest, NextResponse } from 'next/server';
import { forwardAuthHeaders } from '@/lib/auth';
import type { HistoryListResponse } from '@/app/history/types';

const QUESTION_SERVICE_URL =
  process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_HISTORY_LIST = [
  {
    _id: 'hist_001',
    partner_id: 'user_abc123',
    partner_username: 'Priya',
    question: {
      id: 'q1',
      title: 'Two Sum',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      topics: ['Arrays', 'Hash Table'],
      difficulty: 'Easy' as const,
      status: 'Completed' as const,
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      ],
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'hist_002',
    partner_id: 'user_def456',
    partner_username: 'Ethan',
    question: {
      id: 'q2',
      title: 'Longest Substring Without Repeating Characters',
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      topics: ['Strings', 'Sliding Window'],
      difficulty: 'Medium' as const,
      status: 'Completed' as const,
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      ],
      constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    },
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'hist_003',
    partner_id: 'user_ghi789',
    partner_username: 'Amira',
    question: {
      id: 'q3',
      title: 'Merge K Sorted Lists',
      description:
        'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
      topics: ['Linked List', 'Heap'],
      difficulty: 'Hard' as const,
      status: 'Completed' as const,
      examples: [
        { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      ],
      constraints: ['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4'],
    },
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10));
    const upstreamParams = new URLSearchParams({
      user_id: userId,
      page: String(page),
      size: String(pageSize),
    });

    // return NextResponse.json(MOCK_HISTORY_LIST);

    const authHeaders = forwardAuthHeaders(request);
    const res = await fetch(
      `${QUESTION_SERVICE_URL}/history/list?${upstreamParams.toString()}`,
      {
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'History service unavailable' },
        { status: res.status }
      );
    }

    const items: HistoryListResponse = await res.json();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: 'History service unavailable' },
      { status: 503 }
    );
  }
}
