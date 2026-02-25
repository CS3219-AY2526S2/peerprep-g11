 # User Service

Handles user registration, authentication, profile management, and role-based access control for PeerPrep. Built with Node.js, Express, TypeScript, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
- [Authentication and Authorization](#authentication-and-authorization)
- [Roles](#roles)
- [Audit Logging](#audit-logging)
- [Data Models](#data-models)
- [Project Structure](#project-structure)

---

## Overview

The user service is a standalone microservice that exposes a REST API. It issues JWT tokens stored as HTTP-only cookies on login and validates those tokens on every protected route.

**Base URL (local):** `http://localhost:4001`

---

## Prerequisites

- Node.js 20+
- A MongoDB instance (local or MongoDB Atlas)

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy the example env file and fill in values
cp .env.example .env

# Start the development server (TypeScript, with hot reload)
npm run dev

# Run tests
npm test
```

---

## Environment Variables

| Variable          | Required | Description                                          | Example                          |
|-------------------|----------|------------------------------------------------------|----------------------------------|
| `MONGODB_URI`     | Yes      | MongoDB connection string                            | `mongodb+srv://...`              |
| `JWT_SECRET`      | Yes      | Secret used to sign and verify JWT tokens            | `a_long_random_string`           |
| `JWT_EXPIRES_IN`  | No       | JWT expiry duration (default: `7d`)                  | `7d`                             |
| `FRONTEND_ORIGIN` | No       | Allowed CORS origin (default: `http://localhost:3000`) | `http://localhost:3000`        |
| `PORT`            | No       | Port the server listens on (default: `4001`)         | `4001`                           |

---

## Available Scripts

| Script        | Description                                      |
|---------------|--------------------------------------------------|
| `npm run dev` | Start the dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/`                  |
| `npm start`   | Run the compiled production build                |
| `npm run seed` | Seed the database with a default admin account  |

### Default Admin Account (after seeding)

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@peerprep.local` |
| Password | `Admin1234!`           |

---

## API Reference

All request and response bodies use `application/json`. Authentication is via an HTTP-only cookie (`token`) set on login.

### Authentication

#### POST /auth/register

Register a new user account.

**Request body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Secret1234"
}
```

**Password requirements:**
- Minimum 8 characters
- At least one uppercase letter

**Responses:**

| Status | Description                     |
|--------|---------------------------------|
| 201    | Account created successfully    |
| 400    | Validation error or duplicate   |

---

#### POST /auth/login

Authenticate and receive a JWT token as an HTTP-only cookie.

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "Secret1234"
}
```

**Responses:**

| Status | Description                             |
|--------|-----------------------------------------|
| 200    | Login successful, `token` cookie set    |
| 400    | Missing fields                          |
| 401    | Invalid credentials                     |

---

#### POST /auth/logout

Clear the authentication cookie.

**Responses:**

| Status | Description              |
|--------|--------------------------|
| 200    | Logged out successfully  |

---

### Users

All routes below require authentication. The JWT is read from the `token` cookie or the `Authorization: Bearer <token>` header.

#### GET /users/me

Return the authenticated user's profile.

**Response (200):**

```json
{
  "_id": "...",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### PUT /users/profile

Update the authenticated user's username or password.

**Request body (all fields optional):**

```json
{
  "username": "new_username",
  "password": "NewSecret1!"
}
```

**Responses:**

| Status | Description              |
|--------|--------------------------|
| 200    | Profile updated          |
| 400    | Validation error         |
| 401    | Unauthenticated          |

---

#### GET /users

Return all registered users. **Admin only.**

**Response (200):** Array of user objects (passwords excluded).

---

#### DELETE /users/:id

Delete a user by ID. **Admin only.**

**Responses:**

| Status | Description                  |
|--------|------------------------------|
| 204    | User deleted                 |
| 403    | Forbidden (not admin)        |
| 404    | User not found               |

---

## Authentication and Authorization

- On login, a signed JWT is issued and stored in an HTTP-only `SameSite=Strict` cookie. It is not accessible to JavaScript on the client.
- Every protected route passes through the `authenticate` middleware, which verifies the JWT and populates `req.user` with `{ id, email, role }`.
- The `Authorization: Bearer <token>` header is also accepted as a fallback.

---

## Roles

| Role    | Value   | Description                                 |
|---------|---------|---------------------------------------------|
| `user`  | `user`  | Standard user — can view and edit own profile |
| `admin` | `admin` | Full access — can list and delete any user  |

---

## Audit Logging

All state-changing requests (POST, PUT, DELETE) are automatically logged to the `AuditLog` collection after the response is sent. Each log entry records:

- Actor ID and role
- Action type (e.g. `USER_DELETE`)
- Target entity type and ID
- Operation status (`SUCCESS` or `FAILURE`)
- Timestamp
- Additional details

Audit log records are immutable once written.

---

## Data Models

### User

| Field       | Type     | Constraints                            |
|-------------|----------|----------------------------------------|
| `username`  | String   | Required, unique                       |
| `email`     | String   | Required, unique, lowercase            |
| `password`  | String   | Hashed with bcrypt, min 6 chars stored |
| `role`      | String   | `user` or `admin`, default `user`      |
| `createdAt` | Date     | Auto-managed by Mongoose               |
| `updatedAt` | Date     | Auto-managed by Mongoose               |

### AuditLog

| Field              | Type   | Notes                          |
|--------------------|--------|--------------------------------|
| `actorId`          | String | ID of the user performing the action |
| `actorRole`        | String | Role at time of action         |
| `actionType`       | String | e.g. `USER_DELETE`             |
| `targetEntityType` | String | e.g. `USER`                    |
| `targetEntityId`   | String | ID of the affected resource    |
| `operationStatus`  | String | `SUCCESS` or `FAILURE`         |
| `timestamp`        | Date   | Defaults to current time       |
| `details`          | Object | Additional context             |

---

## Project Structure

```
user-service/
├── src/
│   ├── __tests__/              # Unit tests
│   │   └── auth.controller.test.ts # Auth controller tests
│   │   └── middleware.test.ts  # Middleware tests
│   │   └── setup.ts            # Build up and tear down after each test
│   │   └── user.controller.ts  # User controller tests
│   ├── config/
│   │   └── db.ts               # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.ts  # Register, login, logout
│   │   └── user.controller.ts  # Profile, list users, delete
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── auditLogger.ts      # Automatic audit logging
│   │   └── requireAdmin.ts     # Admin role guard
│   ├── models/
│   │   ├── User.ts             # User schema
│   │   └── AuditLog.ts         # Audit log schema
│   ├── routes/
│   │   ├── auth.routes.ts      # /auth/*
│   │   └── user.routes.ts      # /users/*
│   ├── scripts/
│   │   └── seed.ts             # Database seed script
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Entry point
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```
