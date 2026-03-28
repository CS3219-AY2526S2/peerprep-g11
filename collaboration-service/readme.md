# Collaboration service

- demonstration of shared code editor using [monaco](https://github.com/microsoft/monaco-editor), [yjs](https://github.com/yjs/yjs) with websocket connection, with the help of [monaco-editor/react](https://github.com/suren-atoyan/monaco-react).

- run the server at `localhost:1234` with

```powershell
cd y-websocket-server
npm install
npx patch-package
npx y-websocket
```

- `sessions/:sessionId` endpoint will return an json entry with matching sessionId from a database like below.
  - except that it will include a `sessionId: "mock-match-001"` property in addition to other properties like `questionId`

```javascript
const MOCK_SESSIONS: Record<string, Omit<SessionDetails, "sessionId">> = {
  "mock-match-001": {
    questionId: "q2",
    status: "active",
    selectedLanguage: "python",
    allowedLanguages: [...PROGRAMMING_LANGUAGES],
    starterCode: {
      javascript: `function networkDelayTime(times, n, k) {
}
`,
      python: `def network_delay_time(times, n, k):
    pass
`,
      java: `import java.util.*;

class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
    }
}
`,
    },
    participants: [
      {
        id: "user-current",
        username: "Current User",
        isCurrentUser: true,
        presence: "connected",
      },
      {
        id: "user-partner",
        username: "Alex P.",
        isCurrentUser: false,
        presence: "connected",
      },
    ],
  },
  "mock-match-002": {
    questionId: "q3",
    status: "active",
    selectedLanguage: "javascript",
    allowedLanguages: [...PROGRAMMING_LANGUAGES],
    starterCode: {
      javascript: `function lengthOfLIS(nums) {
}
`,
      python: `def length_of_lis(nums):
    pass
`,
      java: `class Solution {
    public int lengthOfLIS(int[] nums) {
    }
}
`,
    },
    participants: [
      {
        id: "user-current",
        username: "Current User",
        isCurrentUser: true,
        presence: "connected",
      },
      {
        id: "user-partner",
        username: "Taylor G.",
        isCurrentUser: false,
        presence: "disconnected",
      },
    ],
  },
};

```
