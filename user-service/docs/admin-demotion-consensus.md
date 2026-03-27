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

### Can an admin user pretend to be another admin to abuse the endpoint?
No. The system's security is built on verified identity, not user-provided claims.

1.  **Identity Verification:** The system uses JSON Web Tokens (JWT) for authentication. When an admin makes a request (e.g., to cast a vote), the `voterId` is extracted directly from the verified `req.user.id` payload in the JWT.
2.  **No Spoofing:** There is no field in the request body (like `voterId` or `fromAdminId`) that the server will trust over the JWT. If an admin (Admin A) tries to send a request claiming to be Admin B, the server will ignore the claim and record the vote as coming from Admin A.
3.  **Endpoint Integrity:**
    - **`POST /demotion-votes`**: The `initiatorId` is automatically set to the ID of the admin who signed the request. You can only specify the *target* user.
    - **`POST /demotion-votes/:id/vote`**: The vote is automatically attributed to the admin who signed the request. You cannot cast a vote "on behalf of" someone else.
    - **`DELETE /demotion-votes/:id/vote`**: An admin can only withdraw their *own* vote. The system identifies which vote to remove based on the ID in the JWT.

Even if you hit the endpoint directly using a tool like `curl` or Postman, you must provide a valid JWT. That JWT is cryptographically signed by the server and binds the request to your specific user identity. To pretend to be another admin, you would need to steal their specific secret `JWT_SECRET` or their active session token.

### Summary of Protections
- **Authentication:** You must be a logged-in user.
- **Authorization:** You must have the `admin` role.
- **Identity:** The server *knows* who you are from your token; it never asks you who you are in the request body.
- **Consensus:** Even an admin cannot "self-resolve" a vote. They can only contribute one vote towards the majority.

