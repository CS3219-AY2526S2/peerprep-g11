# Admin Demotion Consensus Model

## Motivation
In a multi-admin system, granting a single administrator the power to demote another can lead to internal "coups" or abuse of power. If one admin's account is compromised or if an admin turns malicious, they could demote all other admins to seize total control of the platform.

To prevent this, we have implemented a **Consensus-Based Demotion Model**. This ensures that no single admin can unilaterally strip another of their privileges. Instead, a collective agreement among the administrative body is required.

## How It Works

### 1. Initiating a Vote
Any administrator can start a demotion vote against another administrator.
- **Target Validation:** The target must currently have the `admin` role.
- **Self-Demotion:** An admin cannot start a vote against themselves (they can simply choose to leave or use other profile management tools if available, though typically demotion is an external action).
- **Concurrency:** Only one active demotion vote can exist for a specific target user at any given time.

### 2. The Consensus Logic (Majority Rule)
The system automatically calculates the required number of "Yes" votes based on the current size of the admin pool at the time the vote is initiated.
- **Threshold:** A simple majority ($> 50\%$) of *eligible* admins is required.
- **Eligibility:** The admin being targeted is excluded from the count of eligible voters.
- **Calculation:** `requiredVotes = floor((totalAdmins - 1) / 2) + 1`.
- **Consistency:** The `requiredVotes` value is fixed once the vote is created. Even if the total number of admins changes during the voting period, the threshold for that specific vote remains constant to ensure a predictable process.

*Example:*
- If there are 3 admins (A, B, C): To demote C, 2 votes are needed (A and B).
- If there are 5 admins: To demote one, 3 votes are needed from the remaining 4.

### 3. Voting Process
- **Participation:** Only users with the `admin` role can view or participate in demotion votes.
- **Transparency:** Admins can see who initiated the vote and who has voted so far.
- **Flexibility:** Admins can change their vote (Yes/No) or withdraw it entirely while the vote is still `active`.

### 4. Resolution
A vote remains `active` until one of the following occurs:
- **Approved:** The "Yes" count reaches the `requiredVotes` threshold. The target is immediately demoted to the `user` role.
- **Rejected:** The "No" count reaches a point where it is mathematically impossible for "Yes" to win (even if all remaining eligible admins voted "Yes").
- **Expired:** Votes have a 7-day TTL (Time-To-Live). If a majority isn't reached within 7 days, the vote expires and is closed.

### 5. Post-Demotion Security
When a demotion is approved:
1. The target user's role is updated to `user`.
2. `tokenInvalidatedAt` is updated to the current timestamp. This effectively invalidates all existing JWTs for that user, forcing them to log out and re-authenticate with their new, restricted permissions.

## Abuse Prevention (Security Considerations)

### Can the endpoints be hit directly to bypass the system?
No. The system is protected at multiple layers:

1. **Role-Based Access Control (RBAC):** Every demotion-related endpoint is protected by `requireAdmin` middleware. Even if an attacker knows the endpoint URL, they cannot trigger a vote or cast a vote without a valid, active admin session.
2. **Logic-Level Guards:**
    - **Self-Voting:** The `castVote` logic explicitly prevents the target from voting on their own demotion.
    - **Initialization Checks:** The system verifies the target's role before allowing a vote to start. You cannot "demote" a regular user via this system.
    - **Integrity:** The `requiredVotes` is calculated at the moment of creation based on the server-side database state, not provided by the client.
3. **Audit Trail:** Every vote and its outcome is persisted in the database, allowing for accountability and review of administrative actions.
