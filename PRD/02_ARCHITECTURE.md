# 🏗️ Architecture Document

## **QuickLink — URL Shortener System Architecture**

| Field            | Details                              |
| ---------------- | ------------------------------------ |
| **Document**     | System Architecture & Technical Design |
| **Version**      | 1.0                                  |
| **Status**       | Draft                                |
| **Author**       | Architecture Team                    |
| **Created**      | August 10, 2026                      |
| **Last Updated** | August 10, 2026                      |
| **Stack**        | Node.js · Express.js · MongoDB · Cloud Run |

---

## 📑 Table of Contents

1. [System Architecture Overview](#1--system-architecture-overview)
2. [Folder Structure](#2--folder-structure)
3. [Database Design](#3--database-design)
4. [API Design](#4--api-design)
5. [Request & Response Flow](#5--request--response-flow)
6. [Security Architecture](#6--security-architecture)
7. [Performance Considerations](#7--performance-considerations)
8. [Deployment Architecture](#8--deployment-architecture)

---

## 1. 🌐 System Architecture Overview

### 1.1 Architecture Style

QuickLink follows a **monolithic client-server architecture** with a clear separation between the presentation layer (static frontend), the application layer (Express.js REST API), and the data layer (MongoDB). This architecture is intentionally simple for a v1.0 product, while remaining easy to decompose into microservices in the future.

### 1.2 Key Architectural Principles

| Principle                | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| **Stateless Backend**    | No server-side sessions; every request contains all needed context              |
| **Separation of Concerns** | Frontend, API routes, business logic, and data access are cleanly layered    |
| **12-Factor App**        | Environment-based config, disposable processes, port binding, logging to stdout |
| **API-First Design**     | All features exposed via REST endpoints; frontend consumes the same API         |
| **Fail-Fast**            | Validate early, reject invalid inputs at the edge, surface clear errors         |

### 1.3 Client-Server Architecture Explanation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOW IT ALL CONNECTS                         │
│                                                                     │
│   The USER interacts with the FRONTEND (static HTML/CSS/JS)        │
│   served by Express.js. All dynamic actions (shorten, redirect,    │
│   dashboard) go through the REST API on the same server.           │
│   The API talks to MongoDB for persistence and optionally          │
│   Redis for caching hot redirects. Everything runs inside a        │
│   Docker container deployed on Google Cloud Run.                   │
└─────────────────────────────────────────────────────────────────────┘
```

- **Client (Browser):** Renders the UI, captures user input, makes `fetch()` calls to the API.
- **Server (Node.js + Express):** Serves static files, handles API requests, performs business logic, talks to the database.
- **Database (MongoDB Atlas):** Persistent storage for URL documents, click counts, and metadata.
- **Cache (Redis — optional):** In-memory cache for frequently accessed short codes to reduce database reads during redirects.
- **Hosting (Cloud Run):** Serverless container platform that auto-scales based on traffic.

### 1.4 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            USER'S BROWSER                                │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                    Frontend Application                          │   │
│   │                                                                  │   │
│   │   ┌──────────┐    ┌──────────────┐    ┌────────────────────┐    │   │
│   │   │  HTML5   │    │    CSS3      │    │   JavaScript (ES6) │    │   │
│   │   │  Pages   │    │   Styles     │    │   API Calls        │    │   │
│   │   │          │    │  Responsive  │    │   QR Generation    │    │   │
│   │   │ index    │    │  Animations  │    │   Clipboard API    │    │   │
│   │   │ dashboard│    │  Dark Mode   │    │   DOM Manipulation │    │   │
│   │   │ expired  │    │              │    │   localStorage     │    │   │
│   │   └──────────┘    └──────────────┘    └────────────────────┘    │   │
│   └──────────────────────────────┬───────────────────────────────────┘   │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
                          HTTPS (fetch / redirect)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE CLOUD RUN                                  │
│                     (Auto-Scaling Container)                             │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                  Node.js + Express.js Server                     │   │
│   │                                                                  │   │
│   │   ┌─────────────────────── MIDDLEWARE ────────────────────────┐  │   │
│   │   │  Helmet  │  CORS  │  Rate Limiter  │  Morgan  │  JSON    │  │   │
│   │   └──────────────────────────────────────────────────────────┘  │   │
│   │                              │                                   │   │
│   │                              ▼                                   │   │
│   │   ┌─────────────────────── ROUTES ───────────────────────────┐  │   │
│   │   │  POST /api/shorten     │  GET  /api/urls                │  │   │
│   │   │  GET  /api/urls/:code  │  DEL  /api/urls/:code          │  │   │
│   │   │  GET  /:code (redirect)│  GET  /api/health              │  │   │
│   │   └──────────────────────────────────────────────────────────┘  │   │
│   │                              │                                   │   │
│   │                              ▼                                   │   │
│   │   ┌──────────────────── CONTROLLERS ─────────────────────────┐  │   │
│   │   │  urlController.js    │  redirectController.js            │  │   │
│   │   │  healthController.js │                                   │  │   │
│   │   └──────────────────────────────────────────────────────────┘  │   │
│   │                              │                                   │   │
│   │                              ▼                                   │   │
│   │   ┌───────────────────── SERVICES ───────────────────────────┐  │   │
│   │   │  urlService.js (business logic)                          │  │   │
│   │   │  cacheService.js (Redis wrapper)                         │  │   │
│   │   └──────────────────────────────────────────────────────────┘  │   │
│   │                              │                                   │   │
│   └──────────────────────────────┼───────────────────────────────────┘   │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
┌────────────────────────────┐   ┌────────────────────────────────┐
│      MongoDB Atlas         │   │       Redis Cache (Optional)   │
│     (Primary Database)     │   │      (In-Memory Key-Value)     │
│                            │   │                                │
│  ┌──────────────────────┐  │   │  ┌────────────────────────┐   │
│  │   urls collection    │  │   │  │  shortCode → longUrl   │   │
│  │                      │  │   │  │  TTL: 1 hour           │   │
│  │  • _id               │  │   │  │                        │   │
│  │  • longUrl           │  │   │  │  Reduces DB reads      │   │
│  │  • shortCode (index) │  │   │  │  for hot redirects     │   │
│  │  • clicks            │  │   │  └────────────────────────┘   │
│  │  • createdAt         │  │   │                                │
│  │  • expiresAt (TTL)   │  │   └────────────────────────────────┘
│  │  • isActive          │  │
│  │  • sessionId         │  │
│  └──────────────────────┘  │
│                            │
└────────────────────────────┘
```

### 1.5 Data Flow Summary

```
  CREATE SHORT URL                          REDIRECT
  ══════════════                            ════════

  Browser                                   Browser
    │ POST /api/shorten                       │ GET /:code
    │ { longUrl, customCode? }                │
    ▼                                         ▼
  Middleware                                Middleware
    │ validate, rate-limit                    │ rate-limit
    ▼                                         ▼
  Controller                                Controller
    │ call urlService.createUrl()              │ call urlService.resolve()
    ▼                                         ▼
  Service                                   Service
    │ generate shortCode                      │ check Redis cache
    │ validate URL                            │ if miss → query MongoDB
    │ check duplicates                        │ increment click count
    ▼                                         ▼
  MongoDB                                  MongoDB / Redis
    │ insert document                         │ return longUrl
    ▼                                         ▼
  Response                                  Response
    │ { shortUrl, qrCode, expiresAt }        │ 302 Redirect → longUrl
    ▼                                         ▼
  Browser                                   Browser
    renders result                            navigates to original URL
```

---

## 2. 📁 Folder Structure

### 2.1 Complete Project Tree

```
url-shortener/
│
├── 📄 server.js                  # Application entry point
├── 📄 package.json               # Dependencies & scripts
├── 📄 package-lock.json          # Locked dependency versions
├── 📄 .env                       # Environment variables (LOCAL ONLY — git-ignored)
├── 📄 .env.example               # Template for environment variables
├── 📄 .gitignore                 # Files/folders excluded from Git
├── 📄 .dockerignore              # Files excluded from Docker build
├── 📄 Dockerfile                 # Docker container definition
├── 📄 README.md                  # Project documentation
├── 📄 LICENSE                    # License file
│
├── 📂 config/                    # Configuration & environment setup
│   ├── 📄 db.js                  # MongoDB connection logic
│   ├── 📄 redis.js               # Redis client setup (optional)
│   └── 📄 env.js                 # Environment variable validation & export
│
├── 📂 models/                    # Mongoose data models (schemas)
│   └── 📄 Url.js                 # URL document schema & model
│
├── 📂 routes/                    # Express route definitions
│   ├── 📄 urlRoutes.js           # /api/shorten, /api/urls, /api/urls/:code
│   ├── 📄 redirectRoutes.js      # /:code → redirect handler
│   └── 📄 healthRoutes.js        # /api/health
│
├── 📂 controllers/               # Route handler functions (thin layer)
│   ├── 📄 urlController.js       # Handles URL CRUD operations
│   ├── 📄 redirectController.js  # Handles short URL redirects
│   └── 📄 healthController.js    # Handles health check responses
│
├── 📂 services/                  # Business logic layer
│   ├── 📄 urlService.js          # URL creation, validation, lookup
│   └── 📄 cacheService.js        # Redis get/set/invalidate wrappers
│
├── 📂 middleware/                 # Express middleware functions
│   ├── 📄 rateLimiter.js         # Rate limiting configuration
│   ├── 📄 validator.js           # Input validation middleware
│   ├── 📄 errorHandler.js        # Global error handling middleware
│   └── 📄 notFound.js            # 404 catch-all handler
│
├── 📂 utils/                     # Utility/helper functions
│   ├── 📄 generateCode.js        # Short code generation (nanoid)
│   ├── 📄 validateUrl.js         # URL format & reachability checks
│   ├── 📄 constants.js           # App-wide constants (expiry time, code length)
│   └── 📄 logger.js              # Logging utility wrapper
│
├── 📂 public/                    # Static frontend files (served by Express)
│   ├── 📄 index.html             # Homepage — URL shortener form
│   ├── 📄 dashboard.html         # Dashboard — manage created URLs
│   ├── 📄 expired.html           # Expired link — friendly error page
│   ├── 📄 404.html               # Not found page
│   │
│   ├── 📂 css/
│   │   ├── 📄 styles.css         # Main stylesheet
│   │   ├── 📄 dashboard.css      # Dashboard-specific styles
│   │   └── 📄 responsive.css     # Media queries & mobile styles
│   │
│   ├── 📂 js/
│   │   ├── 📄 app.js             # Homepage logic (shorten, copy, QR)
│   │   ├── 📄 dashboard.js       # Dashboard logic (fetch, search, delete)
│   │   ├── 📄 qrcode.min.js      # QR code library (bundled)
│   │   └── 📄 utils.js           # Shared frontend utilities
│   │
│   └── 📂 assets/
│       ├── 📄 favicon.ico         # Browser tab icon
│       ├── 📄 logo.svg           # QuickLink logo
│       └── 📄 og-image.png       # Open Graph social preview image
│
└── 📂 tests/                     # Test suites
    ├── 📂 unit/
    │   ├── 📄 generateCode.test.js
    │   ├── 📄 validateUrl.test.js
    │   └── 📄 urlService.test.js
    │
    ├── 📂 integration/
    │   ├── 📄 shorten.test.js
    │   ├── 📄 redirect.test.js
    │   └── 📄 dashboard.test.js
    │
    └── 📄 setup.js               # Test environment configuration
```

### 2.2 Folder & File Explanations

| Path                   | Purpose                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `server.js`            | Application entry point. Creates the Express app, loads middleware, mounts routes, connects to DB, starts listening on a port. |
| `package.json`         | Defines project metadata, npm scripts (`dev`, `start`, `test`), and all dependencies.                |
| `.env`                 | Stores sensitive configuration (DB URI, port, base URL, Redis URL). **Never committed to Git.**      |
| `.env.example`         | Template showing required environment variables with placeholder values. Committed to Git.           |
| `.gitignore`           | Excludes `node_modules/`, `.env`, `dist/`, and OS-specific files from version control.               |
| `Dockerfile`           | Multi-stage Docker build for production deployment on Cloud Run.                                     |
| **`config/`**          | Centralized configuration. `db.js` handles Mongoose connection with retry logic. `env.js` validates that all required env vars are present at startup. |
| **`models/`**          | Mongoose schemas. `Url.js` defines the shape of URL documents with validation rules and indexes.     |
| **`routes/`**          | Thin route files that map HTTP methods + paths to controller functions. Grouped by feature.          |
| **`controllers/`**     | Handle incoming requests: parse params/body, call services, format responses. No business logic here. |
| **`services/`**        | Core business logic. `urlService.js` handles code generation, duplicate checking, expiry logic. `cacheService.js` abstracts Redis operations. |
| **`middleware/`**       | Reusable Express middleware. Rate limiter, input validator, global error handler, 404 catch-all.     |
| **`utils/`**           | Pure utility functions with no side effects. Code generation, URL validation, constants, logging.    |
| **`public/`**          | Static files served by `express.static()`. Contains HTML pages, CSS, client-side JS, and assets.     |
| **`tests/`**           | Jest/Mocha test suites. Unit tests for isolated functions, integration tests for API endpoints.       |

### 2.3 Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│              public/ (HTML, CSS, JS — browser)               │
├─────────────────────────────────────────────────────────────┤
│                        ROUTING LAYER                         │
│               routes/ (path → controller mapping)            │
├─────────────────────────────────────────────────────────────┤
│                      MIDDLEWARE LAYER                         │
│     middleware/ (rate limit, validation, error handling)      │
├─────────────────────────────────────────────────────────────┤
│                      CONTROLLER LAYER                        │
│        controllers/ (request parsing, response formatting)   │
├─────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                          │
│          services/ (business logic, orchestration)           │
├─────────────────────────────────────────────────────────────┤
│                        MODEL LAYER                           │
│           models/ (Mongoose schemas, data access)            │
├─────────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE LAYER                     │
│         config/ (DB connection, Redis, environment)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 🗄️ Database Design

### 3.1 Database: MongoDB Atlas

- **Database Name:** `quicklink`
- **Primary Collection:** `urls`
- **ODM:** Mongoose v7.x

### 3.2 Collection: `urls`

#### Schema Definition

```javascript
// models/Url.js
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    // ── Core Fields ──────────────────────────────────────────────
    longUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      maxlength: [2048, 'URL cannot exceed 2048 characters'],
    },

    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Short code must be at least 3 characters'],
      maxlength: [30, 'Short code cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Short code can only contain letters, numbers, hyphens, and underscores'],
    },

    // ── Analytics ────────────────────────────────────────────────
    clicks: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Clicks cannot be negative'],
    },

    // ── Metadata ─────────────────────────────────────────────────
    isCustom: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Expiry ───────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },

    // ── Session Tracking ─────────────────────────────────────────
    sessionId: {
      type: String,
      required: false,
      trim: true,
    },

    // ── User (Future v2.0) ───────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Url', urlSchema);
```

### 3.3 Field-by-Field Explanation

| Field        | Type       | Required | Default      | Purpose                                                                                          |
| ------------ | ---------- | -------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `_id`        | ObjectId   | Auto     | Auto-gen     | MongoDB's default unique document identifier                                                     |
| `longUrl`    | String     | ✅ Yes   | —            | The original URL that the short link points to. Capped at 2048 chars (browser URL limit)         |
| `shortCode`  | String     | ✅ Yes   | —            | The unique code appended to the base URL (e.g., `aB3dEf`). Indexed for O(1) lookup during redirects |
| `clicks`     | Number     | ✅ Yes   | `0`          | Running total of how many times the short link has been visited. Incremented atomically          |
| `isCustom`   | Boolean    | No       | `false`      | Distinguishes user-chosen codes from system-generated ones (for analytics and validation rules)  |
| `isActive`   | Boolean    | No       | `true`       | Soft-delete flag. When `false`, the URL returns an "inactive" page instead of redirecting        |
| `expiresAt`  | Date       | ✅ Yes   | `now + 7d`   | The exact timestamp when this URL becomes invalid. Used by TTL index for auto-deletion           |
| `sessionId`  | String     | No       | `null`       | Browser session identifier (from `localStorage`). Used to fetch "my URLs" on the dashboard      |
| `userId`     | ObjectId   | No       | `null`       | Reserved for future user authentication system. References a `users` collection (v2.0)          |
| `createdAt`  | Date       | Auto     | Auto-gen     | Mongoose `timestamps` option. Records when the document was first created                        |
| `updatedAt`  | Date       | Auto     | Auto-gen     | Mongoose `timestamps` option. Records the last modification time                                 |

### 3.4 Indexes

```javascript
// ── Indexes added to the schema ──────────────────────────────────

// 1. Primary lookup index — used on every redirect
urlSchema.index({ shortCode: 1 }, { unique: true });

// 2. Session-based dashboard queries
urlSchema.index({ sessionId: 1, createdAt: -1 });

// 3. Duplicate detection — find existing URL for same longUrl + session
urlSchema.index({ longUrl: 1, sessionId: 1 });

// 4. TTL index — MongoDB auto-deletes documents when expiresAt is reached
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 5. Active URL filtering
urlSchema.index({ isActive: 1 });
```

#### Index Rationale

| Index                           | Type      | Purpose                                                                  |
| ------------------------------- | --------- | ------------------------------------------------------------------------ |
| `{ shortCode: 1 }`             | Unique    | O(1) lookup during redirect — the single most critical query path        |
| `{ sessionId: 1, createdAt: -1 }` | Compound | Efficiently powers the dashboard "my URLs" query, sorted by newest first |
| `{ longUrl: 1, sessionId: 1 }` | Compound  | Prevents duplicate shortened URLs for the same input in a session        |
| `{ expiresAt: 1 }` (TTL)       | TTL       | MongoDB automatically purges expired documents — zero maintenance        |
| `{ isActive: 1 }`              | Single    | Filters active/inactive URLs efficiently                                 |

### 3.5 Sample Document

```json
{
  "_id": "64a1b2c3d4e5f67890abcdef",
  "longUrl": "https://www.example.com/very/long/path?query=value&foo=bar",
  "shortCode": "aB3dEf",
  "clicks": 42,
  "isCustom": false,
  "isActive": true,
  "expiresAt": "2026-08-17T15:30:00.000Z",
  "sessionId": "sess_k8x92mNpQr",
  "userId": null,
  "createdAt": "2026-08-10T15:30:00.000Z",
  "updatedAt": "2026-08-10T18:45:22.000Z"
}
```

### 3.6 Entity Relationship (Future v2.0)

```
┌──────────────┐         ┌──────────────┐
│    users     │ 1    N  │     urls     │
│──────────────│─────────│──────────────│
│ _id          │         │ _id          │
│ email        │         │ longUrl      │
│ passwordHash │         │ shortCode    │
│ name         │         │ clicks       │
│ createdAt    │         │ userId (FK)  │
│              │         │ expiresAt    │
└──────────────┘         └──────────────┘
```

---

## 4. 🔌 API Design

### 4.1 Base URL

```
Development:  http://localhost:3000
Production:   https://quicklink-<hash>.a.run.app
```

### 4.2 API Endpoints

| Method   | Endpoint              | Description                    | Auth  | Rate Limit        |
| -------- | --------------------- | ------------------------------ | ----- | ------------------ |
| `POST`   | `/api/shorten`        | Create a new short URL         | None  | 10 req/min per IP  |
| `GET`    | `/:shortCode`         | Redirect to original URL       | None  | 60 req/min per IP  |
| `GET`    | `/api/urls`           | Get all URLs for a session     | None  | 30 req/min per IP  |
| `GET`    | `/api/urls/:shortCode`| Get stats for a specific URL   | None  | 30 req/min per IP  |
| `DELETE` | `/api/urls/:shortCode`| Delete (deactivate) a URL      | None  | 10 req/min per IP  |
| `GET`    | `/api/health`         | Health check endpoint          | None  | Unlimited          |

### 4.3 Endpoint Details

---

#### 📌 `POST /api/shorten` — Create Short URL

**Description:** Accepts a long URL and optionally a custom short code. Returns the shortened URL, QR code data, and expiry information.

**Request:**

```http
POST /api/shorten HTTP/1.1
Content-Type: application/json

{
  "longUrl": "https://www.example.com/very/long/path?query=value",
  "customCode": "my-brand",       // optional — user-chosen alias
  "sessionId": "sess_k8x92mNpQr"  // optional — for dashboard tracking
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "longUrl": "https://www.example.com/very/long/path?query=value",
    "shortUrl": "https://quicklink.app/my-brand",
    "shortCode": "my-brand",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "clicks": 0,
    "isCustom": true,
    "createdAt": "2026-08-10T15:30:00.000Z",
    "expiresAt": "2026-08-17T15:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                      | Response Body                                                    |
| ------ | ------------------------------ | ---------------------------------------------------------------- |
| `400`  | Missing or invalid `longUrl`   | `{ "success": false, "error": "Please provide a valid URL starting with http:// or https://" }` |
| `400`  | Invalid custom code format     | `{ "success": false, "error": "Custom code must be 3-30 alphanumeric characters, hyphens, or underscores" }` |
| `409`  | Custom code already taken      | `{ "success": false, "error": "This custom code is already in use. Please try another." }` |
| `429`  | Rate limit exceeded            | `{ "success": false, "error": "Too many requests. Please try again later." }` |
| `500`  | Internal server error          | `{ "success": false, "error": "Something went wrong. Please try again." }` |

---

#### 📌 `GET /:shortCode` — Redirect to Original URL

**Description:** Looks up the short code, increments the click counter, and performs a 302 redirect to the original URL.

**Request:**

```http
GET /aB3dEf HTTP/1.1
```

**Success Response (302 Found):**

```http
HTTP/1.1 302 Found
Location: https://www.example.com/very/long/path?query=value
```

**Error Responses:**

| Status | Condition                    | Behavior                                        |
| ------ | ---------------------------- | ----------------------------------------------- |
| `404`  | Short code not found         | Render `404.html` — "This link doesn't exist"   |
| `410`  | URL has expired              | Render `expired.html` — "This link has expired"  |

---

#### 📌 `GET /api/urls` — Get All URLs (Session)

**Description:** Returns all URLs created within a specific browser session, sorted by newest first.

**Request:**

```http
GET /api/urls?sessionId=sess_k8x92mNpQr&page=1&limit=20 HTTP/1.1
```

**Query Parameters:**

| Parameter   | Type   | Required | Default | Description                       |
| ----------- | ------ | -------- | ------- | --------------------------------- |
| `sessionId` | String | ✅ Yes   | —       | Browser session identifier        |
| `page`      | Number | No       | `1`     | Page number for pagination        |
| `limit`     | Number | No       | `20`    | Number of results per page        |
| `search`    | String | No       | —       | Filter by original URL substring  |
| `sort`      | String | No       | `-createdAt` | Sort field and direction     |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "longUrl": "https://www.example.com/very/long/path",
        "shortUrl": "https://quicklink.app/aB3dEf",
        "shortCode": "aB3dEf",
        "clicks": 42,
        "isCustom": false,
        "isActive": true,
        "createdAt": "2026-08-10T15:30:00.000Z",
        "expiresAt": "2026-08-17T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

#### 📌 `GET /api/urls/:shortCode` — Get URL Stats

**Description:** Returns detailed information and click statistics for a specific short URL.

**Request:**

```http
GET /api/urls/aB3dEf HTTP/1.1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "longUrl": "https://www.example.com/very/long/path",
    "shortUrl": "https://quicklink.app/aB3dEf",
    "shortCode": "aB3dEf",
    "clicks": 42,
    "isCustom": false,
    "isActive": true,
    "createdAt": "2026-08-10T15:30:00.000Z",
    "expiresAt": "2026-08-17T15:30:00.000Z",
    "timeRemaining": "6 days, 23 hours"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": "URL not found"
}
```

---

#### 📌 `DELETE /api/urls/:shortCode` — Delete (Deactivate) URL

**Description:** Soft-deletes a URL by setting `isActive` to `false`. The short code is not released for reuse.

**Request:**

```http
DELETE /api/urls/aB3dEf HTTP/1.1
Content-Type: application/json

{
  "sessionId": "sess_k8x92mNpQr"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "URL has been deleted successfully"
}
```

**Error Responses:**

| Status | Condition                    | Response                                            |
| ------ | ---------------------------- | --------------------------------------------------- |
| `404`  | Short code not found         | `{ "success": false, "error": "URL not found" }`    |
| `403`  | Session doesn't match        | `{ "success": false, "error": "Unauthorized" }`     |

---

#### 📌 `GET /api/health` — Health Check

**Description:** Returns the health status of the application, including database connectivity.

**Request:**

```http
GET /api/health HTTP/1.1
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "timestamp": "2026-08-10T15:30:00.000Z",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

**Degraded Response (503 Service Unavailable):**

```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "uptime": 86400,
    "timestamp": "2026-08-10T15:30:00.000Z",
    "database": "disconnected",
    "version": "1.0.0"
  }
}
```

### 4.4 API Response Format Standard

All API responses follow a consistent envelope format:

```javascript
// ── Success ──
{
  "success": true,
  "data": { ... }             // Object or Array
}

// ── Success with message ──
{
  "success": true,
  "message": "Operation completed"
}

// ── Error ──
{
  "success": false,
  "error": "Human-readable error message"
}
```

### 4.5 HTTP Status Codes Used

| Code  | Meaning                | When Used                                    |
| ----- | ---------------------- | -------------------------------------------- |
| `200` | OK                     | Successful GET, DELETE                        |
| `201` | Created                | Successful POST (new URL created)            |
| `302` | Found (Redirect)       | Short URL redirect to original               |
| `400` | Bad Request            | Invalid input, validation failure             |
| `403` | Forbidden              | Session mismatch on delete                    |
| `404` | Not Found              | Short code doesn't exist                      |
| `409` | Conflict               | Custom code already taken                     |
| `410` | Gone                   | URL has expired                               |
| `429` | Too Many Requests      | Rate limit exceeded                           |
| `500` | Internal Server Error  | Unexpected server error                       |
| `503` | Service Unavailable    | Database unreachable                          |

---

## 5. 🔄 Request & Response Flow

### 5.1 Flow A — User Creates a Short URL

```
Step-by-step: POST /api/shorten
══════════════════════════════════════════════════════════════════

Step 1 ▸ USER ACTION
         User pastes "https://www.example.com/long/url" into the
         input field and clicks "Shorten"

Step 2 ▸ CLIENT-SIDE VALIDATION (public/js/app.js)
         ├── Check if input is not empty
         ├── Check URL format with regex: /^https?:\/\/.+/
         ├── If invalid → show inline error, STOP
         └── If valid → send fetch() request to API

Step 3 ▸ HTTP REQUEST
         POST /api/shorten
         Headers: Content-Type: application/json
         Body: {
           "longUrl": "https://www.example.com/long/url",
           "customCode": "",          // empty = auto-generate
           "sessionId": "sess_abc123" // from localStorage
         }

Step 4 ▸ MIDDLEWARE PIPELINE (server-side)
         ├── helmet()            → Set secure HTTP headers
         ├── cors()              → Validate origin
         ├── express.json()      → Parse JSON body
         ├── rateLimiter()       → Check: < 10 requests/min from this IP?
         │   └── If exceeded → 429 response, STOP
         └── validator()         → Validate request body schema
             └── If invalid → 400 response, STOP

Step 5 ▸ CONTROLLER (controllers/urlController.js)
         ├── Extract { longUrl, customCode, sessionId } from req.body
         └── Call urlService.createShortUrl(longUrl, customCode, sessionId)

Step 6 ▸ SERVICE LAYER (services/urlService.js)
         ├── 6a. Sanitize longUrl (trim whitespace, remove trailing slashes)
         ├── 6b. Validate URL format (valid-url library)
         ├── 6c. Check deny-list (localhost, private IPs, malicious domains)
         │        └── If blocked → throw ValidationError
         ├── 6d. Check for duplicates:
         │        Query: Url.findOne({ longUrl, sessionId, isActive: true })
         │        └── If found → return existing document (skip creation)
         ├── 6e. Handle custom code (if provided):
         │        ├── Validate format: /^[a-zA-Z0-9_-]{3,30}$/
         │        ├── Check availability: Url.findOne({ shortCode })
         │        │   └── If taken → throw ConflictError (409)
         │        └── Use custom code as shortCode
         ├── 6f. Generate short code (if no custom code):
         │        └── Use nanoid(8) → e.g., "aB3dEf9x"
         ├── 6g. Create document:
         │        new Url({
         │          longUrl,
         │          shortCode,
         │          isCustom: !!customCode,
         │          sessionId,
         │          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
         │        }).save()
         ├── 6h. Generate QR code (qrcode library → base64 PNG)
         └── 6i. Return formatted response object

Step 7 ▸ CONTROLLER RESPONSE
         Sends 201 Created with response body:
         {
           "success": true,
           "data": {
             "longUrl": "https://www.example.com/long/url",
             "shortUrl": "https://quicklink.app/aB3dEf9x",
             "shortCode": "aB3dEf9x",
             "qrCode": "data:image/png;base64,...",
             "clicks": 0,
             "createdAt": "2026-08-10T15:30:00.000Z",
             "expiresAt": "2026-08-17T15:30:00.000Z"
           }
         }

Step 8 ▸ CLIENT-SIDE RENDERING (public/js/app.js)
         ├── Parse JSON response
         ├── Display short URL in result card
         ├── Render QR code image
         ├── Attach "Copy" button event handler
         ├── Save shortCode to localStorage (for dashboard)
         └── Show success animation
```

### 5.2 Flow B — User Visits a Short URL (Redirect)

```
Step-by-step: GET /:shortCode
══════════════════════════════════════════════════════════════════

Step 1 ▸ USER ACTION
         Someone clicks "https://quicklink.app/aB3dEf9x"
         (in a message, email, social media post, or QR scan)

Step 2 ▸ HTTP REQUEST
         GET /aB3dEf9x HTTP/1.1
         Host: quicklink.app

Step 3 ▸ MIDDLEWARE PIPELINE
         ├── helmet()        → Set secure headers
         ├── rateLimiter()   → Check: < 60 redirects/min from this IP?
         │   └── If exceeded → 429 response
         └── Pass to route handler

Step 4 ▸ ROUTE MATCHING (routes/redirectRoutes.js)
         ├── Express matches /:shortCode pattern
         └── Calls redirectController.handleRedirect(req, res)

Step 5 ▸ CONTROLLER (controllers/redirectController.js)
         ├── Extract shortCode from req.params
         └── Call urlService.resolveAndTrack(shortCode)

Step 6 ▸ SERVICE LAYER (services/urlService.js)
         │
         ├── 6a. CHECK CACHE (if Redis enabled)
         │        ├── Redis GET `url:aB3dEf9x`
         │        ├── If HIT → use cached longUrl (skip DB read)
         │        └── If MISS → proceed to database
         │
         ├── 6b. DATABASE LOOKUP
         │        Query: Url.findOne({ shortCode: "aB3dEf9x" })
         │        ├── If NOT FOUND → throw NotFoundError (404)
         │        └── If FOUND → continue
         │
         ├── 6c. CHECK EXPIRY
         │        ├── If expiresAt < Date.now() → throw GoneError (410)
         │        └── If not expired → continue
         │
         ├── 6d. CHECK ACTIVE STATUS
         │        ├── If isActive === false → throw GoneError (410)
         │        └── If active → continue
         │
         ├── 6e. INCREMENT CLICK COUNT (fire-and-forget)
         │        Url.updateOne(
         │          { shortCode: "aB3dEf9x" },
         │          { $inc: { clicks: 1 } }
         │        )
         │        // Non-blocking: don't await; let it happen async
         │
         ├── 6f. CACHE RESULT (if Redis enabled)
         │        Redis SET `url:aB3dEf9x` = longUrl, TTL 3600s
         │
         └── 6g. RETURN longUrl

Step 7 ▸ CONTROLLER RESPONSE
         res.redirect(302, "https://www.example.com/long/url")

Step 8 ▸ BROWSER
         Browser follows 302 redirect and loads the original page.
         Total time from click to destination: < 100ms target.
```

### 5.3 Flow C — Error Scenarios

```
SCENARIO: Expired URL
═══════════════════════

  Browser → GET /aB3dEf9x
                │
                ▼
         URL found in DB
         expiresAt = 2026-08-05 (past)
                │
                ▼
         Respond with 410 Gone
         Render expired.html:
         ┌─────────────────────────────────┐
         │  ⏰ This Link Has Expired       │
         │                                 │
         │  This short link is no longer   │
         │  active. It expired on          │
         │  Aug 5, 2026.                   │
         │                                 │
         │  [Create a New Link →]          │
         └─────────────────────────────────┘


SCENARIO: Non-Existent URL
══════════════════════════════

  Browser → GET /xYzNoExist
                │
                ▼
         URL not found in DB
                │
                ▼
         Respond with 404 Not Found
         Render 404.html:
         ┌─────────────────────────────────┐
         │  🔗 Link Not Found              │
         │                                 │
         │  We couldn't find a link with   │
         │  this code. It may have been    │
         │  deleted or never existed.      │
         │                                 │
         │  [Go to Homepage →]             │
         └─────────────────────────────────┘
```

---

## 6. 🛡️ Security Architecture

### 6.1 Security Layers Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY DEFENSE LAYERS                     │
│                                                                │
│   Layer 1:  HTTPS / TLS Encryption (in transit)               │
│   Layer 2:  Helmet.js (secure HTTP headers)                   │
│   Layer 3:  CORS (origin restriction)                         │
│   Layer 4:  Rate Limiting (abuse prevention)                  │
│   Layer 5:  Input Validation (injection prevention)           │
│   Layer 6:  URL Deny-List (malicious content blocking)        │
│   Layer 7:  Environment Variables (secret management)         │
│   Layer 8:  MongoDB Validation (schema-level enforcement)     │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Input Validation Layer

```javascript
// middleware/validator.js

const validateShortenRequest = (req, res, next) => {
  const { longUrl, customCode } = req.body;

  // ── Validate longUrl ──
  if (!longUrl || typeof longUrl !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid URL',
    });
  }

  // Must start with http:// or https://
  const urlPattern = /^https?:\/\/.+\..+/;
  if (!urlPattern.test(longUrl.trim())) {
    return res.status(400).json({
      success: false,
      error: 'URL must start with http:// or https://',
    });
  }

  // Block dangerous URLs
  const blockedPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/0\./,
    /^https?:\/\/10\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  ];

  if (blockedPatterns.some((p) => p.test(longUrl))) {
    return res.status(400).json({
      success: false,
      error: 'This URL is not allowed for security reasons',
    });
  }

  // Max URL length
  if (longUrl.length > 2048) {
    return res.status(400).json({
      success: false,
      error: 'URL is too long (max 2048 characters)',
    });
  }

  // ── Validate customCode (optional) ──
  if (customCode) {
    const codePattern = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!codePattern.test(customCode)) {
      return res.status(400).json({
        success: false,
        error:
          'Custom code must be 3-30 characters and can only contain letters, numbers, hyphens, and underscores',
      });
    }
  }

  next();
};
```

### 6.3 Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// ── General API rate limiter ──
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,         // 1 minute window
  max: 10,                          // 10 requests per window per IP
  standardHeaders: true,            // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again in a minute.',
  },
});

// ── Stricter limiter for URL creation ──
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,         // 1 hour window
  max: 30,                           // 30 creations per hour per IP
  message: {
    success: false,
    error: 'URL creation limit reached. Please try again later.',
  },
});

// ── Lenient limiter for redirects ──
const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,          // 1 minute window
  max: 60,                           // 60 redirects per minute per IP
  message: {
    success: false,
    error: 'Too many redirect requests.',
  },
});
```

### 6.4 CORS Configuration

```javascript
// In server.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
```

### 6.5 Helmet.js — Secure HTTP Headers

```javascript
// In server.js
const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
```

### 6.6 Environment Variables

```bash
# .env.example — Template for required environment variables

# ── Server ──
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# ── MongoDB ──
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/quicklink

# ── Redis (Optional) ──
REDIS_URL=redis://localhost:6379

# ── Rate Limiting ──
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10

# ── CORS ──
ALLOWED_ORIGINS=http://localhost:3000

# ── Short Code ──
SHORT_CODE_LENGTH=8
```

```javascript
// config/env.js — Validate required variables at startup
const requiredVars = ['PORT', 'MONGODB_URI', 'BASE_URL'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});
```

### 6.7 Security Checklist

| # | Control                         | Status      | Implementation                     |
|---|-------------------------------- |------------ |----------------------------------- |
| 1 | HTTPS / TLS                     | ✅ Enforced | Cloud Run provides TLS by default  |
| 2 | Secure HTTP headers             | ✅ Active   | Helmet.js middleware               |
| 3 | CORS origin restriction         | ✅ Active   | cors() with explicit allowed origins |
| 4 | Rate limiting                   | ✅ Active   | express-rate-limit (10 req/min)    |
| 5 | Input validation (server)       | ✅ Active   | Custom validator middleware        |
| 6 | Input validation (client)       | ✅ Active   | Regex checks before fetch()        |
| 7 | NoSQL injection prevention      | ✅ Active   | Mongoose schema + parameterized queries |
| 8 | XSS prevention                  | ✅ Active   | CSP headers + output encoding      |
| 9 | URL deny-list                   | ✅ Active   | Block localhost, private IPs       |
| 10| Secrets in env vars             | ✅ Active   | dotenv + Cloud Run secrets         |
| 11| Dependency vulnerability scan   | 🔄 Planned | npm audit + Dependabot             |
| 12| Request size limit              | ✅ Active   | express.json({ limit: '1mb' })     |

---

## 7. ⚡ Performance Considerations

### 7.1 Database Indexing Strategy

The redirect path (`GET /:shortCode`) is the **most latency-sensitive** operation and the **highest-traffic** endpoint. Index design prioritizes this:

```
Query Pattern                          Index Used                     Complexity
──────────────────────────────────────────────────────────────────────────────────
Find by shortCode (redirect)           { shortCode: 1 }  UNIQUE      O(log n)
Find by session (dashboard)            { sessionId: 1, createdAt: -1 } O(log n)
Duplicate check (create)               { longUrl: 1, sessionId: 1 }   O(log n)
Auto-delete expired docs               { expiresAt: 1 }  TTL         Automatic
Filter active URLs                     { isActive: 1 }               O(log n)
```

**Index Size Estimate (1M documents):**

| Index                    | Estimated Size |
| ------------------------ | -------------- |
| `shortCode` (unique)    | ~25 MB         |
| `sessionId + createdAt` | ~35 MB         |
| `longUrl + sessionId`   | ~80 MB         |
| `expiresAt` (TTL)       | ~15 MB         |
| **Total Index RAM**      | **~155 MB**    |

### 7.2 Caching Strategy with Redis

```
                          REDIRECT FLOW WITH CACHE
  ═══════════════════════════════════════════════════════════

    Request: GET /aB3dEf

    ┌───────────┐     ┌──────────────┐     ┌──────────────┐
    │  Express  │────▶│ Redis Cache  │     │   MongoDB    │
    │  Server   │     │              │     │              │
    │           │     │ Key: aB3dEf  │     │ urls         │
    │           │     │ Val: longUrl │     │ collection   │
    │           │◀────│ TTL: 1 hour  │     │              │
    │           │     └──────────────┘     └──────────────┘
    │           │           │                     │
    │           │    CACHE HIT? ──── YES ──▶ Return cached
    │           │           │                 longUrl
    │           │          NO                (skip DB read)
    │           │           │
    │           │           ▼
    │           │────────────────────────▶ Query MongoDB
    │           │◀──────────────────────── Return document
    │           │           │
    │           │     Store in Redis
    │           │     (for next request)
    │           │           │
    └───────────┘           ▼
         │              302 Redirect
         ▼
      Increment click count
      (async, non-blocking)
```

#### Cache Implementation

```javascript
// services/cacheService.js

class CacheService {
  constructor(redisClient) {
    this.client = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Get a cached URL by short code
   * @returns {string|null} The original URL, or null if not cached
   */
  async get(shortCode) {
    if (!this.client) return null; // Redis not configured
    try {
      return await this.client.get(`url:${shortCode}`);
    } catch (err) {
      console.error('Redis GET error:', err.message);
      return null; // Gracefully degrade — fall through to MongoDB
    }
  }

  /**
   * Cache a URL mapping
   */
  async set(shortCode, longUrl, ttl = this.defaultTTL) {
    if (!this.client) return;
    try {
      await this.client.setEx(`url:${shortCode}`, ttl, longUrl);
    } catch (err) {
      console.error('Redis SET error:', err.message);
      // Non-critical — don't throw
    }
  }

  /**
   * Remove a cached entry (on delete or expiry)
   */
  async invalidate(shortCode) {
    if (!this.client) return;
    try {
      await this.client.del(`url:${shortCode}`);
    } catch (err) {
      console.error('Redis DEL error:', err.message);
    }
  }
}
```

#### Cache Strategy Rules

| Rule                        | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| **Cache-Aside Pattern**     | Application checks cache first; on miss, reads from DB and populates cache |
| **TTL: 1 Hour**             | Cached entries expire after 1 hour to balance freshness and performance |
| **Graceful Degradation**    | If Redis is down, the app falls through to MongoDB seamlessly         |
| **Invalidation on Delete**  | When a URL is deleted, the cache entry is also removed               |
| **Click Count Not Cached**  | Click counts are always written directly to MongoDB                  |
| **Optional Dependency**     | Redis is not required; app functions fully with MongoDB alone        |

### 7.3 High Traffic Handling

| Strategy                         | Implementation                                                    |
| -------------------------------- | ----------------------------------------------------------------- |
| **Stateless Design**             | No server-side sessions → any Cloud Run instance can handle any request |
| **Cloud Run Auto-Scaling**       | Scales from 0 to N instances based on request volume              |
| **Connection Pooling**           | Mongoose maintains a connection pool to MongoDB Atlas (max 10)    |
| **Async Click Tracking**         | `$inc` update is fire-and-forget; doesn't block the redirect response |
| **Static Asset Caching**         | `Cache-Control: public, max-age=86400` for CSS, JS, images       |
| **Gzip Compression**             | `compression()` middleware for text-based responses               |
| **Minimal Redirect Latency**     | Redis cache + lean Mongoose queries (`select()` only needed fields) |
| **Database Read Replicas**       | MongoDB Atlas supports read preference for secondary replicas     |

### 7.4 Performance Budget

| Metric                   | Target       | Critical Threshold  |
| ------------------------ | ------------ | ------------------- |
| Redirect response time   | < 50ms       | 100ms               |
| API response time        | < 200ms      | 500ms               |
| Page load (homepage)     | < 1.5s       | 2.0s                |
| Page load (dashboard)    | < 2.0s       | 3.0s                |
| Time to First Byte       | < 100ms      | 200ms               |
| Total JS bundle size     | < 50 KB      | 100 KB              |
| Total CSS bundle size    | < 20 KB      | 40 KB               |

---

## 8. ☁️ Deployment Architecture

### 8.1 Deployment Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD PLATFORM                            │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                    GOOGLE CLOUD RUN                            │     │
│   │                                                                │     │
│   │   ┌────────────────────────────────────────────────────────┐  │     │
│   │   │              Container Instance 1                      │  │     │
│   │   │  ┌──────────────────────────────────────────────────┐  │  │     │
│   │   │  │  Docker Container                                │  │  │     │
│   │   │  │                                                  │  │  │     │
│   │   │  │  Node.js v18 LTS                                │  │  │     │
│   │   │  │  Express.js Server                              │  │  │     │
│   │   │  │  Static Files (public/)                         │  │  │     │
│   │   │  │                                                  │  │  │     │
│   │   │  │  PORT: 8080 (Cloud Run default)                 │  │  │     │
│   │   │  └──────────────────────────────────────────────────┘  │  │     │
│   │   └────────────────────────────────────────────────────────┘  │     │
│   │                                                                │     │
│   │   ┌────────────────────────────────────────────────────────┐  │     │
│   │   │              Container Instance 2 (auto-scaled)        │  │     │
│   │   │               ... identical to Instance 1 ...          │  │     │
│   │   └────────────────────────────────────────────────────────┘  │     │
│   │                                                                │     │
│   │   ┌────────────────────────────────────────────────────────┐  │     │
│   │   │              Container Instance N (auto-scaled)        │  │     │
│   │   │               ... identical to Instance 1 ...          │  │     │
│   │   └────────────────────────────────────────────────────────┘  │     │
│   │                                                                │     │
│   └───────────────────────────┬────────────────────────────────────┘     │
│                               │                                          │
│   ┌───────────────────────────┼────────────────────────────────────┐     │
│   │           Cloud Run Configuration                              │     │
│   │                                                                │     │
│   │   • Min instances: 1 (avoid cold starts)                      │     │
│   │   • Max instances: 10                                          │     │
│   │   • CPU: 1 vCPU                                               │     │
│   │   • Memory: 512 MB                                             │     │
│   │   • Concurrency: 80 requests per instance                     │     │
│   │   • Timeout: 60 seconds                                       │     │
│   │   • Region: us-central1 (or nearest to target users)          │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │           Cloud Monitoring & Logging                           │     │
│   │                                                                │     │
│   │   • Cloud Logging (stdout/stderr from containers)             │     │
│   │   • Cloud Monitoring (CPU, memory, request latency)           │     │
│   │   • Uptime Checks (/api/health every 60 seconds)              │     │
│   │   • Alert Policies (email/Slack on threshold breach)          │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Outbound connections
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            ▼                                     ▼
 ┌───────────────────────┐          ┌───────────────────────────┐
 │    MongoDB Atlas       │          │  Redis Cloud (Optional)   │
 │    (Managed Cluster)   │          │  (Managed Instance)       │
 │                        │          │                           │
 │  Cluster: quicklink    │          │  Instance: quicklink-cache│
 │  Region: us-central1   │          │  Memory: 30 MB            │
 │  Tier: M0 Free / M10   │          │  Region: us-central1      │
 │  Replicas: 3-node set  │          │                           │
 │  Backup: Daily          │          │  Provider: Redis Labs     │
 │  TLS: Enforced          │          │  or Memorystore           │
 └───────────────────────┘          └───────────────────────────┘
```

### 8.2 Dockerfile

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first (for Docker layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# ── Stage 2: Run ──────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy built dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set ownership
RUN chown -R nodeuser:nodejs /app

USER nodeuser

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
```

### 8.3 Environment Variables in Production

Environment variables are configured through the **Cloud Run console** or `gcloud` CLI. They are never stored in the Docker image.

```bash
# ── Deploy with environment variables ──
gcloud run deploy quicklink \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "BASE_URL=https://quicklink-<hash>.a.run.app" \
  --set-env-vars "SHORT_CODE_LENGTH=8" \
  --set-env-vars "RATE_LIMIT_MAX=10" \
  --set-secrets "MONGODB_URI=mongodb-uri:latest" \
  --set-secrets "REDIS_URL=redis-url:latest" \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 60
```

**Secret Management:**

| Variable       | Type          | Storage                          |
| -------------- | ------------- | -------------------------------- |
| `NODE_ENV`     | Plain text    | Cloud Run env var                |
| `BASE_URL`     | Plain text    | Cloud Run env var                |
| `MONGODB_URI`  | **Secret**    | Google Secret Manager            |
| `REDIS_URL`    | **Secret**    | Google Secret Manager            |

### 8.4 MongoDB Atlas Connection

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool settings
      maxPoolSize: 10,          // Max concurrent connections
      minPoolSize: 2,           // Keep 2 connections warm
      serverSelectionTimeoutMS: 5000,   // Timeout after 5s
      socketTimeoutMS: 45000,           // Close inactive sockets after 45s

      // Retry settings
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit — Cloud Run will restart the container
  }
};

module.exports = connectDB;
```

### 8.5 CI/CD Pipeline (Optional)

```
┌──────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                            │
│               (GitHub Actions / Cloud Build)                 │
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐  │
│   │  PUSH    │──▶│  BUILD   │──▶│  TEST    │──▶│ DEPLOY │  │
│   │  to main │   │  Docker  │   │  Jest    │   │ Cloud  │  │
│   │          │   │  image   │   │  lint    │   │  Run   │  │
│   └──────────┘   └──────────┘   └──────────┘   └────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout code
      - uses: actions/checkout@v4

      # 2. Authenticate with Google Cloud
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      # 3. Set up Google Cloud SDK
      - uses: google-github-actions/setup-gcloud@v2

      # 4. Run tests
      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      # 5. Build & Deploy to Cloud Run
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: quicklink
          region: us-central1
          source: .
          env_vars: |
            NODE_ENV=production
            BASE_URL=${{ secrets.BASE_URL }}
          secrets: |
            MONGODB_URI=mongodb-uri:latest
            REDIS_URL=redis-url:latest
```

### 8.6 Deployment Checklist

| #  | Step                                             | Status |
| -- | ------------------------------------------------ | ------ |
| 1  | MongoDB Atlas cluster created & IP whitelisted   | ⬜     |
| 2  | Database user created with read/write permissions | ⬜     |
| 3  | Connection string tested locally                 | ⬜     |
| 4  | Secrets stored in Google Secret Manager          | ⬜     |
| 5  | Dockerfile builds successfully                   | ⬜     |
| 6  | Cloud Run service deployed                       | ⬜     |
| 7  | Environment variables configured                 | ⬜     |
| 8  | Custom domain mapped (optional)                  | ⬜     |
| 9  | SSL/TLS verified                                 | ⬜     |
| 10 | Health check endpoint responding                 | ⬜     |
| 11 | Uptime monitoring configured                     | ⬜     |
| 12 | Alerting policies set up                         | ⬜     |
| 13 | npm audit — 0 critical vulnerabilities           | ⬜     |
| 14 | Load test passed (100 concurrent users)          | ⬜     |

---

## 📎 Appendix

### A. Technology Decision Records

| Decision                       | Choice        | Rationale                                                          |
| ------------------------------ | ------------- | ------------------------------------------------------------------ |
| Runtime                        | Node.js 18    | Non-blocking I/O ideal for URL redirects; large ecosystem          |
| Framework                      | Express.js    | Minimal, flexible, industry standard; extensive middleware ecosystem |
| Database                       | MongoDB Atlas | Schema flexibility, TTL indexes for auto-expiry, free tier available |
| ODM                            | Mongoose      | Schema validation, middleware hooks, clean query API               |
| Short ID generation            | nanoid        | Fast, URL-safe, configurable length, no dependencies               |
| Containerization               | Docker        | Reproducible builds, Cloud Run requirement                         |
| Hosting                        | Cloud Run     | Serverless, auto-scaling, pay-per-use, built-in TLS               |
| Cache (optional)               | Redis         | Sub-millisecond reads, TTL support, industry standard              |

### B. Glossary

| Term                    | Definition                                                                  |
| ----------------------- | --------------------------------------------------------------------------- |
| **Cloud Run**           | Google Cloud's fully managed serverless container platform                   |
| **TTL Index**           | MongoDB index that automatically deletes documents after a specified time    |
| **Cache-Aside**         | Caching pattern where the app checks cache first, then falls through to DB  |
| **Fire-and-Forget**     | Executing an async operation without awaiting its result                     |
| **Cold Start**          | Delay when a new container instance spins up from zero                      |
| **Connection Pool**     | Pre-established database connections reused across requests                  |
| **302 Redirect**        | HTTP status code for temporary redirect; browser follows the Location header |
| **Soft Delete**         | Marking a record as inactive instead of physically removing it from the DB  |

---

> **Document Status:** This architecture document should be reviewed alongside [01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md) for full project context. Updates will be made as the system evolves through implementation phases.

---

*© 2026 QuickLink — Built with ❤️ on Google Antigravity*
