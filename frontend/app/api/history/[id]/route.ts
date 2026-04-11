import { NextRequest, NextResponse } from 'next/server';
import { forwardAuthHeaders } from '@/lib/auth';

const QUESTION_SERVICE_URL =
  process.env.QUESTION_SERVICE_URL ?? 'http://localhost:8000';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_DETAILS: Record<string, object> = {
  hist_001: {
    _id: 'hist_001',
    session_id: 'sess_a1b2c3',
    partner_id: 'user_abc123',
    partner_username: 'Priya',
    question: {
      id: 'q1',
      title: 'Two Sum',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      topics: ['Arrays', 'Hash Table'],
      difficulty: 'Easy',
      status: 'Completed',
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      ],
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    },
    language: 'python',
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []


# Example usage
print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))        # [1, 2]
`,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  hist_002: {
    _id: 'hist_002',
    session_id: 'sess_d4e5f6',
    partner_id: 'user_def456',
    partner_username: 'Ethan',
    question: {
      id: 'q2',
      title: 'Longest Substring Without Repeating Characters',
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      topics: ['Strings', 'Sliding Window'],
      difficulty: 'Medium',
      status: 'Completed',
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      ],
      constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    },
    language: 'javascript',
    code: `function lengthOfLongestSubstring(s) {
    const charSet = new Set();
    let left = 0;
    let maxLen = 0;

    for (let right = 0; right < s.length; right++) {
        while (charSet.has(s[right])) {
            charSet.delete(s[left]);
            left++;
        }
        charSet.add(s[right]);
        maxLen = Math.max(maxLen, right - left + 1);
    }

    return maxLen;
}

console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("bbbbb"));     // 1
`,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  hist_003: {
    _id: 'hist_003',
    session_id: 'sess_g7h8i9',
    partner_id: 'user_ghi789',
    partner_username: 'Amira',
    question: {
      id: 'q3',
      title: 'Merge K Sorted Lists',
      description:
        'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
      topics: ['Linked List', 'Heap'],
      difficulty: 'Hard',
      status: 'Completed',
      examples: [
        { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      ],
      constraints: ['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4'],
    },
    language: 'java',
    code: `import java.util.PriorityQueue;

class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> pq = new PriorityQueue<>(
            (a, b) -> a.val - b.val
        );

        for (ListNode node : lists) {
            if (node != null) {
                pq.offer(node);
            }
        }

        ListNode dummy = new ListNode(0);
        ListNode current = dummy;

        while (!pq.isEmpty()) {
            ListNode smallest = pq.poll();
            current.next = smallest;
            current = current.next;
            if (smallest.next != null) {
                pq.offer(smallest.next);
            }
        }

        return dummy.next;
    }
}
`,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // const mock = MOCK_DETAILS[id];
    //   if (!mock) {
    //     return NextResponse.json(
    //       { error: 'History entry not found' },
    //       { status: 404 }
    //     );
    //   }
    //   return NextResponse.json(mock);

    const authHeaders = forwardAuthHeaders(request);
    const res = await fetch(`${QUESTION_SERVICE_URL}/history/${id}`, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'History entry not found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'History service unavailable' },
      { status: 503 }
    );
  }
}
