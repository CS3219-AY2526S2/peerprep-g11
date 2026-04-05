# User Service Diagrams

## Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String username UK "required"
        String email UK "required, lowercase, trimmed"
        String password "required, bcrypt hashed, min 6 chars"
        String role "enum: admin | user, default: user"
        Date createdAt "auto-managed"
        Date updatedAt "auto-managed"
    }

    AUDIT_LOG {
        ObjectId _id PK
        String actorId FK "required, immutable"
        String actorRole "required, immutable"
        String actionType "required, immutable (e.g. POST /users/profile)"
        String targetEntityType "required, immutable (e.g. USER)"
        String targetEntityId "required, immutable"
        String operationStatus "enum: SUCCESS | FAILURE, immutable"
        Date timestamp "default: now, immutable"
        Object details "optional, immutable"
    }

    USER ||--o{ AUDIT_LOG : "performs actions logged in"
```

## Sequence Diagrams

### 1. User Registration

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant AC as Auth Controller
    participant M as User Model
    participant DB as MongoDB

    C->>S: POST /auth/register {username, email, password}
    S->>AC: register(req, res)
    AC->>AC: Validate email & password present
    AC->>AC: Validate email format (regex)
    AC->>AC: Validate password (8+ chars, 1 uppercase)
    AC->>DB: findOne({ email })
    DB-->>AC: null (no duplicate)
    AC->>M: User.create({ username, email, password })
    M->>M: Pre-save hook: bcrypt.hash(password, salt=10)
    M->>DB: Insert document
    DB-->>M: Saved user
    M-->>AC: user
    AC-->>C: 201 { message: "User registered", id }
```

### 2. User Login

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant AC as Auth Controller
    participant M as User Model
    participant DB as MongoDB

    C->>S: POST /auth/login {email, password}
    S->>AC: login(req, res)
    AC->>AC: Validate email & password present
    AC->>DB: findOne({ email })
    DB-->>AC: user document
    AC->>M: user.comparePassword(password)
    M->>M: bcrypt.compare(candidate, hashed)
    M-->>AC: true
    AC->>AC: jwt.sign({ id, email, role }, secret, { expiresIn: 7d })
    AC->>AC: Set HTTP-only cookie ("token")
    AC-->>C: 200 { message: "Login successful", role, token }
```

### 3. Accessing a Protected Endpoint (Get Profile)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant Auth as authenticate middleware
    participant UC as User Controller
    participant DB as MongoDB
    participant AL as Audit Logger

    C->>S: GET /users/me (Bearer token or cookie)
    S->>Auth: authenticate(req, res, next)
    Auth->>Auth: Extract token from header or cookie
    Auth->>Auth: jwt.verify(token, secret)
    Auth->>Auth: Set req.user = { id, email, role }
    Auth->>UC: next() → getMe(req, res)
    UC->>DB: findById(req.user.id, "-password")
    DB-->>UC: user (without password)
    UC-->>C: 200 { user profile }
    Note over AL: GET requests are not audit-logged
```

### 4. Admin Deletes a User

```mermaid
sequenceDiagram
    participant C as Admin Client
    participant S as Express Server
    participant Auth as authenticate middleware
    participant RA as requireAdmin middleware
    participant UC as User Controller
    participant DB as MongoDB
    participant AL as Audit Logger

    C->>S: DELETE /users/:id (Bearer token)
    S->>Auth: authenticate(req, res, next)
    Auth->>Auth: Verify JWT, set req.user
    Auth->>RA: next()
    RA->>RA: Check req.user.role === "admin"
    RA->>UC: next() → deleteUser(req, res)
    UC->>DB: findByIdAndDelete(id)
    DB-->>UC: deleted user
    UC-->>C: 200 { message: "User deleted" }
    S->>AL: res.on("finish") triggered
    AL->>DB: AuditLog.create({ actorId, actorRole, actionType: "DELETE /users/:id", targetEntityId, operationStatus: "SUCCESS" })
```

### 5. Update Profile

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant Auth as authenticate middleware
    participant UC as User Controller
    participant M as User Model
    participant DB as MongoDB
    participant AL as Audit Logger

    C->>S: PUT /users/profile {username?, password?}
    S->>Auth: authenticate(req, res, next)
    Auth->>Auth: Verify JWT, set req.user
    Auth->>UC: next() → updateUser(req, res)
    UC->>DB: findById(req.user.id, "-password")
    DB-->>UC: user
    UC->>UC: Validate at least one field provided
    UC->>UC: If password: validate length >= 8
    UC->>M: user.save()
    M->>M: Pre-save hook: bcrypt.hash (if password modified)
    M->>DB: Update document
    DB-->>M: Saved
    UC-->>C: 200 { message: "User updated" }
    S->>AL: res.on("finish") triggered
    AL->>DB: AuditLog.create({ actorId, actionType: "PUT /users/profile", operationStatus: "SUCCESS" })
```

### 6. Logout

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Express Server
    participant AC as Auth Controller

    C->>S: POST /auth/logout
    S->>AC: logout(req, res)
    AC->>AC: res.clearCookie("token")
    AC-->>C: 200 { message: "Logged out" }
```
