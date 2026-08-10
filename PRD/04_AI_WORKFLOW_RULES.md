# 🤖 AI Agent Workflow & Rules Document

## **QuickLink — Multi-Agent Build System**

| Field            | Details                                  |
| ---------------- | ---------------------------------------- |
| **Document**     | AI Agent Workflow & Orchestration Rules   |
| **Version**      | 1.0                                      |
| **Status**       | Draft                                    |
| **Author**       | Systems Engineering Team                 |
| **Created**      | August 10, 2026                          |
| **Last Updated** | August 10, 2026                          |
| **Platform**     | Google Antigravity                       |

---

## 📑 Table of Contents

1. [Agent Overview](#1--agent-overview)
2. [Agent Roles & Responsibilities](#2--agent-roles--responsibilities)
3. [Agent Workflow Order](#3--agent-workflow-order)
4. [Parallel Agent Rules](#4--parallel-agent-rules)
5. [Agent Communication Rules](#5--agent-communication-rules)
6. [Agent Constraints & Boundaries](#6--agent-constraints--boundaries)
7. [Error Handling Rules](#7--error-handling-rules)
8. [Quality Gates](#8--quality-gates)
9. [Prompting Best Practices](#9--prompting-best-practices)

---

## 1. 🌐 Agent Overview

### 1.1 What Is an AI Agent in This Project?

An **AI agent** is a specialized, autonomous unit within the Google Antigravity platform that performs a specific role in the software development lifecycle. Each agent:

- **Has a defined scope** — It knows exactly what it is responsible for and what falls outside its domain.
- **Consumes structured inputs** — It reads from PRD documents, task lists, or outputs from other agents.
- **Produces structured outputs** — It generates code files, test reports, deployment artifacts, or task lists in a predictable format.
- **Follows rules** — It operates within a set of constraints, quality gates, and communication protocols defined in this document.
- **Is stateless per invocation** — Each agent invocation receives all necessary context; it does not rely on memory from previous runs.

```
  ┌──────────────────────────────────────────────────────────────┐
  │                     WHAT IS AN AI AGENT?                      │
  │                                                              │
  │   ┌────────────┐    ┌────────────────┐    ┌──────────────┐  │
  │   │   INPUTS   │───▶│   AI AGENT     │───▶│   OUTPUTS    │  │
  │   │            │    │                │    │              │  │
  │   │ • PRDs     │    │ • Role rules   │    │ • Code files │  │
  │   │ • Tasks    │    │ • Constraints  │    │ • Reports    │  │
  │   │ • Context  │    │ • Quality gates│    │ • Artifacts  │  │
  │   │ • Code     │    │ • Error rules  │    │ • Status     │  │
  │   └────────────┘    └────────────────┘    └──────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 1.2 Why We Use Multiple Agents

| Reason                        | Explanation                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| 🎯 **Specialization**         | Each agent masters one domain (backend, frontend, testing) rather than being a generalist          |
| 📏 **Reduced Context Window** | Smaller, focused prompts produce higher-quality outputs than monolithic "do everything" prompts     |
| 🔄 **Parallelism**            | Independent agents can work simultaneously, reducing total build time                              |
| 🛡️ **Isolation**              | A failure in one agent doesn't corrupt or block the entire system                                  |
| ✅ **Quality Control**        | Each agent's output goes through a quality gate before the next agent begins                       |
| 🔍 **Debuggability**          | When something breaks, we know exactly which agent produced the faulty output                      |
| 📐 **Consistency**            | Agents follow strict rules, producing uniform code style, naming conventions, and file structures   |

### 1.3 How Agents Communicate

Agents do **not** communicate directly with each other. Instead, they follow a **shared artifact** model:

```
  AGENT COMMUNICATION MODEL
  ═══════════════════════════════════════════════════════════════

  ┌──────────┐                                    ┌──────────┐
  │ Agent A  │                                    │ Agent B  │
  │ (Writer) │                                    │ (Reader) │
  └────┬─────┘                                    └────┬─────┘
       │                                               │
       │  WRITES output to                             │
       │  shared workspace                             │
       ▼                                               │
  ┌──────────────────────────────────────────┐         │
  │         SHARED WORKSPACE                 │         │
  │                                          │         │
  │  📄 PRD Documents (read-only)            │         │
  │  📁 Code Files (read/write per role)     │◀────────┘
  │  📋 Task Lists (read/write per role)     │  READS input from
  │  📊 Reports (write per role)             │  shared workspace
  │  🔒 Quality Gate Results                 │
  │                                          │
  └──────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────────────────────────────┐
  │         ORCHESTRATOR                     │
  │                                          │
  │  • Triggers agents in correct order      │
  │  • Checks quality gates                  │
  │  • Handles errors & retries              │
  │  • Reports status to user                │
  └──────────────────────────────────────────┘
```

**Key communication principles:**

1. **File-Based** — All communication happens through files in the shared workspace (code, configs, reports).
2. **Unidirectional** — An agent writes its output; the next agent reads it. There is no back-and-forth negotiation between agents.
3. **Orchestrator-Managed** — A central orchestrator (the human user or an automation layer) decides when to trigger each agent.
4. **Immutable Inputs** — Agents treat PRD documents as read-only. They never modify source requirement documents.
5. **Versioned Outputs** — If an agent must re-run (retry), it overwrites its own output files cleanly.

---

## 2. 👥 Agent Roles & Responsibilities

### Agent Summary Table

| #  | Agent Name                   | Role                         | Input Source                     | Output                        | Priority |
| -- | ---------------------------- | ---------------------------- | -------------------------------- | ----------------------------- | -------- |
| A1 | 📋 Project Planner Agent    | Break project into tasks     | `01_PROJECT_OVERVIEW.md`         | Task list with priorities     | 1st      |
| A2 | ⚙️ Backend Developer Agent  | Write Node.js/Express code   | `02_ARCHITECTURE.md` + tasks     | Backend code files            | 2nd      |
| A3 | 🎨 Frontend Developer Agent | Write HTML/CSS/JS code       | `03_UI_DESIGN.md` + tasks        | Frontend code files           | 2nd      |
| A4 | 🗄️ Database Agent           | Setup MongoDB schemas        | `02_ARCHITECTURE.md` (DB section)| Model files + indexes         | 2nd      |
| A5 | 🧪 Testing Agent            | Write and run all tests      | All code files                   | Test results + bug reports    | 3rd      |
| A6 | 🚀 Deployment Agent         | Deploy to Google Cloud Run   | All code + env variables         | Live URL + deploy report      | 4th      |

---

### 📋 AGENT 1 — Project Planner Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  📋 PROJECT PLANNER AGENT                                    │
  │                                                              │
  │  ROLE:    Analyze PRDs and decompose the project into an     │
  │           ordered, prioritized task list that other agents   │
  │           can execute sequentially.                          │
  │                                                              │
  │  SCOPE:   Planning ONLY — never writes code or tests         │
  │                                                              │
  │  INPUT ──▶ 01_PROJECT_OVERVIEW.md                            │
  │            02_ARCHITECTURE.md                                │
  │            03_UI_DESIGN.md                                   │
  │                                                              │
  │  OUTPUT ──▶ task_list.md (structured task breakdown)          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Read all PRD documents thoroughly                       | Parse features, architecture, and UI design specs                      |
| 2  | Create a hierarchical task breakdown                    | Group tasks by phase (Setup, Backend, Frontend, Testing, Deploy)       |
| 3  | Assign priority to each task                            | Critical → High → Medium → Low                                        |
| 4  | Estimate relative complexity                            | Small (S), Medium (M), Large (L), Extra-Large (XL)                     |
| 5  | Define task dependencies                                | Specify which tasks must complete before others can start              |
| 6  | Identify risks and blockers                             | Flag tasks that may need human input or external dependencies          |
| 7  | Map tasks to the correct agent                          | Tag each task with the agent responsible (A2, A3, A4, A5, A6)          |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R1.1   | Must ONLY create tasks that are within the project scope defined in `01_PROJECT_OVERVIEW.md`   |
| R1.2   | Must NOT invent features not mentioned in any PRD document                                    |
| R1.3   | Must NOT write any code, only task descriptions                                                |
| R1.4   | Must NOT make technology decisions — those are already decided in the Architecture PRD         |
| R1.5   | Every task must have: title, description, assigned agent, priority, complexity, dependencies   |
| R1.6   | Tasks must be small enough for an agent to complete in a single invocation                     |
| R1.7   | Must include setup/configuration tasks (npm init, folder structure, .gitignore)                |

**Output Format — `task_list.md`:**

```markdown
## Task: [TASK-001] Initialize Project Structure
- **Agent:** A2 (Backend Developer)
- **Priority:** 🔴 Critical
- **Complexity:** S (Small)
- **Dependencies:** None
- **Description:** Create the project folder structure as defined in 
  02_ARCHITECTURE.md Section 2. Initialize npm, create package.json, 
  .gitignore, .env.example, and README.md.
- **Acceptance Criteria:**
  - [ ] All folders from the architecture doc exist
  - [ ] package.json has correct name, version, scripts
  - [ ] .gitignore excludes node_modules, .env, dist
  - [ ] .env.example lists all required variables
```

---

### ⚙️ AGENT 2 — Backend Developer Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  ⚙️ BACKEND DEVELOPER AGENT                                 │
  │                                                              │
  │  ROLE:    Write all server-side Node.js and Express.js code  │
  │           including routes, controllers, services, and       │
  │           middleware — as specified in the Architecture PRD.  │
  │                                                              │
  │  SCOPE:   Backend code ONLY — never touches HTML/CSS/JS UI   │
  │                                                              │
  │  INPUT ──▶ 02_ARCHITECTURE.md                                │
  │            04_AI_WORKFLOW_RULES.md (this document)            │
  │            task_list.md (assigned tasks)                      │
  │            models/ (from Database Agent)                      │
  │                                                              │
  │  OUTPUT ──▶ server.js                                        │
  │             routes/*.js                                      │
  │             controllers/*.js                                 │
  │             services/*.js                                    │
  │             middleware/*.js                                   │
  │             utils/*.js                                       │
  │             config/*.js                                      │
  │             package.json (dependencies)                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Create `server.js` entry point                          | Express app setup, middleware loading, route mounting, DB connection    |
| 2  | Implement all API routes                                | As defined in `02_ARCHITECTURE.md` Section 4 (API Design)             |
| 3  | Write controller functions                              | Thin handlers: parse request → call service → format response          |
| 4  | Implement service layer business logic                  | URL creation, validation, redirect resolution, duplicate checking      |
| 5  | Create all middleware                                   | Rate limiting, input validation, error handling, 404 handler           |
| 6  | Write utility functions                                 | Short code generation (nanoid), URL validation, constants              |
| 7  | Configure database connection                           | Mongoose connection with retry logic, connection pooling               |
| 8  | Set up environment variable management                  | dotenv loading, required variable validation at startup                |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R2.1   | Must follow the folder structure exactly as defined in `02_ARCHITECTURE.md` Section 2          |
| R2.2   | Must implement the API response format exactly: `{ success: true/false, data/error }`         |
| R2.3   | Must use `async/await` for all asynchronous operations — no raw callbacks                     |
| R2.4   | Must handle all error cases with try/catch and pass errors to the error handler middleware     |
| R2.5   | Must NOT write any frontend code (HTML, CSS, client-side JS)                                  |
| R2.6   | Must NOT modify Mongoose model files — those belong to the Database Agent (A4)                |
| R2.7   | All API endpoints must match the exact paths, methods, and response codes from the Architecture PRD |
| R2.8   | Must use environment variables for all configuration — no hardcoded secrets or URLs            |
| R2.9   | Must add JSDoc comments to all exported functions                                              |
| R2.10  | Must use `const` by default; use `let` only when reassignment is needed; never use `var`      |
| R2.11  | Must use CommonJS (`require`/`module.exports`) for Node.js compatibility unless ESM is configured |
| R2.12  | Must implement graceful shutdown handling (`SIGTERM`, `SIGINT`)                                |

**Code Standards:**

```javascript
// ── EXAMPLE: What correct backend code looks like ──

// controllers/urlController.js

/**
 * Creates a new shortened URL.
 * @route   POST /api/shorten
 * @access  Public
 */
const createShortUrl = async (req, res, next) => {
  try {
    const { longUrl, customCode, sessionId } = req.body;
    
    const result = await urlService.createShortUrl(longUrl, customCode, sessionId);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

module.exports = { createShortUrl };
```

---

### 🎨 AGENT 3 — Frontend Developer Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🎨 FRONTEND DEVELOPER AGENT                                │
  │                                                              │
  │  ROLE:    Write all client-side code (HTML, CSS, JavaScript) │
  │           as specified in the UI Design PRD. The frontend    │
  │           must match the wireframes and design tokens.       │
  │                                                              │
  │  SCOPE:   Frontend code ONLY — never touches server-side code│
  │                                                              │
  │  INPUT ──▶ 03_UI_DESIGN.md                                   │
  │            02_ARCHITECTURE.md (API endpoints for fetch calls)│
  │            task_list.md (assigned tasks)                      │
  │                                                              │
  │  OUTPUT ──▶ public/index.html                                │
  │             public/dashboard.html                            │
  │             public/expired.html                              │
  │             public/404.html                                  │
  │             public/css/styles.css                             │
  │             public/css/dashboard.css                          │
  │             public/css/responsive.css                         │
  │             public/js/app.js                                  │
  │             public/js/dashboard.js                            │
  │             public/js/utils.js                                │
  │             public/assets/*                                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Build all HTML pages                                    | 4 pages: index, dashboard, expired, 404 — semantic HTML5               |
| 2  | Implement the complete CSS design system                | All design tokens from `03_UI_DESIGN.md` as CSS custom properties      |
| 3  | Create responsive layouts                               | Mobile-first, 4 breakpoints, card layout on mobile dashboard           |
| 4  | Implement all client-side JavaScript                    | Form handling, API calls (fetch), clipboard, QR generation             |
| 5  | Add all animations and transitions                      | As specified in Section 7 of the UI Design PRD                         |
| 6  | Ensure accessibility compliance                         | ARIA labels, keyboard nav, skip links, focus states, alt text          |
| 7  | Handle all client-side error states                     | Inline validation errors, toast notifications, empty states            |
| 8  | Implement localStorage for session tracking             | Generate and persist a sessionId for dashboard functionality           |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R3.1   | Must use the exact color hex codes, font sizes, and spacing values from `03_UI_DESIGN.md`     |
| R3.2   | Must use CSS custom properties (variables) for all design tokens — no hardcoded values         |
| R3.3   | Must use semantic HTML5 elements (`<nav>`, `<main>`, `<section>`, `<footer>`)                  |
| R3.4   | Must include `<meta viewport>` tag for responsive design                                       |
| R3.5   | Must NOT use any CSS framework (Bootstrap, Tailwind) — vanilla CSS only                       |
| R3.6   | Must NOT use any JavaScript framework (React, Vue) — vanilla JS only                          |
| R3.7   | Must NOT modify any server-side files (server.js, routes, controllers, models)                 |
| R3.8   | Must call API endpoints exactly as defined in `02_ARCHITECTURE.md` Section 4                   |
| R3.9   | Must handle `prefers-reduced-motion` media query for all animations                            |
| R3.10  | Must pass Google Mobile-Friendly Test criteria                                                 |
| R3.11  | All interactive elements must have unique, descriptive `id` attributes                         |
| R3.12  | Must include SEO meta tags (title, description, Open Graph) on every page                      |

---

### 🗄️ AGENT 4 — Database Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🗄️ DATABASE AGENT                                          │
  │                                                              │
  │  ROLE:    Design and implement MongoDB schemas, indexes,     │
  │           and database configuration as specified in the     │
  │           Architecture PRD.                                  │
  │                                                              │
  │  SCOPE:   Database layer ONLY — models, schemas, connection  │
  │                                                              │
  │  INPUT ──▶ 02_ARCHITECTURE.md (Section 3 — Database Design)  │
  │            task_list.md (assigned tasks)                      │
  │                                                              │
  │  OUTPUT ──▶ models/Url.js                                    │
  │             config/db.js                                     │
  │             config/redis.js (optional)                       │
  │             services/cacheService.js                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Create Mongoose URL schema                              | All fields, types, validation rules as in Architecture PRD Section 3.2 |
| 2  | Define all database indexes                             | 5 indexes including the TTL index for auto-expiry                      |
| 3  | Implement database connection logic                     | Mongoose connect with retry, connection pooling, event handlers        |
| 4  | Configure Redis client (optional)                       | Connection setup, error handling, graceful fallback if unavailable     |
| 5  | Create cache service wrapper                            | get/set/invalidate methods with TTL support                            |
| 6  | Add schema middleware (hooks)                           | Pre-save hooks for data sanitization if needed                         |
| 7  | Document all schema decisions                           | Inline comments explaining field choices and index rationale           |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R4.1   | Must follow the schema exactly as defined in `02_ARCHITECTURE.md` Section 3.2                  |
| R4.2   | Must create ALL 5 indexes from Section 3.4 of the Architecture PRD                             |
| R4.3   | Must use Mongoose schema validation (required, minlength, maxlength, match, enum)              |
| R4.4   | Must enable `timestamps: true` for automatic `createdAt` and `updatedAt` fields               |
| R4.5   | Must NOT write route handlers, controllers, or middleware — those belong to Agent A2           |
| R4.6   | Must NOT write frontend code — that belongs to Agent A3                                        |
| R4.7   | Must handle MongoDB connection errors gracefully with retry logic                              |
| R4.8   | Must set `maxPoolSize` for connection pooling (default: 10)                                    |
| R4.9   | Redis must be optional — the app must function fully without Redis connected                   |

---

### 🧪 AGENT 5 — Testing Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🧪 TESTING AGENT                                           │
  │                                                              │
  │  ROLE:    Write comprehensive test suites for all backend    │
  │           API endpoints and utility functions. Run tests     │
  │           and report results.                                │
  │                                                              │
  │  SCOPE:   Test code ONLY — never modifies source code        │
  │                                                              │
  │  INPUT ──▶ All code files (routes, controllers, services,    │
  │            models, utils, middleware)                         │
  │            02_ARCHITECTURE.md (API Design section)            │
  │                                                              │
  │  OUTPUT ──▶ tests/unit/*.test.js                             │
  │             tests/integration/*.test.js                      │
  │             tests/setup.js                                   │
  │             test_report.md                                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Write unit tests for all utility functions              | `generateCode`, `validateUrl`, constants                               |
| 2  | Write unit tests for service layer                      | `urlService` business logic with mocked dependencies                   |
| 3  | Write integration tests for all API endpoints           | Test each endpoint with real HTTP requests (supertest)                  |
| 4  | Test all success and error scenarios                    | Valid inputs, invalid inputs, edge cases, rate limits                   |
| 5  | Test redirect flow end-to-end                           | Create URL → visit short code → verify redirect + click count          |
| 6  | Generate a test report                                  | Pass/fail counts, coverage percentage, failed test details             |
| 7  | Report bugs with clear reproduction steps               | If a test fails, describe: expected vs actual, input, steps to repro   |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R5.1   | Must test ALL 6 API endpoints from the Architecture PRD                                        |
| R5.2   | Must test both success (2xx) and error (4xx, 5xx) responses for each endpoint                  |
| R5.3   | Must NOT modify any source code — only files in the `tests/` directory                         |
| R5.4   | Must use Jest or Mocha as the test framework (match what's in package.json)                    |
| R5.5   | Must use supertest for HTTP integration tests                                                  |
| R5.6   | Must achieve a minimum of 80% code coverage across the test suite                              |
| R5.7   | Must use a separate test database (connection string from env) — never test against production  |
| R5.8   | Must clean up test data after each test (use beforeEach/afterEach hooks)                        |
| R5.9   | Must report results in `test_report.md` using the standardized format below                    |
| R5.10  | Must test URL validation edge cases: empty string, missing protocol, localhost, very long URLs  |

**Test Report Format — `test_report.md`:**

```markdown
# 🧪 Test Report

## Summary
| Metric          | Value    |
| --------------- | -------- |
| Total Tests     | 45       |
| Passed          | 43       |
| Failed          | 2        |
| Skipped         | 0        |
| Pass Rate       | 95.6%    |
| Code Coverage   | 87%      |
| Execution Time  | 4.2s     |

## Failed Tests
### TEST: POST /api/shorten — should reject URLs longer than 2048 chars
- **Expected:** 400 status with error message
- **Actual:** 500 Internal Server Error
- **Root Cause:** Missing maxlength validation in validator middleware
- **Severity:** Medium
- **Suggested Fix:** Add `if (longUrl.length > 2048)` check in middleware/validator.js

## Coverage Breakdown
| File                  | Lines | Functions | Branches |
| --------------------- | ----- | --------- | -------- |
| urlService.js         | 92%   | 100%      | 85%      |
| urlController.js      | 88%   | 100%      | 75%      |
| ...                   | ...   | ...       | ...      |
```

---

### 🚀 AGENT 6 — Deployment Agent

```
  ┌──────────────────────────────────────────────────────────────┐
  │  🚀 DEPLOYMENT AGENT                                        │
  │                                                              │
  │  ROLE:    Package the application, deploy to Google Cloud    │
  │           Run, verify the deployment, and report the live    │
  │           URL back to the user.                              │
  │                                                              │
  │  SCOPE:   Deployment ONLY — never modifies application code  │
  │                                                              │
  │  INPUT ──▶ All code files (complete, tested application)     │
  │            Dockerfile                                        │
  │            Environment variables list                        │
  │            02_ARCHITECTURE.md (Section 8 — Deployment)       │
  │                                                              │
  │  OUTPUT ──▶ Live URL (https://quicklink-*.a.run.app)         │
  │             deploy_report.md                                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**Responsibilities:**

| #  | Responsibility                                          | Details                                                                |
| -- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Verify all code files are present                       | Check folder structure matches architecture spec                       |
| 2  | Verify Dockerfile is correct                            | Validate multi-stage build, correct Node version, non-root user        |
| 3  | Create/verify Cloud Run configuration                   | Min instances, max instances, memory, CPU, concurrency, timeout        |
| 4  | Set environment variables                               | Configure env vars and secrets via gcloud or Cloud Run console         |
| 5  | Execute deployment                                      | Run `gcloud run deploy` command                                        |
| 6  | Verify deployment is live                               | Hit the `/api/health` endpoint and confirm 200 response                |
| 7  | Run smoke tests against production                      | Create a URL, redirect through it, verify click count                  |
| 8  | Generate deployment report                              | Live URL, deployment time, health status, any warnings                 |

**Rules:**

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| R6.1   | Must NOT deploy if the test pass rate is below 90% (check `test_report.md`)                    |
| R6.2   | Must NOT modify any application source code — deployment config files only                     |
| R6.3   | Must verify the `/api/health` endpoint returns `{ "status": "healthy" }` after deployment      |
| R6.4   | Must use Google Secret Manager for sensitive environment variables (MONGODB_URI, REDIS_URL)     |
| R6.5   | Must configure `--min-instances 1` to avoid cold starts                                        |
| R6.6   | Must set `--allow-unauthenticated` for public access                                           |
| R6.7   | Must report the live URL to the user immediately after successful deployment                   |
| R6.8   | If deployment fails, must capture and report the full error log                                |

---

## 3. 🔄 Agent Workflow Order

### 3.1 Complete Workflow Sequence

```
  AGENT EXECUTION WORKFLOW
  ═══════════════════════════════════════════════════════════════════

  ┌───────────────────┐
  │  📄 PRD DOCUMENTS │
  │                   │
  │  01_PROJECT_      │
  │    OVERVIEW.md    │
  │  02_ARCHITECTURE  │
  │    .md            │
  │  03_UI_DESIGN.md  │
  │  04_AI_WORKFLOW_  │
  │    RULES.md       │
  └────────┬──────────┘
           │
           │  All PRDs ready
           │
           ▼
  ┌────────────────────┐
  │  PHASE 1: PLANNING │
  │                    │
  │  📋 Agent 1        │   TRIGGER: All PRD documents complete
  │  Project Planner   │   OUTPUT:  task_list.md
  │                    │   GATE:    Human approves task list
  └────────┬───────────┘
           │
           │  Task list approved ✅
           │
           ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  PHASE 2: CORE DEVELOPMENT (Parallel Track)                   │
  │                                                                │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
  │  │ 🗄️ Agent 4   │  │ ⚙️ Agent 2   │  │ 🎨 Agent 3          │ │
  │  │ Database     │  │ Backend      │  │ Frontend             │ │
  │  │              │  │              │  │                      │ │
  │  │ STARTS FIRST │  │ WAITS FOR    │  │ CAN START IN         │ │
  │  │ (no deps)    │  │ Agent 4      │  │ PARALLEL with A4     │ │
  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
  │         │                 │                      │             │
  │         │  models/ ready  │  backend ready       │  frontend   │
  │         │      ✅        │      ✅             │  ready ✅   │
  │         └────────┬────────┘                      │             │
  │                  │                               │             │
  │                  └───────────────┬────────────────┘             │
  │                                 │                              │
  │                      All code complete ✅                     │
  │                                                                │
  └────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
  ┌────────────────────┐
  │  PHASE 3: TESTING  │
  │                    │
  │  🧪 Agent 5        │   TRIGGER: All code files complete
  │  Testing Agent     │   OUTPUT:  test_report.md
  │                    │   GATE:    ≥ 90% pass rate
  └────────┬───────────┘
           │
           │  Tests pass ≥ 90% ✅
           │
           ▼
  ┌────────────────────┐
  │  PHASE 4: DEPLOY   │
  │                    │
  │  🚀 Agent 6        │   TRIGGER: Test pass rate ≥ 90%
  │  Deployment Agent  │   OUTPUT:  Live URL + deploy_report.md
  │                    │   GATE:    Health check returns 200
  └────────┬───────────┘
           │
           │  App is live ✅
           │
           ▼
  ┌────────────────────┐
  │  🎉 PROJECT        │
  │     COMPLETE!      │
  │                    │
  │  Live URL:         │
  │  quicklink-*.      │
  │  a.run.app         │
  └────────────────────┘
```

### 3.2 Trigger & Gate Details

| Phase   | Agent(s)        | Trigger Condition                        | Quality Gate (Exit Criteria)                    |
| ------- | --------------- | ---------------------------------------- | ----------------------------------------------- |
| Phase 1 | A1 (Planner)    | All 4 PRD documents exist in workspace   | Human approves the generated task list           |
| Phase 2 | A4 (Database)   | Task list approved                       | `models/Url.js` passes schema validation test    |
| Phase 2 | A2 (Backend)    | A4 outputs are complete                  | `server.js` starts without errors; `/api/health` returns 200 |
| Phase 2 | A3 (Frontend)   | Task list approved (parallel with A4)    | All 4 HTML pages render in browser; no console errors |
| Phase 3 | A5 (Testing)    | All A2, A3, A4 outputs are complete      | Test pass rate ≥ 90%; code coverage ≥ 80%       |
| Phase 4 | A6 (Deployment) | A5 test pass rate ≥ 90%                  | `/api/health` returns 200 on the live URL        |

### 3.3 Step-by-Step Execution Timeline

```
  TIME ──────────────────────────────────────────────────────▶

  Phase 1     Phase 2                    Phase 3    Phase 4
  ┌──────┐   ┌──────────────────────┐   ┌──────┐  ┌───────┐
  │ A1   │   │ A4 ──▶ A2            │   │ A5   │  │ A6    │
  │Plan  │──▶│ DB     Backend       │──▶│ Test │─▶│Deploy │
  │      │   │                      │   │      │  │       │
  │      │   │ A3 (parallel)        │   │      │  │       │
  │      │   │ Frontend             │   │      │  │       │
  └──────┘   └──────────────────────┘   └──────┘  └───────┘

  ◀─ Day 1 ─▶◀──── Days 2–5 ────────▶ ◀Day 6─▶  ◀Day 7──▶
```

---

## 4. ⚡ Parallel Agent Rules

### 4.1 Parallelism Matrix

This matrix defines which agents can operate simultaneously:

| Agent Pair            | Parallel? | Reason                                                                      |
| --------------------- | --------- | --------------------------------------------------------------------------- |
| A1 + Any              | ❌ No     | A1 must finish first — all other agents depend on the task list              |
| A4 + A3               | ✅ Yes    | Database and Frontend have no shared files; completely independent           |
| A4 + A2               | ❌ No     | A2 (Backend) imports from `models/Url.js` which A4 (Database) creates       |
| A2 + A3               | ✅ Yes    | Backend and Frontend work on different file sets; API contract is predefined |
| A5 + Any (A2/A3/A4)   | ❌ No     | Testing requires all code to be complete before running tests               |
| A6 + Any              | ❌ No     | Deployment is the final step; requires everything else to be done           |
| A2 + A4               | ⚠️ Sequential | A4 runs first, then A2 starts (A2 depends on A4's model files)         |

### 4.2 Parallel Execution Diagram

```
  PARALLELISM VISUALIZATION
  ═══════════════════════════════════════════════════════════════

  Agent 1 (Planner):     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                                 │
                                 │ task_list.md ready
                                 ▼
  Agent 4 (Database):    ░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░
                                        │
                                        │ models/ ready
                                        ▼
  Agent 2 (Backend):     ░░░░░░░░░░░░░░░░████████████░░░░░░░░░░
                                                     │
  Agent 3 (Frontend):    ░░░░░░░░████████████████████░│░░░░░░░░
                                                     │
                                        All code ready│
                                                     ▼
  Agent 5 (Testing):     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░
                                                              │
                                                     Tests pass│
                                                              ▼
  Agent 6 (Deployment):  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████

  Legend:  ████ = Active    ░░░░ = Waiting
```

### 4.3 Conflict Resolution Rules

| Conflict Scenario                             | Resolution                                                          |
| --------------------------------------------- | ------------------------------------------------------------------- |
| A2 and A3 both create a file in `public/`     | A3 owns `public/` exclusively; A2 must never write there            |
| A2 and A4 both modify `config/db.js`          | A4 owns database config; A2 only imports and uses it                |
| A3 makes API calls but endpoint isn't built yet| A3 uses the API contract from `02_ARCHITECTURE.md`; actual calls tested in Phase 3 |
| A5 discovers a bug that requires code changes | A5 reports the bug in `test_report.md`; does NOT fix it. The responsible agent (A2/A3/A4) is re-invoked to fix. |
| Two agents want to modify `package.json`      | A2 owns `package.json`; A4 lists its npm dependencies in output, and A2 adds them |

### 4.4 File Ownership Map

| File / Directory         | Owner Agent | Read Access     | Write Access |
| ------------------------ | ----------- | --------------- | ------------ |
| `01_PROJECT_OVERVIEW.md` | Human       | All agents      | None         |
| `02_ARCHITECTURE.md`     | Human       | All agents      | None         |
| `03_UI_DESIGN.md`        | Human       | All agents      | None         |
| `04_AI_WORKFLOW_RULES.md`| Human       | All agents      | None         |
| `task_list.md`           | A1          | All agents      | A1 only      |
| `server.js`              | A2          | A5, A6          | A2 only      |
| `routes/*`               | A2          | A5              | A2 only      |
| `controllers/*`          | A2          | A5              | A2 only      |
| `services/urlService.js` | A2          | A5              | A2 only      |
| `services/cacheService.js`| A4         | A2, A5          | A4 only      |
| `middleware/*`            | A2          | A5              | A2 only      |
| `utils/*`                | A2          | A3, A5          | A2 only      |
| `config/db.js`           | A4          | A2, A5          | A4 only      |
| `config/redis.js`        | A4          | A2, A5          | A4 only      |
| `config/env.js`          | A2          | A5, A6          | A2 only      |
| `models/*`               | A4          | A2, A5          | A4 only      |
| `public/*`               | A3          | A2 (read only), A5 | A3 only   |
| `tests/*`                | A5          | A6 (report only)| A5 only      |
| `Dockerfile`             | A6          | A2              | A6 only      |
| `package.json`           | A2          | All agents      | A2 only      |
| `.env.example`           | A2          | A6              | A2 only      |
| `test_report.md`         | A5          | A6, Human       | A5 only      |
| `deploy_report.md`       | A6          | Human           | A6 only      |

---

## 5. 📨 Agent Communication Rules

### 5.1 Communication Protocol

```
  COMMUNICATION FLOW
  ═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                   COMMUNICATION RULES                    │
  │                                                          │
  │  1. Agents NEVER talk to each other directly             │
  │  2. All data passes through the SHARED WORKSPACE         │
  │  3. Each agent reads its inputs, does its work,          │
  │     writes its outputs, and EXITS                        │
  │  4. The ORCHESTRATOR checks quality gates and            │
  │     triggers the next agent                              │
  │  5. If an agent needs something from another agent       │
  │     that isn't available yet, it WAITS (via the          │
  │     orchestrator)                                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### 5.2 Output Format Standards

Every agent must produce outputs in standardized formats:

#### Code Files

```javascript
/**
 * @file       urlController.js
 * @agent      A2 (Backend Developer Agent)
 * @task       TASK-005
 * @created    2026-08-12
 * @description Handles URL CRUD API requests
 */

// ... code ...
```

#### Status Reports

Every agent must output a status summary at the end of its execution:

```markdown
## Agent Execution Report

| Field            | Value                                   |
| ---------------- | --------------------------------------- |
| **Agent**        | A2 — Backend Developer Agent            |
| **Task(s)**      | TASK-003, TASK-004, TASK-005            |
| **Status**       | ✅ Complete                              |
| **Files Created**| 8                                       |
| **Files Modified**| 1                                      |
| **Errors**       | 0                                       |
| **Warnings**     | 1 (Redis not configured — using fallback)|
| **Duration**     | ~3 minutes                              |

### Files Created
1. `server.js` — Application entry point
2. `routes/urlRoutes.js` — URL API routes
3. `routes/redirectRoutes.js` — Redirect route
4. ...

### Warnings
- Redis URL not set in environment. Cache service will operate in pass-through mode.

### Ready For
- Agent A5 (Testing) can now run tests against these endpoints
```

### 5.3 Error Reporting Format

When an agent encounters an error it cannot resolve:

```markdown
## ❌ Agent Error Report

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| **Agent**        | A2 — Backend Developer Agent                   |
| **Task**         | TASK-004 — Implement redirect endpoint          |
| **Error Type**   | Dependency Error                                |
| **Severity**     | 🔴 Blocking                                    |
| **Description**  | Cannot import `Url` model — file `models/Url.js` does not exist |
| **Expected**     | Agent A4 should have created `models/Url.js`    |
| **Action Needed**| Run Agent A4 first, then retry Agent A2          |
```

### 5.4 Data Handoff Checklist

| From Agent | To Agent | Data Passed                       | Format     | Validation Check                  |
| ---------- | -------- | --------------------------------- | ---------- | --------------------------------- |
| A1 → A2    | Task list (backend tasks)          | Markdown   | Each task has: title, description, acceptance criteria |
| A1 → A3    | Task list (frontend tasks)         | Markdown   | Each task references a UI Design PRD section |
| A1 → A4    | Task list (database tasks)         | Markdown   | Each task references Architecture PRD Section 3 |
| A4 → A2    | Model files + config               | JS files   | `models/Url.js` exports a valid Mongoose model |
| A2 → A5    | All backend code                    | JS files   | `server.js` starts without errors               |
| A3 → A5    | All frontend code                   | HTML/CSS/JS| Pages render without console errors              |
| A2,A3,A4 → A5 | Complete codebase               | All files  | Folder structure matches architecture spec      |
| A5 → A6    | Test report                         | Markdown   | Pass rate ≥ 90%                                  |
| All → A6   | Complete, tested application        | All files  | All quality gates passed                         |

---

## 6. 🚧 Agent Constraints & Boundaries

### 6.1 What Each Agent is NOT Allowed to Do

| Agent | Prohibited Actions                                                                                |
| ----- | ------------------------------------------------------------------------------------------------- |
| A1    | ❌ Write code ❌ Make technology decisions ❌ Add features not in PRDs ❌ Modify PRDs              |
| A2    | ❌ Write HTML/CSS ❌ Modify model files ❌ Deploy ❌ Run tests ❌ Install frontend packages         |
| A3    | ❌ Write Node.js server code ❌ Modify models ❌ Add npm backend packages ❌ Change API contracts  |
| A4    | ❌ Write routes/controllers ❌ Write frontend code ❌ Change the schema beyond the Architecture PRD |
| A5    | ❌ Fix bugs (only report them) ❌ Modify source code ❌ Deploy ❌ Change test requirements         |
| A6    | ❌ Modify application code ❌ Write tests ❌ Change database schema ❌ Modify frontend code        |

### 6.2 How Agents Handle Uncertainty

```
  UNCERTAINTY DECISION TREE
  ═══════════════════════════════════════════════════════════════

  Agent encounters ambiguity
           │
           ▼
  ┌─────────────────────┐
  │ Is the answer in a  │
  │ PRD document?       │
  └──────────┬──────────┘
             │
        YES ◀┤▶ NO
             │    │
             ▼    ▼
  ┌──────────┐  ┌────────────────────────┐
  │ Use the  │  │ Is it a minor detail   │
  │ PRD      │  │ (naming, formatting)?  │
  │ answer   │  └────────────┬───────────┘
  └──────────┘               │
                        YES ◀┤▶ NO
                             │    │
                             ▼    ▼
                   ┌──────────┐  ┌─────────────────┐
                   │ Make a   │  │ STOP and ask     │
                   │ reasonable│  │ the human user   │
                   │ decision │  │ for guidance      │
                   │ + document│  │                  │
                   │ it        │  │ Include:         │
                   └──────────┘  │ • What's unclear  │
                                 │ • Options you see │
                                 │ • Your recommend. │
                                 └─────────────────┘
```

### 6.3 When Agents Must Ask for Human Input

| Scenario                                                    | Action                                                |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| PRD contains contradictory requirements                     | 🛑 STOP — ask human which requirement takes priority   |
| A feature is referenced but not detailed in any PRD         | 🛑 STOP — ask human for specification                  |
| A third-party API key or credential is needed               | 🛑 STOP — ask human to provide credentials securely    |
| The task list needs more than 50 tasks                      | ⚠️ PAUSE — ask human if scope should be reduced        |
| A critical dependency has a known security vulnerability    | ⚠️ PAUSE — inform human and suggest alternatives       |
| Test pass rate is between 80–90%                            | ⚠️ PAUSE — ask human if deployment should proceed      |
| Deployment fails after 3 retries                            | 🛑 STOP — report full error log and ask for help       |

---

## 7. 🔧 Error Handling Rules

### 7.1 Error Classification

| Level      | Icon | Description                                    | Example                                            |
| ---------- | ---- | ---------------------------------------------- | -------------------------------------------------- |
| **Fatal**  | 🔴   | Agent cannot proceed at all                    | Cannot connect to database; missing critical file  |
| **Major**  | 🟠   | Agent can partially proceed but output is incomplete | One endpoint fails but others work             |
| **Minor**  | 🟡   | Non-critical issue; agent can work around it   | Optional feature (Redis) unavailable; using fallback|
| **Info**   | 🔵   | Observation; no action needed                  | Deprecated package warning                         |

### 7.2 Retry Logic

```
  RETRY FLOW
  ═══════════════════════════════════════════════════════════════

  Agent execution
       │
       ▼
  ┌──────────┐
  │ Success? │
  └─────┬────┘
        │
   YES ◀┤▶ NO
        │    │
        ▼    ▼
  ┌──────┐  ┌──────────────────────┐
  │ DONE │  │ Error Type?          │
  │ ✅   │  └──────────┬───────────┘
  └──────┘             │
              ┌────────┴────────┐
              │                 │
          TRANSIENT         PERMANENT
          (network,         (missing file,
           timeout)         bad schema)
              │                 │
              ▼                 ▼
        ┌───────────┐    ┌───────────────┐
        │ Retry     │    │ STOP          │
        │ (max 3x)  │    │ Report error  │
        │           │    │ to human      │
        │ Wait:     │    └───────────────┘
        │ 1st: 5s   │
        │ 2nd: 15s  │
        │ 3rd: 30s  │
        └─────┬─────┘
              │
         Still failing
         after 3 retries?
              │
              ▼
        ┌───────────────┐
        │ STOP          │
        │ Report error  │
        │ to human      │
        │ Include all   │
        │ 3 error logs  │
        └───────────────┘
```

### 7.3 Retry Rules Table

| Rule # | Rule                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| E1     | Maximum retry count per agent per task: **3 attempts**                                        |
| E2     | Wait between retries: **5s → 15s → 30s** (exponential backoff)                               |
| E3     | Only retry **transient** errors (network, timeout, rate limit). Do NOT retry permanent errors |
| E4     | Each retry must start from a clean state — no partial state carried over                      |
| E5     | After 3 failed retries, the agent must STOP and produce an error report                       |
| E6     | Error reports must include: error message, stack trace (if available), inputs given, attempt # |
| E7     | If an agent fails, downstream agents are NOT triggered                                        |
| E8     | The orchestrator pauses the pipeline and notifies the human user                              |

### 7.4 Error Recovery Actions

| Error Scenario                                | Recovery Action                                                      |
| --------------------------------------------- | -------------------------------------------------------------------- |
| A4 fails → A2 can't find `models/Url.js`     | Re-run A4. If A4 succeeds, then run A2.                              |
| A2 fails → backend code is incomplete         | Fix A2 inputs/context. Re-run A2.                                    |
| A3 fails → frontend is incomplete             | A3 can be re-run independently (no dependencies on A2's output)      |
| A5 finds bugs → tests fail below 90%          | A5 produces bug report. Responsible agent (A2/A3/A4) fixes bugs. A5 re-runs. |
| A6 deploy fails                               | A6 retries up to 3×. If still failing, human investigates Cloud Run config. |
| Multiple agents fail simultaneously           | Orchestrator pauses all agents. Human reviews all error reports first. |

### 7.5 Cascading Failure Prevention

```
  FAILURE ISOLATION
  ═══════════════════════════════════════════════════════════════

  If Agent A4 fails:
  ┌─────────┐
  │ A4 FAIL │
  └────┬────┘
       │
       ├──── A2 BLOCKED (depends on A4)
       │     Status: ⏸️ Waiting
       │
       ├──── A3 UNAFFECTED (independent of A4)
       │     Status: ✅ Can continue
       │
       ├──── A5 BLOCKED (depends on A2 + A3 + A4)
       │     Status: ⏸️ Waiting
       │
       └──── A6 BLOCKED (depends on A5)
              Status: ⏸️ Waiting

  Resolution: Fix A4 → Re-run A4 → Resume A2 → A5 → A6
```

---

## 8. ✅ Quality Gates

### 8.1 Quality Gate Framework

Every agent must pass its designated quality gate before the next phase begins. A quality gate is a **binary checkpoint** — either PASS or FAIL, with no partial credit.

```
  QUALITY GATE PIPELINE
  ═══════════════════════════════════════════════════════════════

  Agent Output ──▶ Quality Gate Check ──▶ PASS? ──▶ Next Agent
                                            │
                                           FAIL
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │ FIX & RETRY  │
                                     │ (max 3x)     │
                                     └──────┬───────┘
                                            │
                                       Still FAIL?
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │ ESCALATE TO  │
                                     │ HUMAN        │
                                     └──────────────┘
```

### 8.2 Quality Gates per Agent

#### Gate 1 — Project Planner (A1)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| All core features from PRD are represented in tasks      | 9 out of 9 features have corresponding tasks       |
| Every task has required fields                           | Title, description, agent, priority, complexity    |
| Tasks are ordered with correct dependencies              | No circular dependencies; dependency chain is valid |
| No out-of-scope tasks                                    | All tasks traceable to a PRD requirement            |
| Human approval                                          | User explicitly approves the task list              |

#### Gate 2 — Backend Developer (A2)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| `npm install` completes without errors                   | Exit code 0, no unresolved peer dependencies       |
| `node server.js` starts without crashing                 | Server binds to PORT, logs "listening"              |
| `GET /api/health` returns 200                            | Response: `{ "success": true, "data": { "status": "healthy" } }` |
| All 6 API endpoints are implemented                      | Routes exist and respond (even if with mock data)  |
| No `var` usage in any file                               | `grep -r "var " --include="*.js"` returns 0 results|
| All functions have JSDoc comments                        | Every exported function has `/** */` comment block  |
| Error handler middleware is in place                     | Unhandled errors return JSON, not HTML stack traces |

#### Gate 3 — Frontend Developer (A3)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| All 4 HTML pages exist                                   | `index.html`, `dashboard.html`, `expired.html`, `404.html` |
| CSS custom properties match design tokens                | All colors, fonts, spacing from `03_UI_DESIGN.md`  |
| No CSS framework detected                                | No Bootstrap, Tailwind, or framework classes       |
| No JS framework detected                                 | No React, Vue, Angular imports                     |
| All pages have `<meta viewport>` tag                     | Responsive meta tag present                        |
| Semantic HTML used                                       | `<nav>`, `<main>`, `<section>`, `<footer>` present |
| All interactive elements have unique `id` attributes     | No duplicate IDs across pages                      |
| `prefers-reduced-motion` is handled                      | CSS media query present in stylesheet              |
| No inline styles                                         | All styling via CSS files                          |

#### Gate 4 — Database Agent (A4)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| `models/Url.js` exports a valid Mongoose model           | `require('./models/Url')` doesn't throw            |
| Schema has all required fields                           | 8+ fields matching Architecture PRD                |
| All 5 indexes are defined                                | Including the TTL index on `expiresAt`             |
| Mongoose validation rules are set                        | `required`, `unique`, `match`, `maxlength` used    |
| `timestamps: true` is enabled                            | Automatic `createdAt`/`updatedAt`                   |
| `config/db.js` connects to MongoDB                       | Connection succeeds with a valid URI               |

#### Gate 5 — Testing Agent (A5)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| All 6 API endpoints have tests                           | At least 1 success + 1 error test per endpoint     |
| Test pass rate ≥ 90%                                     | `(passed / total) * 100 >= 90`                     |
| Code coverage ≥ 80%                                      | Measured by Istanbul/nyc or Jest coverage           |
| Test report is generated                                 | `test_report.md` exists with summary table         |
| No source code modifications                             | `git diff` shows changes only in `tests/` directory |
| Tests clean up after themselves                          | No leftover test data in the database               |

#### Gate 6 — Deployment Agent (A6)

| Check                                                    | Pass Criteria                                     |
| -------------------------------------------------------- | ------------------------------------------------- |
| Test pass rate ≥ 90% (pre-check)                        | Read `test_report.md` and verify                   |
| Docker build succeeds                                    | `docker build` exits with code 0                   |
| Cloud Run deployment succeeds                            | `gcloud run deploy` exits without errors           |
| Health check returns 200                                 | `curl <live-url>/api/health` returns healthy       |
| Smoke test passes                                        | Can create a URL and redirect through it           |
| Live URL is reported                                     | `deploy_report.md` contains the URL                |

### 8.3 Code Review Checklist (For Coding Agents A2, A3, A4)

Every coding agent must self-verify against this checklist before declaring completion:

```markdown
## Code Review Self-Check

### General
- [ ] All files follow the folder structure from the Architecture PRD
- [ ] No hardcoded secrets, URLs, or credentials
- [ ] No commented-out code blocks (dead code)
- [ ] No `console.log` left for debugging (use logger utility instead)
- [ ] All error messages are user-friendly (no raw stack traces exposed)

### Backend (A2)
- [ ] All routes match the API Design table (method, path, response codes)
- [ ] All async functions use try/catch with error forwarding via next()
- [ ] Rate limiting is applied to all public endpoints
- [ ] Input validation runs before business logic
- [ ] Response format follows { success, data/error } envelope

### Frontend (A3)
- [ ] Colors, fonts, spacing match 03_UI_DESIGN.md exactly
- [ ] All pages are responsive (tested at 320px, 768px, 1024px, 1440px)
- [ ] All buttons have hover, active, focus, and disabled states
- [ ] All inputs have labels (visible or sr-only) and placeholder text
- [ ] Copy button shows "Copied!" feedback for 2 seconds
- [ ] Loading spinner appears during API calls

### Database (A4)
- [ ] All schema fields have type, required, and validation
- [ ] TTL index will auto-delete expired documents
- [ ] Unique index on shortCode prevents duplicates
- [ ] Compound index on sessionId + createdAt exists for dashboard queries
```

---

## 9. 💬 Prompting Best Practices

### 9.1 Prompt Structure Template

Every agent prompt should follow this structure:

```
┌──────────────────────────────────────────────────────────────┐
│                   AGENT PROMPT STRUCTURE                      │
│                                                              │
│  1. ROLE DEFINITION                                          │
│     "You are a [specific role] responsible for [scope]."     │
│                                                              │
│  2. CONTEXT                                                  │
│     Provide the relevant PRD content inline or as references │
│                                                              │
│  3. TASK DESCRIPTION                                         │
│     Exactly what the agent must do, step by step             │
│                                                              │
│  4. CONSTRAINTS                                              │
│     What the agent must NOT do                               │
│                                                              │
│  5. OUTPUT FORMAT                                            │
│     Exactly what the agent must produce and in what format   │
│                                                              │
│  6. QUALITY CRITERIA                                         │
│     How the output will be evaluated                         │
│                                                              │
│  7. EXAMPLES (if helpful)                                    │
│     Show what good output looks like                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Example Prompts for Each Agent

---

#### 📋 Example Prompt — Project Planner Agent (A1)

```
ROLE:
You are a Senior Project Planner Agent. Your job is to read 
the PRD documents for the QuickLink URL Shortener project and 
produce a detailed, prioritized task list.

CONTEXT:
[Paste or reference: 01_PROJECT_OVERVIEW.md, 02_ARCHITECTURE.md, 
03_UI_DESIGN.md]

TASK:
1. Read all three PRD documents carefully
2. Break the project into individual development tasks
3. Group tasks by phase: Setup, Database, Backend, Frontend, 
   Testing, Deployment
4. Assign each task to the correct agent (A2, A3, A4, A5, or A6)
5. Set priority (Critical/High/Medium/Low) and complexity (S/M/L/XL)
6. Define dependencies between tasks
7. Output the result as a structured task_list.md file

CONSTRAINTS:
- Do NOT create tasks for features not in the PRDs
- Do NOT write any code
- Do NOT make technology decisions (they're already decided)
- Each task must be small enough to complete in a single session

OUTPUT FORMAT:
A markdown file called task_list.md with each task following this 
format:
  ## Task: [TASK-XXX] Title
  - Agent: A#
  - Priority: Critical/High/Medium/Low
  - Complexity: S/M/L/XL
  - Dependencies: TASK-XXX (or None)
  - Description: ...
  - Acceptance Criteria: [checklist]

QUALITY CRITERIA:
- All 9 core features from the PRD have corresponding tasks
- No circular dependencies
- Tasks are ordered logically (setup first, deploy last)
```

---

#### ⚙️ Example Prompt — Backend Developer Agent (A2)

```
ROLE:
You are a Senior Backend Developer Agent specializing in 
Node.js and Express.js. Your job is to implement the backend 
for the QuickLink URL Shortener.

CONTEXT:
Architecture PRD: [reference or paste 02_ARCHITECTURE.md]
Database models are already created at: models/Url.js
Your assigned tasks from the task list: TASK-003, TASK-004, 
TASK-005, TASK-006, TASK-007

TASK:
Implement the following files:
1. server.js — Express app with middleware, routes, DB connection
2. routes/urlRoutes.js — POST /api/shorten, GET /api/urls, 
   GET /api/urls/:code, DELETE /api/urls/:code
3. routes/redirectRoutes.js — GET /:code
4. routes/healthRoutes.js — GET /api/health
5. controllers/urlController.js — Handler functions
6. controllers/redirectController.js — Redirect handler
7. controllers/healthController.js — Health check handler
8. services/urlService.js — Business logic (create, resolve, delete)
9. middleware/rateLimiter.js — Rate limiting (10 req/min per IP)
10. middleware/validator.js — Input validation
11. middleware/errorHandler.js — Global error handler
12. middleware/notFound.js — 404 catch-all
13. utils/generateCode.js — nanoid wrapper
14. utils/validateUrl.js — URL validation
15. utils/constants.js — App constants
16. config/env.js — Environment variable validation

CONSTRAINTS:
- Do NOT modify models/Url.js (owned by Database Agent)
- Do NOT create any HTML, CSS, or client-side JS files
- Use async/await — no callbacks
- Use const by default; let only when needed; never var
- All responses must use { success, data/error } format
- Use environment variables for all config (never hardcode)

OUTPUT FORMAT:
Complete, runnable JavaScript files placed in the correct 
directory locations as specified above.

QUALITY CRITERIA:
- npm start runs without errors
- GET /api/health returns 200
- All 6 API endpoints respond with correct status codes
- JSDoc comments on all exported functions
```

---

#### 🎨 Example Prompt — Frontend Developer Agent (A3)

```
ROLE:
You are a Senior Frontend Developer Agent specializing in 
vanilla HTML, CSS, and JavaScript. Your job is to implement 
the frontend for the QuickLink URL Shortener, matching the 
UI Design PRD exactly.

CONTEXT:
UI Design PRD: [reference or paste 03_UI_DESIGN.md]
API endpoints (for fetch calls): [reference 02_ARCHITECTURE.md 
Section 4]
Your assigned tasks: TASK-008 through TASK-014

TASK:
Implement the following files in the public/ directory:
1. public/index.html — Homepage with URL shortener form
2. public/dashboard.html — Dashboard with URL table
3. public/expired.html — Expired link page
4. public/404.html — Not found page
5. public/css/styles.css — Main stylesheet with all design tokens
6. public/css/dashboard.css — Dashboard-specific styles
7. public/css/responsive.css — Media queries for all breakpoints
8. public/js/app.js — Homepage logic (shorten, copy, QR)
9. public/js/dashboard.js — Dashboard logic (fetch, search, delete)
10. public/js/utils.js — Shared utilities

CONSTRAINTS:
- Use ONLY vanilla CSS — no Bootstrap, Tailwind, or any CSS framework
- Use ONLY vanilla JavaScript — no React, Vue, jQuery, or any framework
- Do NOT modify any server-side files
- All colors, fonts, spacing must match 03_UI_DESIGN.md exactly
- Must use CSS custom properties for all design tokens
- Must include prefers-reduced-motion media query
- Must use semantic HTML5 elements

OUTPUT FORMAT:
Complete, well-structured HTML, CSS, and JS files in the 
public/ directory hierarchy.

QUALITY CRITERIA:
- All 4 pages render correctly in Chrome, Firefox, Safari
- Responsive at 320px, 768px, 1024px, 1440px
- All animations match the UI Design PRD specifications
- No console errors in the browser
- Lighthouse accessibility score ≥ 90
```

---

#### 🧪 Example Prompt — Testing Agent (A5)

```
ROLE:
You are a Senior QA Engineer Agent. Your job is to write and 
run comprehensive tests for the QuickLink URL Shortener backend.

CONTEXT:
All source code files are in the workspace.
API Design: [reference 02_ARCHITECTURE.md Section 4]
6 endpoints to test: POST /api/shorten, GET /:code, 
GET /api/urls, GET /api/urls/:code, DELETE /api/urls/:code,
GET /api/health

TASK:
1. Create test setup file: tests/setup.js
2. Write unit tests for: generateCode, validateUrl, urlService
3. Write integration tests for all 6 API endpoints
4. Each endpoint must have success AND error test cases
5. Run all tests and capture results
6. Generate test_report.md with summary table

CONSTRAINTS:
- Do NOT modify any source code files — tests/ directory only
- Use the test framework specified in package.json (Jest or Mocha)
- Use supertest for HTTP integration tests
- Use a separate test database — never test against production
- Clean up all test data after each test

OUTPUT FORMAT:
- tests/setup.js
- tests/unit/*.test.js
- tests/integration/*.test.js
- test_report.md (summary table with pass/fail counts)

QUALITY CRITERIA:
- All 6 endpoints have at least 2 tests each (1 success, 1 error)
- Total pass rate ≥ 90%
- Code coverage ≥ 80%
- test_report.md follows the standardized format
```

### 9.3 Prompting Do's and Don'ts

#### ✅ Do's

| #  | Best Practice                                                                                   |
| -- | ----------------------------------------------------------------------------------------------- |
| 1  | **Be specific** — Name exact files, endpoints, functions. "Create `routes/urlRoutes.js`" > "Create routes" |
| 2  | **Reference PRDs** — Always point to the exact PRD section for specifications                   |
| 3  | **Define constraints** — Explicitly state what the agent must NOT do                            |
| 4  | **Show examples** — Include a code example of the expected style/format                         |
| 5  | **Set quality criteria** — Tell the agent how its output will be evaluated                      |
| 6  | **Use numbered steps** — Break the task into clear sequential steps                             |
| 7  | **Specify output format** — "Output a markdown file" or "Output JavaScript files"              |
| 8  | **Include error handling expectations** — "Handle invalid inputs with 400 responses"            |
| 9  | **Provide context about other agents** — "models/Url.js already exists, created by Agent A4"   |
| 10 | **Keep prompts focused** — One agent, one phase, one clear goal per prompt                      |

#### ❌ Don'ts

| #  | Anti-Pattern                                                                                    |
| -- | ----------------------------------------------------------------------------------------------- |
| 1  | ❌ **Vague instructions** — "Build the backend" (no specifics on what files, endpoints, format) |
| 2  | ❌ **Overloading** — Asking one agent to do backend + frontend + testing in one prompt          |
| 3  | ❌ **Assuming context** — Don't assume the agent remembers previous runs; provide all context   |
| 4  | ❌ **Contradicting PRDs** — Giving instructions that conflict with the Architecture or UI PRD   |
| 5  | ❌ **Skipping constraints** — Forgetting to say "Don't modify models" leads to file conflicts   |
| 6  | ❌ **No output format** — Agent might produce code in the response text instead of files        |
| 7  | ❌ **Mixing concerns** — Asking the Testing Agent to also fix the bugs it finds                 |
| 8  | ❌ **Using jargon without definition** — "Use CQRS pattern" without explaining what that means  |
| 9  | ❌ **No quality criteria** — Agent has no way to self-verify if output is acceptable            |
| 10 | ❌ **Omitting dependencies** — Not telling Agent A2 that it needs models from Agent A4          |

### 9.4 Prompt Length Guidelines

| Agent Type         | Recommended Prompt Length | Reason                                              |
| ------------------ | ------------------------- | --------------------------------------------------- |
| Planner (A1)       | 500–800 words             | Needs to understand all PRDs; moderate complexity    |
| Backend Dev (A2)   | 800–1200 words            | Many files to create; needs detailed specifications  |
| Frontend Dev (A3)  | 800–1200 words            | Design specs are detailed; many UI rules to follow   |
| Database (A4)      | 400–600 words             | Focused scope; schema is well-defined in PRD         |
| Testing (A5)       | 600–800 words             | Needs clear test cases and report format              |
| Deployment (A6)    | 400–600 words             | Procedural; most specs are in the Architecture PRD   |

---

## 📎 Appendix

### A. Agent Quick Reference Card

```
┌────────────────────────────────────────────────────────────────────┐
│                    AGENT QUICK REFERENCE                           │
│                                                                    │
│  A1 📋 Planner      Reads PRDs → Outputs task_list.md             │
│  A2 ⚙️ Backend      Reads Architecture → Outputs server code      │
│  A3 🎨 Frontend     Reads UI Design → Outputs HTML/CSS/JS         │
│  A4 🗄️ Database     Reads Architecture → Outputs models + config  │
│  A5 🧪 Testing      Reads all code → Outputs test_report.md       │
│  A6 🚀 Deployment   Reads everything → Outputs live URL           │
│                                                                    │
│  ORDER: A1 → (A4 → A2 ‖ A3) → A5 → A6                            │
│                                                                    │
│  GATES: Task list ✅ → Code works ✅ → Tests ≥90% ✅ → Live ✅    │
│                                                                    │
│  RETRIES: 3 max per agent, exponential backoff (5s/15s/30s)       │
│                                                                    │
│  CONFLICTS: Check File Ownership Map (Section 4.4)                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### B. Glossary

| Term                   | Definition                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Agent**              | An AI unit that performs a specific development role within the build pipeline  |
| **Orchestrator**       | The controller (human or automation) that triggers agents and checks gates     |
| **Quality Gate**       | A binary pass/fail checkpoint that must be cleared before the next phase       |
| **Shared Workspace**   | The file system (project directory) where all agents read and write artifacts  |
| **File Ownership**     | The rule that only one designated agent may write to a specific file           |
| **Transient Error**    | A temporary failure (network timeout) that may succeed on retry                |
| **Permanent Error**    | A structural failure (missing file, bad schema) that will not self-resolve     |
| **Cascading Failure**  | When one agent's failure blocks multiple downstream agents                     |
| **Smoke Test**         | A minimal end-to-end test to verify the deployed application works             |

---

> **Document Status:** This AI Workflow document defines the rules of engagement for all agents building QuickLink. It must be read by every agent before execution begins. Human review is required before Phase 1 starts.

---

*© 2026 QuickLink — Built with 🤖 on Google Antigravity*
