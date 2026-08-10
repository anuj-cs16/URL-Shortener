# 📏 Code Standards & Best Practices

## **QuickLink — Engineering Standards Guide**

| Field            | Details                                  |
| ---------------- | ---------------------------------------- |
| **Document**     | Code Standards & Engineering Guidelines  |
| **Version**      | 1.0                                      |
| **Status**       | Approved                                 |
| **Author**       | Tech Lead / Engineering Team             |
| **Created**      | August 10, 2026                          |
| **Last Updated** | August 10, 2026                          |
| **Stack**        | Node.js · Express.js · MongoDB · Vanilla CSS/JS |

---

## 📑 Table of Contents

1. [General Coding Principles](#1--general-coding-principles)
2. [JavaScript / Node.js Standards](#2--javascript--nodejs-standards)
3. [File Structure Standards](#3--file-structure-standards)
4. [API Standards](#4--api-standards)
5. [Error Handling Standards](#5--error-handling-standards)
6. [Database Standards](#6--database-standards)
7. [Security Standards](#7--security-standards)
8. [CSS Standards](#8--css-standards)
9. [Git & Version Control Standards](#9--git--version-control-standards)
10. [Testing Standards](#10--testing-standards)
11. [Documentation Standards](#11--documentation-standards)
12. [Forbidden Practices](#12--forbidden-practices)

---

## 1. 🧠 General Coding Principles

### 1.1 Clean Code Rules

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler

| Rule                              | Description                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| **Readability over cleverness**   | Code is read 10× more than it is written. Optimize for the reader, not the writer.   |
| **Self-documenting names**        | A variable or function name should tell you what it does without needing a comment.  |
| **Consistent formatting**         | Use the same indentation, spacing, and style everywhere. Configure ESLint + Prettier.|
| **Small functions**               | Each function should do one thing and fit on one screen (~30 lines max).             |
| **No dead code**                  | Delete commented-out code, unused imports, and unreachable branches immediately.     |
| **Fail fast**                     | Validate inputs at the top of a function. Return early on invalid conditions.        |
| **No magic numbers**              | Use named constants instead of raw numbers. `MAX_URL_LENGTH` not `2048`.             |

```javascript
// ❌ BAD — Magic numbers, unclear names, hard to read
function f(u) {
  if (u.length > 2048) return false;
  if (u.split('/').length < 3) return false;
  return true;
}

// ✅ GOOD — Self-documenting, named constants, clear intent
const MAX_URL_LENGTH = 2048;
const MIN_URL_SEGMENTS = 3;

function isValidUrlLength(url) {
  if (url.length > MAX_URL_LENGTH) return false;
  if (url.split('/').length < MIN_URL_SEGMENTS) return false;
  return true;
}
```

### 1.2 DRY — Don't Repeat Yourself

**Rule:** If you find yourself writing the same logic in two or more places, extract it into a shared function or constant.

```javascript
// ❌ BAD — Duplicated response formatting
const createUrl = async (req, res) => {
  // ... logic ...
  res.status(201).json({ success: true, data: result });
};

const getUrls = async (req, res) => {
  // ... logic ...
  res.status(200).json({ success: true, data: urls });
};

// ✅ GOOD — Shared response helper
const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

const createUrl = async (req, res) => {
  // ... logic ...
  sendSuccess(res, result, 201);
};

const getUrls = async (req, res) => {
  // ... logic ...
  sendSuccess(res, urls);
};
```

### 1.3 KISS — Keep It Simple, Stupid

**Rule:** Always choose the simplest approach that solves the problem correctly. Do not over-engineer.

```javascript
// ❌ BAD — Over-engineered URL protocol extraction
function extractProtocol(url) {
  const regex = /^(https?):\/\//;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return null;
}

// ✅ GOOD — Simple and sufficient
function hasValidProtocol(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}
```

### 1.4 Single Responsibility Principle (SRP)

**Rule:** Every function, module, and file should have one reason to change. If a function does two things, split it into two functions.

```javascript
// ❌ BAD — One function doing validation + creation + response
const shortenUrl = async (req, res) => {
  const { longUrl } = req.body;
  
  // Validation (responsibility 1)
  if (!longUrl) return res.status(400).json({ error: 'URL required' });
  if (!longUrl.startsWith('http')) return res.status(400).json({ error: 'Invalid URL' });
  
  // Creation (responsibility 2)
  const shortCode = nanoid(8);
  const newUrl = await Url.create({ longUrl, shortCode });
  
  // Response formatting (responsibility 3)
  res.status(201).json({ success: true, data: { shortUrl: `${BASE_URL}/${shortCode}` } });
};

// ✅ GOOD — Separated into distinct layers
// middleware/validator.js    → Validates input (responsibility 1)
// services/urlService.js     → Creates the URL (responsibility 2)
// controllers/urlController.js → Formats the response (responsibility 3)
```

### 1.5 Comment Rules

#### When to Comment

| Scenario                               | Should You Comment? | Example                                              |
| -------------------------------------- | ------------------- | ---------------------------------------------------- |
| Code is self-explanatory               | ❌ No               | `const userName = 'John';`                           |
| Complex business logic                 | ✅ Yes              | TTL calculation, rate limit strategy                 |
| Why (not what) something is done       | ✅ Yes              | `// Using $inc for atomic increment (avoids race conditions)` |
| Workaround or hack                     | ✅ Yes              | `// TODO: Remove when MongoDB driver fixes #1234`    |
| Public API (function signature)        | ✅ Yes (JSDoc)      | Every exported function must have JSDoc              |
| Regex patterns                         | ✅ Yes              | `// Match URLs starting with http:// or https://`    |
| Temporary/debugging code               | 🚫 Delete it        | `// console.log('debug');` — remove before commit    |

#### Comment Style

```javascript
// ✅ GOOD — Explains WHY, not what
// Using fire-and-forget for click increment to avoid 
// blocking the redirect response. The slight delay in 
// counter accuracy is acceptable for our use case.
Url.updateOne({ shortCode }, { $inc: { clicks: 1 } });

// ❌ BAD — Restates the code (useless comment)
// Increment clicks by 1
Url.updateOne({ shortCode }, { $inc: { clicks: 1 } });

// ❌ BAD — Commented-out code (dead code)
// const oldResult = await Url.find({ isActive: true });
// res.json(oldResult);
```

---

## 2. 📝 JavaScript / Node.js Standards

### 2.1 Naming Conventions

| Element            | Convention            | Pattern            | Examples                                           |
| ------------------ | --------------------- | ------------------ | -------------------------------------------------- |
| **Variables**      | `camelCase`           | `descriptiveNoun`  | `shortCode`, `longUrl`, `clickCount`, `sessionId`  |
| **Constants**      | `UPPER_SNAKE_CASE`    | `DESCRIPTIVE_NOUN` | `MAX_RETRIES`, `SHORT_CODE_LENGTH`, `BASE_URL`     |
| **Functions**      | `camelCase`           | `verbNoun`         | `generateShortCode()`, `validateUrl()`, `getUrlByCode()` |
| **Async Functions**| `camelCase`           | `verbNoun`         | `createShortUrl()`, `resolveAndTrack()`, `deleteUrl()` |
| **Files**          | `camelCase`           | `descriptive.js`   | `urlController.js`, `rateLimiter.js`, `cacheService.js` |
| **Classes**        | `PascalCase`          | `NounPhrase`       | `UrlService`, `CacheManager`, `AppError`           |
| **DB Models**      | `PascalCase`          | `SingularNoun`     | `Url`, `User` (future), `Click` (future)           |
| **DB Collections** | `lowercase plural`    | `nouns`            | `urls`, `users`, `clicks`                          |
| **CSS Classes**    | `kebab-case` (BEM)    | `block__element--modifier` | `form__input--error`, `btn--primary`      |
| **CSS Variables**  | `kebab-case`          | `--category-name`  | `--color-primary`, `--font-primary`                |
| **HTML IDs**       | `kebab-case`          | `descriptive-id`   | `url-input`, `shorten-btn`, `result-card`          |
| **Env Variables**  | `UPPER_SNAKE_CASE`    | `CATEGORY_NAME`    | `MONGODB_URI`, `PORT`, `BASE_URL`                  |
| **Route Params**   | `camelCase`           | `:descriptiveNoun` | `:shortCode`, `:sessionId`                         |
| **Boolean Vars**   | `camelCase`           | `is/has/can/should`| `isActive`, `hasExpired`, `isCustom`, `canDelete`  |

```javascript
// ✅ CORRECT NAMING EXAMPLES

// Variables (camelCase)
const shortCode = 'aB3dEf';
const longUrl = 'https://example.com/long/path';
const clickCount = 42;
const isActive = true;
const hasExpired = false;

// Constants (UPPER_SNAKE_CASE)
const MAX_URL_LENGTH = 2048;
const SHORT_CODE_LENGTH = 8;
const DEFAULT_EXPIRY_DAYS = 7;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// Functions (camelCase, verb + noun)
function generateShortCode(length) { /* ... */ }
function validateUrl(url) { /* ... */ }
async function createShortUrl(longUrl, customCode) { /* ... */ }
async function resolveAndTrack(shortCode) { /* ... */ }

// Classes (PascalCase)
class AppError extends Error { /* ... */ }
class CacheService { /* ... */ }
```

```javascript
// ❌ INCORRECT NAMING (DO NOT USE)

const sc = 'aB3dEf';           // ❌ Abbreviation — use shortCode
const URL = 'https://...';     // ❌ All caps — conflicts with global URL
const long_url = 'https://...';// ❌ snake_case — use camelCase
var clickcount = 42;           // ❌ var + no camelCase
let temp = generateCode();     // ❌ Meaningless name "temp"
const data = fetch('/api');    // ❌ Too vague — what data?
function do_stuff() {}         // ❌ snake_case + vague name
function handleEverything() {} // ❌ Violates single responsibility
```

### 2.2 Function Rules

| Rule # | Rule                                            | Rationale                                             |
| ------ | ----------------------------------------------- | ----------------------------------------------------- |
| F1     | Maximum **30 lines** per function               | Long functions are hard to understand and test         |
| F2     | **One function = one job**                      | Single Responsibility Principle                        |
| F3     | Always use **async/await** for async operations | Cleaner than callbacks or raw `.then()` chains         |
| F4     | Always **handle errors** with try/catch         | Unhandled promise rejections crash Node.js             |
| F5     | **Return early** on invalid conditions          | Reduces nesting (guard clauses)                        |
| F6     | Maximum **3 parameters**; use an object for more| Many parameters are hard to remember and order-dependent|
| F7     | **Pure functions** where possible               | Easier to test; no side effects                        |
| F8     | **Never mutate** function parameters            | Side effects cause hard-to-trace bugs                  |
| F9     | Use **arrow functions** for short callbacks     | Concise syntax for `.map()`, `.filter()`, etc.         |
| F10    | Use **named functions** for exports and handlers| Better stack traces and readability                    |

```javascript
// ✅ GOOD — Short, focused, async/await, try/catch, early return

/**
 * Creates a new shortened URL.
 * @param {string} longUrl - The original URL to shorten.
 * @param {string|null} customCode - Optional custom short code.
 * @param {string} sessionId - Browser session identifier.
 * @returns {Object} The created URL document with short URL.
 * @throws {AppError} If URL is invalid or custom code is taken.
 */
async function createShortUrl(longUrl, customCode, sessionId) {
  // Guard clause — return early on invalid input
  if (!longUrl) {
    throw new AppError('URL is required', 400);
  }

  // Check for duplicate
  const existing = await Url.findOne({ longUrl, sessionId, isActive: true });
  if (existing) {
    return formatUrlResponse(existing);
  }

  // Generate or validate short code
  const shortCode = customCode || generateShortCode(SHORT_CODE_LENGTH);

  // Create document
  const urlDoc = await Url.create({
    longUrl,
    shortCode,
    isCustom: !!customCode,
    sessionId,
  });

  return formatUrlResponse(urlDoc);
}
```

```javascript
// ❌ BAD — Too long, multiple responsibilities, callback hell, no error handling

function shortenUrl(req, res) {
  var url = req.body.longUrl;
  if (url == undefined) {
    res.send({ error: 'no url' });
  } else {
    var code = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 50+ more lines of mixed validation, DB calls, and response formatting
    // No try/catch, no error handling, uses var, uses callbacks
    Url.findOne({ longUrl: url }, function(err, doc) {
      if (err) console.log(err);
      if (doc) {
        res.send(doc);
      } else {
        var newUrl = new Url({ longUrl: url, shortCode: code });
        newUrl.save(function(err, saved) {
          if (err) console.log(err);
          res.send(saved);
        });
      }
    });
  }
}
```

### 2.3 Variable Rules

| Rule # | Rule                                                | Example                                              |
| ------ | --------------------------------------------------- | ---------------------------------------------------- |
| V1     | Always use `const` by default                       | `const shortCode = generateCode();`                  |
| V2     | Use `let` only when reassignment is needed          | `let retryCount = 0; retryCount++;`                  |
| V3     | **Never** use `var`                                 | `var` has function scope and hoisting bugs            |
| V4     | Declare variables at the point of first use         | Not all at the top — close to where they're used     |
| V5     | Use **meaningful, descriptive** names               | `shortCode` not `sc`, `urlDocument` not `doc`        |
| V6     | Boolean variables must start with `is/has/can/should`| `isActive`, `hasExpired`, `canDelete`               |
| V7     | Avoid single-letter names except in loops           | `for (let i = 0; ...)` is acceptable                 |
| V8     | Use **destructuring** for objects and arrays         | `const { longUrl, customCode } = req.body;`          |
| V9     | Group related constants in a constants file         | All in `utils/constants.js`                          |

```javascript
// ✅ GOOD — const, destructuring, meaningful names

const { longUrl, customCode, sessionId } = req.body;

const urlDocument = await Url.findOne({ shortCode });
const isExpired = urlDocument.expiresAt < new Date();
const hasCustomCode = !!customCode;

const formattedResponse = {
  shortUrl: `${BASE_URL}/${urlDocument.shortCode}`,
  clicks: urlDocument.clicks,
  isActive: urlDocument.isActive,
};
```

```javascript
// ❌ BAD — var, meaningless names, no destructuring

var d = req.body;
var u = d.longUrl;
var c = d.customCode;
var x = await Url.findOne({ shortCode });
var temp = x.expiresAt < new Date();
var obj = { url: BASE_URL + '/' + x.shortCode };
```

### 2.4 Import / Require Organization

Organize imports in this exact order, separated by blank lines:

```javascript
// ── 1. Node.js built-in modules ──
const path = require('path');
const crypto = require('crypto');

// ── 2. Third-party npm packages ──
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { nanoid } = require('nanoid');

// ── 3. Local configuration ──
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');

// ── 4. Local routes ──
const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const healthRoutes = require('./routes/healthRoutes');

// ── 5. Local middleware ──
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// ── 6. Local utilities ──
const { logger } = require('./utils/logger');
const { BASE_URL, PORT } = require('./utils/constants');
```

### 2.5 String Rules

```javascript
// ✅ USE template literals for string interpolation
const shortUrl = `${BASE_URL}/${shortCode}`;
const logMessage = `URL created: ${shortCode} → ${longUrl}`;
const errorMsg = `Custom code "${customCode}" is already in use`;

// ❌ DO NOT use string concatenation
const shortUrl = BASE_URL + '/' + shortCode;
const logMessage = 'URL created: ' + shortCode + ' → ' + longUrl;

// ✅ USE single quotes for simple strings
const status = 'healthy';
const method = 'POST';

// ✅ USE template literals for multi-line strings
const htmlContent = `
  <h1>Link Expired</h1>
  <p>This link expired on ${expiryDate}</p>
`;
```

### 2.6 Equality and Comparison

```javascript
// ✅ ALWAYS use strict equality
if (status === 'active') { /* ... */ }
if (clickCount === 0) { /* ... */ }
if (isActive !== true) { /* ... */ }

// ❌ NEVER use loose equality
if (status == 'active') { /* ... */ }   // ❌ Type coercion bugs
if (clickCount == 0) { /* ... */ }      // ❌ '' == 0 is true!
if (isActive != true) { /* ... */ }     // ❌ Unpredictable
```

---

## 3. 📁 File Structure Standards

### 3.1 General File Rules

| Rule                                          | Details                                                    |
| --------------------------------------------- | ---------------------------------------------------------- |
| One exported entity per file (preferred)      | `urlController.js` exports URL controller functions        |
| File names use `camelCase`                    | `urlController.js`, `rateLimiter.js`, `cacheService.js`    |
| Every file starts with a JSDoc header comment | Describes file purpose, author/agent, and creation date    |
| Exports at the bottom of the file             | Group all `module.exports` at the end                      |
| Maximum file length: **200 lines**            | Split larger files into focused modules                    |
| No circular imports                           | If A imports B and B imports A, refactor                   |

### 3.2 File Header Template

Every `.js` file must begin with this header:

```javascript
/**
 * @file       urlController.js
 * @description Handles HTTP requests for URL CRUD operations.
 *              Parses request data, calls the service layer,
 *              and formats API responses.
 * @module     controllers/urlController
 * @requires   services/urlService
 * @created    2026-08-12
 */
```

---

### 3.3 Controller File Template

```javascript
/**
 * @file       urlController.js
 * @description Handles HTTP requests for URL CRUD operations.
 * @module     controllers/urlController
 * @requires   services/urlService
 */

'use strict';

// ── Dependencies ────────────────────────────────────────────
const urlService = require('../services/urlService');
const { AppError } = require('../utils/appError');

// ── Controllers ─────────────────────────────────────────────

/**
 * Creates a new shortened URL.
 * @route   POST /api/shorten
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} req.body - Request body.
 * @param   {string} req.body.longUrl - The original URL to shorten.
 * @param   {string} [req.body.customCode] - Optional custom alias.
 * @param   {string} [req.body.sessionId] - Browser session ID.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next middleware function.
 * @returns {void}
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
    next(error);
  }
};

/**
 * Retrieves all URLs for a given session.
 * @route   GET /api/urls
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} req.query - Query parameters.
 * @param   {string} req.query.sessionId - Browser session ID.
 * @param   {number} [req.query.page=1] - Page number.
 * @param   {number} [req.query.limit=20] - Results per page.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next middleware function.
 * @returns {void}
 */
const getUrls = async (req, res, next) => {
  try {
    const { sessionId, page = 1, limit = 20, search, sort } = req.query;

    const result = await urlService.getUrlsBySession(sessionId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      sort,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves stats for a specific short URL.
 * @route   GET /api/urls/:shortCode
 * @access  Public
 */
const getUrlStats = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const result = await urlService.getUrlByCode(shortCode);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes (deactivates) a short URL.
 * @route   DELETE /api/urls/:shortCode
 * @access  Public
 */
const deleteUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const { sessionId } = req.body;

    await urlService.deleteUrl(shortCode, sessionId);

    res.status(200).json({
      success: true,
      message: 'URL has been deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ── Exports ─────────────────────────────────────────────────
module.exports = {
  createShortUrl,
  getUrls,
  getUrlStats,
  deleteUrl,
};
```

---

### 3.4 Route File Template

```javascript
/**
 * @file       urlRoutes.js
 * @description Defines Express routes for URL API endpoints.
 *              Maps HTTP methods and paths to controller functions.
 * @module     routes/urlRoutes
 * @requires   controllers/urlController
 * @requires   middleware/validator
 * @requires   middleware/rateLimiter
 */

'use strict';

// ── Dependencies ────────────────────────────────────────────
const express = require('express');
const router = express.Router();

// ── Controller ──────────────────────────────────────────────
const {
  createShortUrl,
  getUrls,
  getUrlStats,
  deleteUrl,
} = require('../controllers/urlController');

// ── Middleware ───────────────────────────────────────────────
const { validateShortenRequest } = require('../middleware/validator');
const { createLimiter, apiLimiter } = require('../middleware/rateLimiter');

// ── Routes ──────────────────────────────────────────────────

/**
 * @route   POST /api/shorten
 * @desc    Create a new shortened URL
 * @access  Public
 */
router.post('/shorten', createLimiter, validateShortenRequest, createShortUrl);

/**
 * @route   GET /api/urls
 * @desc    Get all URLs for a session
 * @access  Public
 */
router.get('/urls', apiLimiter, getUrls);

/**
 * @route   GET /api/urls/:shortCode
 * @desc    Get stats for a specific URL
 * @access  Public
 */
router.get('/urls/:shortCode', apiLimiter, getUrlStats);

/**
 * @route   DELETE /api/urls/:shortCode
 * @desc    Delete (deactivate) a URL
 * @access  Public
 */
router.delete('/urls/:shortCode', createLimiter, deleteUrl);

// ── Export ───────────────────────────────────────────────────
module.exports = router;
```

---

### 3.5 Model File Template

```javascript
/**
 * @file       Url.js
 * @description Mongoose schema and model for URL documents.
 *              Defines fields, validation, indexes, and
 *              TTL for automatic expiry.
 * @module     models/Url
 * @requires   mongoose
 */

'use strict';

// ── Dependencies ────────────────────────────────────────────
const mongoose = require('mongoose');

// ── Constants ───────────────────────────────────────────────
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ── Schema Definition ───────────────────────────────────────
const urlSchema = new mongoose.Schema(
  {
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
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Short code can only contain letters, numbers, hyphens, and underscores',
      ],
    },

    clicks: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Clicks cannot be negative'],
    },

    isCustom: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + DEFAULT_EXPIRY_MS),
    },

    sessionId: {
      type: String,
      required: false,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────
urlSchema.index({ shortCode: 1 }, { unique: true });
urlSchema.index({ sessionId: 1, createdAt: -1 });
urlSchema.index({ longUrl: 1, sessionId: 1 });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
urlSchema.index({ isActive: 1 });

// ── Model Export ────────────────────────────────────────────
module.exports = mongoose.model('Url', urlSchema);
```

---

### 3.6 Service File Template

```javascript
/**
 * @file       urlService.js
 * @description Business logic for URL operations. Handles
 *              creation, resolution, deletion, and validation.
 *              This layer sits between controllers and models.
 * @module     services/urlService
 * @requires   models/Url
 * @requires   utils/generateCode
 * @requires   utils/validateUrl
 */

'use strict';

// ── Dependencies ────────────────────────────────────────────
const Url = require('../models/Url');
const { generateShortCode } = require('../utils/generateCode');
const { isValidUrl } = require('../utils/validateUrl');
const { AppError } = require('../utils/appError');
const { BASE_URL, SHORT_CODE_LENGTH } = require('../utils/constants');

// ── Public Methods ──────────────────────────────────────────

/**
 * Creates a new shortened URL or returns an existing one.
 * @param {string} longUrl - The original URL.
 * @param {string|null} customCode - Optional custom alias.
 * @param {string} sessionId - Browser session identifier.
 * @returns {Promise<Object>} Formatted URL response object.
 * @throws {AppError} 400 if URL is invalid; 409 if custom code is taken.
 */
async function createShortUrl(longUrl, customCode, sessionId) {
  // Validate URL
  if (!isValidUrl(longUrl)) {
    throw new AppError('Please provide a valid URL starting with http:// or https://', 400);
  }

  // Check for existing duplicate
  const existing = await Url.findOne({ longUrl, sessionId, isActive: true });
  if (existing) {
    return formatResponse(existing);
  }

  // Handle custom code
  const shortCode = customCode || generateShortCode(SHORT_CODE_LENGTH);

  if (customCode) {
    const taken = await Url.findOne({ shortCode: customCode });
    if (taken) {
      throw new AppError('This custom code is already in use. Please try another.', 409);
    }
  }

  // Create the URL document
  const urlDoc = await Url.create({
    longUrl,
    shortCode,
    isCustom: !!customCode,
    sessionId,
  });

  return formatResponse(urlDoc);
}

// ── Private Helpers ─────────────────────────────────────────

/**
 * Formats a URL document into an API response object.
 * @param {Object} urlDoc - Mongoose URL document.
 * @returns {Object} Formatted response with shortUrl.
 */
function formatResponse(urlDoc) {
  return {
    longUrl: urlDoc.longUrl,
    shortUrl: `${BASE_URL}/${urlDoc.shortCode}`,
    shortCode: urlDoc.shortCode,
    clicks: urlDoc.clicks,
    isCustom: urlDoc.isCustom,
    createdAt: urlDoc.createdAt,
    expiresAt: urlDoc.expiresAt,
  };
}

// ── Exports ─────────────────────────────────────────────────
module.exports = {
  createShortUrl,
  // ... other methods
};
```

---

### 3.7 Middleware File Template

```javascript
/**
 * @file       errorHandler.js
 * @description Global error handling middleware for Express.
 *              Catches all errors passed via next(error) and
 *              returns a standardized JSON error response.
 * @module     middleware/errorHandler
 */

'use strict';

// ── Dependencies ────────────────────────────────────────────
const { logger } = require('../utils/logger');

// ── Error Handler ───────────────────────────────────────────

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 * @param {Error} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function (required for signature).
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code is set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error (with stack trace for 5xx errors)
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`, {
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Something went wrong. Please try again.' : message,
  });
};

// ── Export ───────────────────────────────────────────────────
module.exports = { errorHandler };
```

---

### 3.8 Utility File Template

```javascript
/**
 * @file       constants.js
 * @description Application-wide constants. All magic numbers
 *              and configuration values are defined here.
 * @module     utils/constants
 */

'use strict';

// ── Server ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ── URL ─────────────────────────────────────────────────────
const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH, 10) || 8;
const MAX_URL_LENGTH = 2048;
const MIN_CODE_LENGTH = 3;
const MAX_CODE_LENGTH = 30;
const CUSTOM_CODE_PATTERN = /^[a-zA-Z0-9_-]+$/;
const URL_PROTOCOL_PATTERN = /^https?:\/\/.+/;

// ── Expiry ──────────────────────────────────────────────────
const DEFAULT_EXPIRY_DAYS = 7;
const DEFAULT_EXPIRY_MS = DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// ── Rate Limiting ───────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const CREATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CREATE_LIMIT_MAX_REQUESTS = 30;

// ── Cache ───────────────────────────────────────────────────
const CACHE_TTL_SECONDS = 3600; // 1 hour

// ── Pagination ──────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ── Export ───────────────────────────────────────────────────
module.exports = {
  PORT,
  NODE_ENV,
  BASE_URL,
  SHORT_CODE_LENGTH,
  MAX_URL_LENGTH,
  MIN_CODE_LENGTH,
  MAX_CODE_LENGTH,
  CUSTOM_CODE_PATTERN,
  URL_PROTOCOL_PATTERN,
  DEFAULT_EXPIRY_DAYS,
  DEFAULT_EXPIRY_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CREATE_LIMIT_WINDOW_MS,
  CREATE_LIMIT_MAX_REQUESTS,
  CACHE_TTL_SECONDS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
```

---

## 4. 🔌 API Standards

### 4.1 Response Format

All API responses must use a consistent JSON envelope format:

#### Success Response

```javascript
// ── Success with data ──
{
  "success": true,
  "data": {
    "shortUrl": "https://quicklink.app/aB3dEf",
    "shortCode": "aB3dEf",
    "clicks": 0
  }
}

// ── Success with message only ──
{
  "success": true,
  "message": "URL has been deleted successfully"
}

// ── Success with data + pagination ──
{
  "success": true,
  "data": {
    "urls": [ /* ... */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### Error Response

```javascript
// ── Client error (4xx) ──
{
  "success": false,
  "error": "Please provide a valid URL starting with http:// or https://"
}

// ── Server error (5xx) — hide internal details ──
{
  "success": false,
  "error": "Something went wrong. Please try again."
}
```

#### Response Helper Functions

```javascript
// utils/responseHelpers.js

/**
 * Sends a standardized success response.
 * @param {Object} res - Express response object.
 * @param {Object|Array} data - Response data payload.
 * @param {number} [statusCode=200] - HTTP status code.
 */
const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Sends a standardized success message (no data payload).
 * @param {Object} res - Express response object.
 * @param {string} message - Success message text.
 * @param {number} [statusCode=200] - HTTP status code.
 */
const sendMessage = (res, message, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
  });
};

/**
 * Sends a standardized error response.
 * @param {Object} res - Express response object.
 * @param {string} error - Error message text.
 * @param {number} [statusCode=400] - HTTP status code.
 */
const sendError = (res, error, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error,
  });
};

module.exports = { sendSuccess, sendMessage, sendError };
```

### 4.2 HTTP Status Codes

| Code  | Name                  | When to Use                                          | Example Scenario                         |
| ----- | --------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `200` | OK                    | Successful GET, PUT, DELETE                           | Fetch URL stats, delete URL              |
| `201` | Created               | Successful POST that creates a new resource           | New shortened URL created                |
| `302` | Found (Redirect)      | Redirect to original URL                              | Short URL visited → redirect             |
| `400` | Bad Request           | Client sent invalid or malformed data                 | Missing URL, invalid format              |
| `403` | Forbidden             | Client not authorized for this action                 | Session mismatch on delete               |
| `404` | Not Found             | Requested resource doesn't exist                      | Short code not in database               |
| `409` | Conflict              | Resource already exists / collision                    | Custom code already taken                |
| `410` | Gone                  | Resource existed but is no longer available            | Expired URL                              |
| `429` | Too Many Requests     | Rate limit exceeded                                   | > 10 requests per minute                 |
| `500` | Internal Server Error | Unexpected server failure                             | Database crash, unhandled exception       |
| `503` | Service Unavailable   | Server temporarily unable to handle request           | Database disconnected                    |

### 4.3 API Rules Summary

| Rule # | Rule                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| A1     | **Always** return JSON — never return raw text, HTML, or undefined              |
| A2     | **Always** include the `success` field (boolean) in every response              |
| A3     | Use `data` for success payloads; use `error` for error messages                 |
| A4     | **Never** expose stack traces, internal file paths, or database errors to the client |
| A5     | Use the correct HTTP status code for every response (see table above)           |
| A6     | `Content-Type` header must always be `application/json` for API responses       |
| A7     | Use plural nouns for resource endpoints: `/api/urls` not `/api/url`             |
| A8     | Redirect routes (`:shortCode`) return `302` — not JSON                          |
| A9     | Include pagination metadata for any endpoint that returns lists                  |
| A10    | Rate limit all public endpoints — different limits for create vs. read          |

---

## 5. ⚠️ Error Handling Standards

### 5.1 Custom Error Class

```javascript
// utils/appError.js

/**
 * Custom application error class.
 * Extends the native Error with an HTTP status code
 * and an operational flag.
 */
class AppError extends Error {
  /**
   * Creates a new AppError.
   * @param {string} message - Human-readable error message.
   * @param {number} statusCode - HTTP status code (400, 404, 500, etc.).
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
```

### 5.2 Error Handling Rules

| Rule # | Rule                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| EH1    | **Every** async function must have a try/catch block                                    |
| EH2    | Caught errors must be forwarded via `next(error)` to the global error handler           |
| EH3    | **Never** expose raw server errors (stack traces, DB errors) to the frontend            |
| EH4    | Use `AppError` for expected/operational errors (bad input, not found, conflict)          |
| EH5    | Let unexpected errors (bugs) propagate to the global error handler with status 500      |
| EH6    | **Always** log errors with timestamp, request path, method, and IP                      |
| EH7    | Log 5xx errors with full stack trace; log 4xx errors with message only                  |
| EH8    | Use `process.on('unhandledRejection')` and `process.on('uncaughtException')` as safety nets |
| EH9    | **Never** use empty catch blocks: `catch (err) {}` — always handle or re-throw         |
| EH10   | Return user-friendly messages: "Something went wrong" for 500s; specific message for 400s |

### 5.3 Error Handling Patterns

```javascript
// ✅ CORRECT — try/catch + next(error) + AppError

const getUrlStats = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      throw new AppError('URL not found', 404);
    }

    if (urlDoc.expiresAt < new Date()) {
      throw new AppError('This link has expired', 410);
    }

    res.status(200).json({
      success: true,
      data: formatResponse(urlDoc),
    });
  } catch (error) {
    next(error); // Forwarded to global error handler
  }
};
```

```javascript
// ❌ WRONG — Multiple anti-patterns

const getUrlStats = async (req, res) => {
  // ❌ No try/catch
  const urlDoc = await Url.findOne({ shortCode: req.params.shortCode });

  if (!urlDoc) {
    // ❌ Non-standard response format
    res.send('not found');
    return;
  }

  // ❌ Exposing internal data structure
  res.json(urlDoc);
};
```

### 5.4 Process-Level Error Safety

```javascript
// In server.js — Global safety nets

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION:', reason);
  // Give server time to finish pending requests, then shut down
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1); // Must exit — process is in an undefined state
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});
```

---

## 6. 🗄️ Database Standards

### 6.1 Database Rules

| Rule # | Rule                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| DB1    | **Always** validate data using Mongoose schema validation (required, type, match, etc.) |
| DB2    | **Always** handle database operation errors with try/catch                               |
| DB3    | **Never** store plain-text passwords (use bcrypt for future auth feature)                |
| DB4    | **Always** create indexes for frequently queried fields                                  |
| DB5    | Use **connection pooling** (maxPoolSize) — don't open/close connections per request      |
| DB6    | Use the **lean()** method for read-only queries (returns plain objects, faster)           |
| DB7    | Use **select()** to limit returned fields (don't fetch entire documents if unnecessary)  |
| DB8    | Use **atomic operations** (`$inc`, `$set`) instead of read-modify-write patterns         |
| DB9    | **Never** use `Url.find({})` without filters — always scope queries                      |
| DB10   | Enable Mongoose **strict mode** (reject fields not in schema)                            |
| DB11   | Use **TTL indexes** for automatic document expiry — don't build manual cleanup jobs      |
| DB12   | **Always** log database connection events (connected, disconnected, error)                |

### 6.2 Query Patterns

```javascript
// ✅ GOOD — Selective, indexed, lean queries

// Find by indexed field with select
const urlDoc = await Url.findOne({ shortCode })
  .select('longUrl clicks expiresAt isActive')
  .lean();

// Atomic increment (no race condition)
await Url.updateOne(
  { shortCode },
  { $inc: { clicks: 1 } }
);

// Paginated query with sort
const urls = await Url.find({ sessionId, isActive: true })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .select('longUrl shortCode clicks createdAt expiresAt isCustom')
  .lean();

// Count for pagination
const total = await Url.countDocuments({ sessionId, isActive: true });
```

```javascript
// ❌ BAD — Unindexed, full document fetch, race condition

// Fetches ALL fields (wasteful)
const urlDoc = await Url.findOne({ shortCode });

// Read-modify-write race condition
const url = await Url.findOne({ shortCode });
url.clicks = url.clicks + 1; // ❌ Race condition if concurrent
await url.save();

// No pagination, no limit (dangerous on large collections)
const allUrls = await Url.find({}); // ❌ Fetches everything
```

---

## 7. 🔒 Security Standards

### 7.1 Security Rules

| Rule # | Rule                                                                | Implementation                          |
| ------ | ------------------------------------------------------------------- | --------------------------------------- |
| S1     | **Never** hardcode secrets, API keys, or credentials                | Use `.env` + `dotenv` package            |
| S2     | **Always** use `.env` for sensitive configuration                   | `MONGODB_URI`, `REDIS_URL`, `BASE_URL`   |
| S3     | **Always** add `.env` to `.gitignore`                               | Prevent accidental commit                |
| S4     | **Always** validate all user inputs on the server side              | Custom validator middleware              |
| S5     | **Always** sanitize data before database operations                 | Mongoose schema validation + trim        |
| S6     | **Always** rate limit all public endpoints                          | `express-rate-limit` package             |
| S7     | **Always** use Helmet.js for secure HTTP headers                    | `helmet()` middleware                    |
| S8     | **Always** configure CORS to allow only trusted origins             | `cors({ origin: [...] })`               |
| S9     | **Never** expose internal error details to clients                  | Generic message for 500 errors           |
| S10    | **Always** enforce HTTPS in production                              | Cloud Run provides TLS automatically     |
| S11    | **Always** set `Content-Type: application/json` for API responses   | Express does this when using `res.json()`|
| S12    | **Always** limit request body size                                  | `express.json({ limit: '1mb' })`        |
| S13    | **Never** use `eval()`, `Function()`, or dynamic code execution    | Injection risk                           |
| S14    | **Always** block dangerous URL patterns                             | Localhost, private IPs, file:// protocol |
| S15    | Provide an `.env.example` with placeholder values                   | Document required variables              |

### 7.2 Environment Variables

```bash
# ── .env.example ──
# Copy this file to .env and fill in the values.
# NEVER commit .env to version control.

# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/quicklink

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Short Code
SHORT_CODE_LENGTH=8
```

### 7.3 .gitignore

```gitignore
# ── Dependencies ──
node_modules/

# ── Environment ──
.env
.env.local
.env.*.local

# ── Logs ──
logs/
*.log
npm-debug.log*

# ── Build ──
dist/
build/

# ── Coverage ──
coverage/
.nyc_output/

# ── OS Files ──
.DS_Store
Thumbs.db

# ── IDE ──
.vscode/
.idea/
*.swp
*.swo

# ── Docker ──
docker-compose.override.yml
```

### 7.4 Input Validation Checklist

| Input                  | Validation Rule                                          | Error Message                                  |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| `longUrl`              | Required, string, starts with `http://` or `https://`    | "Please provide a valid URL starting with http:// or https://" |
| `longUrl` length       | Max 2048 characters                                      | "URL is too long (max 2048 characters)"        |
| `longUrl` pattern      | Not localhost, not private IP, not file://                | "This URL is not allowed for security reasons"  |
| `customCode`           | Optional, 3–30 chars, `[a-zA-Z0-9_-]` only              | "Custom code must be 3-30 alphanumeric characters" |
| `customCode` uniqueness| Must not already exist in database                       | "This custom code is already in use"            |
| `sessionId`            | Optional, string, max 50 chars                           | "Invalid session identifier"                    |
| `page`                 | Optional, positive integer                               | "Page must be a positive number"                |
| `limit`                | Optional, integer 1–100                                  | "Limit must be between 1 and 100"               |
| `shortCode` (param)    | Required, `[a-zA-Z0-9_-]` only, 3–30 chars              | (404 if not found, 410 if expired)              |

---

## 8. 🎨 CSS Standards

### 8.1 CSS File Organization

Every CSS file must follow this section order:

```css
/* ═══════════════════════════════════════════════════════
   FILE: styles.css
   DESCRIPTION: Main stylesheet for QuickLink
   
   SECTION ORDER:
   1. Imports & Fonts
   2. CSS Custom Properties (Design Tokens)
   3. Reset & Base Styles
   4. Layout & Structure
   5. Component Styles
   6. Utility Classes
   7. Animations & Keyframes
   8. Accessibility
   ═══════════════════════════════════════════════════════ */


/* ── 1. IMPORTS & FONTS ──────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');


/* ── 2. CSS CUSTOM PROPERTIES ────────────────────────── */
:root {
  --color-primary: #6C5CE7;
  --color-bg: #FFFFFF;
  --font-primary: 'Inter', sans-serif;
  --space-4: 1rem;
  --radius-lg: 12px;
}


/* ── 3. RESET & BASE ─────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-primary);
  color: var(--color-text);
  background: var(--color-bg);
}


/* ── 4. LAYOUT & STRUCTURE ───────────────────────────── */
.container { /* ... */ }
.page-wrapper { /* ... */ }


/* ── 5. COMPONENTS ───────────────────────────────────── */
/* Navbar */
.navbar { /* ... */ }
.navbar__logo { /* ... */ }

/* Form */
.form { /* ... */ }
.form__input { /* ... */ }


/* ── 6. UTILITY CLASSES ──────────────────────────────── */
.sr-only { /* Screen-reader only */ }
.text-center { text-align: center; }


/* ── 7. ANIMATIONS ───────────────────────────────────── */
@keyframes slideDown { /* ... */ }


/* ── 8. ACCESSIBILITY ────────────────────────────────── */
@media (prefers-reduced-motion: reduce) { /* ... */ }
```

### 8.2 CSS Rules

| Rule # | Rule                                                                        |
| ------ | --------------------------------------------------------------------------- |
| C1     | **Always** use CSS custom properties for colors, fonts, spacing, and radii  |
| C2     | **Never** use inline styles in HTML (`style="..."`)                         |
| C3     | **Never** use `!important` except for utility overrides                     |
| C4     | Use **BEM naming convention**: `block__element--modifier`                   |
| C5     | Use **mobile-first** media queries: `min-width`, not `max-width`           |
| C6     | **Always** use `rem` for font sizes and spacing; `px` for borders and shadows |
| C7     | **Always** include `box-sizing: border-box` in reset                       |
| C8     | Group properties in this order: layout → box model → typography → visual → misc |
| C9     | **Never** use IDs for styling; IDs are for JavaScript hooks only           |
| C10    | Use semantic class names that describe purpose, not appearance             |

### 8.3 BEM Naming Convention

```css
/* ── BEM: Block__Element--Modifier ──────────────────── */

/* BLOCK: A standalone component */
.form { }
.navbar { }
.result-card { }

/* ELEMENT: A part of a block (double underscore) */
.form__input { }
.form__button { }
.form__label { }
.navbar__logo { }
.navbar__link { }
.result-card__url { }
.result-card__qr { }

/* MODIFIER: A variation of a block or element (double hyphen) */
.form__input--error { }
.form__input--focused { }
.form__button--loading { }
.form__button--disabled { }
.navbar__link--active { }
.result-card--success { }
```

```css
/* ✅ GOOD — BEM naming, semantic, no IDs for styling */
.hero { }
.hero__heading { }
.hero__subtitle { }
.btn { }
.btn--primary { }
.btn--outline { }
.btn--copied { }
.url-table { }
.url-table__row { }
.url-table__row--expired { }

/* ❌ BAD — Non-BEM, IDs for styling, presentational names */
#header { }          /* ❌ ID for styling */
.red-text { }        /* ❌ Presentational name */
.big-button { }      /* ❌ Describes appearance, not purpose */
.div1 { }            /* ❌ Meaningless name */
.fl { }              /* ❌ Abbreviation */
```

### 8.4 Responsive Design — Mobile-First

```css
/* ── Mobile-first: Start with mobile, add for larger screens ── */

/* BASE STYLES (Mobile: 320px+) */
.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* TABLET (768px+) */
@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

/* DESKTOP (1024px+) */
@media (min-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-8);
  }
}
```

```css
/* ❌ BAD — Desktop-first (max-width) */
.features-grid {
  grid-template-columns: repeat(3, 1fr); /* Desktop default */
}

@media (max-width: 1024px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
}
```

### 8.5 CSS Property Order

```css
/* ── Organize properties in this order ── */

.component {
  /* 1. Layout */
  display: flex;
  position: relative;
  top: 0;
  z-index: 10;

  /* 2. Box Model */
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  padding: var(--space-6);

  /* 3. Typography */
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  text-align: center;

  /* 4. Visual */
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  opacity: 1;

  /* 5. Animation / Misc */
  transition: transform 0.15s var(--ease-out);
  cursor: pointer;
  overflow: hidden;
}
```

---

## 9. 🔀 Git & Version Control Standards

### 9.1 Commit Message Format

Follow the **Conventional Commits** standard:

```
<type>(<scope>): <short description>

[optional body — what and why]

[optional footer — breaking changes, issue refs]
```

#### Commit Types

| Type       | Emoji | Usage                                          | Example                                      |
| ---------- | ----- | ---------------------------------------------- | -------------------------------------------- |
| `feat`     | ✨    | New feature or functionality                    | `feat(api): add POST /api/shorten endpoint`  |
| `fix`      | 🐛    | Bug fix                                         | `fix(redirect): handle expired URL redirect` |
| `docs`     | 📝    | Documentation changes only                      | `docs: update README with setup instructions`|
| `style`    | 💄    | Code formatting (no logic change)               | `style: format urlController with Prettier`  |
| `refactor` | ♻️    | Code change that neither fixes nor adds feature | `refactor(service): extract formatResponse helper` |
| `test`     | ✅    | Adding or updating tests                        | `test(api): add URL validation edge cases`   |
| `chore`    | 🔧    | Build, config, tooling changes                  | `chore: add .env.example template`           |
| `perf`     | ⚡    | Performance improvement                          | `perf(redirect): add Redis cache for lookups`|
| `ci`       | 👷    | CI/CD pipeline changes                           | `ci: add GitHub Actions deploy workflow`     |
| `build`    | 📦    | Build system or external dependency changes      | `build: add helmet and cors packages`        |
| `revert`   | ⏪    | Revert a previous commit                        | `revert: revert feat(api): custom codes`     |

#### Commit Rules

```bash
# ✅ GOOD COMMITS — Atomic, descriptive, conventional format
git commit -m "feat(api): add POST /api/shorten endpoint"
git commit -m "feat(frontend): implement URL input form with validation"
git commit -m "fix(redirect): return 410 for expired URLs instead of 404"
git commit -m "test(api): add integration tests for shorten endpoint"
git commit -m "docs: add API documentation with request/response examples"
git commit -m "style: format all files with Prettier"
git commit -m "chore: add .gitignore and .env.example"

# ❌ BAD COMMITS — Vague, too large, missing type
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "WIP"
git commit -m "asdfgh"
git commit -m "final commit"
git commit -m "done with everything"
```

### 9.2 Branch Naming

| Branch Type          | Pattern                   | Example                              |
| -------------------- | ------------------------- | ------------------------------------ |
| **Main**             | `main`                    | `main`                               |
| **Feature**          | `feature/<description>`   | `feature/url-shortening`             |
| **Bug Fix**          | `fix/<description>`       | `fix/redirect-expired-urls`          |
| **Hotfix**           | `hotfix/<description>`    | `hotfix/rate-limit-bypass`           |
| **Documentation**    | `docs/<description>`      | `docs/api-documentation`             |
| **Testing**          | `test/<description>`      | `test/integration-tests`             |
| **Chore**            | `chore/<description>`     | `chore/setup-eslint`                 |

### 9.3 Git Rules

| Rule # | Rule                                                                     |
| ------ | ------------------------------------------------------------------------ |
| G1     | **Never** commit `.env` files — always use `.gitignore`                  |
| G2     | **Always** have a `.gitignore` file from day 1                           |
| G3     | **Always** write meaningful commit messages (see format above)           |
| G4     | Commit **small, atomic changes** — one logical change per commit         |
| G5     | **Never** commit `node_modules/`                                         |
| G6     | **Never** commit build artifacts (`dist/`, `build/`)                     |
| G7     | **Never** commit log files                                               |
| G8     | **Always** add `.env.example` with placeholder values                    |
| G9     | **Never** force-push to `main`                                           |
| G10    | Pull before push — keep local branch up to date                          |

---

## 10. 🧪 Testing Standards

### 10.1 Testing Rules

| Rule # | Rule                                                                        |
| ------ | --------------------------------------------------------------------------- |
| T1     | Write tests for **all** API endpoints (minimum 2 per endpoint)              |
| T2     | Test both **success** and **error** cases for every endpoint                |
| T3     | Minimum **80% code coverage** across the test suite                         |
| T4     | Test files must follow naming: `<module>.test.js`                           |
| T5     | Use a **separate test database** — never test against production            |
| T6     | **Clean up** test data after each test (use `afterEach` hooks)              |
| T7     | Tests must be **independent** — no test should depend on another test       |
| T8     | Tests must be **deterministic** — same result every time                    |
| T9     | Use **descriptive test names** that explain the expected behavior            |
| T10    | Group tests with `describe` blocks by feature or endpoint                   |
| T11    | Use **arrange-act-assert** pattern in every test                            |
| T12    | Mock external services (Redis, third-party APIs) in unit tests              |

### 10.2 Test File Naming

| Source File             | Test File                               | Type          |
| ----------------------- | --------------------------------------- | ------------- |
| `utils/generateCode.js` | `tests/unit/generateCode.test.js`       | Unit          |
| `utils/validateUrl.js`  | `tests/unit/validateUrl.test.js`        | Unit          |
| `services/urlService.js`| `tests/unit/urlService.test.js`         | Unit          |
| `POST /api/shorten`     | `tests/integration/shorten.test.js`     | Integration   |
| `GET /:shortCode`       | `tests/integration/redirect.test.js`    | Integration   |
| `GET /api/urls`         | `tests/integration/dashboard.test.js`   | Integration   |

### 10.3 Test Template

```javascript
/**
 * @file       shorten.test.js
 * @description Integration tests for POST /api/shorten endpoint.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Url = require('../../models/Url');

describe('POST /api/shorten', () => {
  // ── Setup & Teardown ─────────────────────────────────────
  beforeEach(async () => {
    await Url.deleteMany({}); // Clean state before each test
  });

  afterAll(async () => {
    await Url.deleteMany({});
    await mongoose.connection.close();
  });

  // ── Success Cases ────────────────────────────────────────
  describe('Success Cases', () => {
    it('should create a short URL when given a valid long URL', async () => {
      // Arrange
      const payload = {
        longUrl: 'https://www.example.com/very/long/path',
        sessionId: 'test-session-123',
      };

      // Act
      const response = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.shortCode).toBeDefined();
      expect(response.body.data.shortUrl).toContain(response.body.data.shortCode);
      expect(response.body.data.clicks).toBe(0);
    });

    it('should return existing URL when same longUrl is submitted twice', async () => {
      // Arrange
      const payload = {
        longUrl: 'https://www.example.com/duplicate',
        sessionId: 'test-session-123',
      };

      // Act — Create first
      const first = await request(app).post('/api/shorten').send(payload);
      // Act — Submit again
      const second = await request(app).post('/api/shorten').send(payload);

      // Assert — Same short code returned
      expect(second.body.data.shortCode).toBe(first.body.data.shortCode);
    });
  });

  // ── Error Cases ──────────────────────────────────────────
  describe('Error Cases', () => {
    it('should return 400 when longUrl is missing', async () => {
      // Arrange
      const payload = { sessionId: 'test-session' };

      // Act
      const response = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when longUrl is invalid format', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ longUrl: 'not-a-url', sessionId: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 when custom code is already taken', async () => {
      // Arrange — Create first URL with custom code
      await request(app)
        .post('/api/shorten')
        .send({
          longUrl: 'https://example.com/first',
          customCode: 'my-code',
          sessionId: 'test',
        });

      // Act — Try same custom code
      const response = await request(app)
        .post('/api/shorten')
        .send({
          longUrl: 'https://example.com/second',
          customCode: 'my-code',
          sessionId: 'test',
        })
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already in use');
    });
  });
});
```

### 10.4 Test Coverage Requirements

| Category                | Minimum Coverage |
| ----------------------- | ---------------- |
| **Overall**             | 80%              |
| **Services**            | 90%              |
| **Utilities**           | 95%              |
| **Controllers**         | 80%              |
| **Middleware**           | 75%              |
| **Models**              | 70%              |

---

## 11. 📖 Documentation Standards

### 11.1 JSDoc Rules

Every exported function must have a JSDoc comment including:

```javascript
/**
 * [What it does — one line description]
 *
 * [Optional longer description if needed]
 *
 * @param   {type} paramName - Description of the parameter.
 * @param   {type} [optionalParam] - Square brackets = optional.
 * @param   {type} [optionalParam=default] - With default value.
 * @returns {type} Description of return value.
 * @throws  {ErrorType} When/why this error is thrown.
 *
 * @example
 * const result = await createShortUrl('https://example.com');
 * // result: { shortUrl: '...', shortCode: '...' }
 */
```

### 11.2 Type Reference

| Type                 | JSDoc Syntax       | Example Usage                           |
| -------------------- | -------------------- | --------------------------------------- |
| String               | `{string}`          | `@param {string} longUrl`               |
| Number               | `{number}`          | `@param {number} page`                  |
| Boolean              | `{boolean}`         | `@param {boolean} isActive`             |
| Object               | `{Object}`          | `@param {Object} options`               |
| Array of strings     | `{string[]}`        | `@param {string[]} urls`                |
| Nullable             | `{string\|null}`     | `@param {string\|null} customCode`       |
| Optional             | `{string} [param]`  | `@param {string} [sessionId]`           |
| Promise              | `{Promise<Object>}` | `@returns {Promise<Object>}`            |
| void                 | `{void}`            | `@returns {void}`                       |
| Express request      | `{Object}`          | `@param {Object} req`                   |

### 11.3 README Requirements

The project `README.md` must include:

| Section               | Content                                                    |
| --------------------- | ---------------------------------------------------------- |
| Project Title + Logo  | "🔗 QuickLink — URL Shortener"                            |
| Description           | One-paragraph summary of what the app does                 |
| Features              | Bullet list of key features                                |
| Tech Stack            | Table of technologies used                                 |
| Prerequisites         | Node.js version, MongoDB, npm                              |
| Installation          | Step-by-step setup commands                                |
| Environment Variables | Table of required env vars from `.env.example`             |
| Running Locally       | `npm run dev` command and expected output                   |
| API Documentation     | Table of endpoints with example requests/responses         |
| Project Structure     | Folder tree with file descriptions                         |
| Testing               | How to run tests: `npm test`                               |
| Deployment            | How to deploy to Cloud Run                                  |
| Contributing          | How to contribute (commit format, branch naming)           |
| License               | License type                                                |

### 11.4 Inline Comment Standards

```javascript
// ── SECTION HEADERS ── Use these to divide logical sections in a file
// ── Dependencies ────────────────────────────────────────────
// ── Constants ───────────────────────────────────────────────
// ── Middleware ───────────────────────────────────────────────
// ── Routes ──────────────────────────────────────────────────
// ── Export ───────────────────────────────────────────────────

// ── INLINE COMMENTS ── Explain WHY, not WHAT
// Using fire-and-forget for click tracking to avoid blocking redirect
Url.updateOne({ shortCode }, { $inc: { clicks: 1 } });

// ── TODO COMMENTS ── For planned improvements
// TODO: Add geographic tracking in v2.0
// FIXME: Race condition when two requests create the same custom code
// HACK: Workaround for nanoid ESM/CJS compatibility issue
```

---

## 12. 🚫 Forbidden Practices

### The "Never Do" List

Every item below is a **hard rule**. Violations must be caught during code review and fixed before merge.

| #  | ❌ Forbidden Practice                              | 🔍 How to Detect                        | ✅ What to Do Instead                                |
| -- | -------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| 1  | Using `var` keyword                                | `grep -r "var " --include="*.js"`        | Use `const` (default) or `let` (when reassigning)    |
| 2  | Using callbacks for async operations               | Look for `function(err, result)` pattern | Use `async/await` with `try/catch`                   |
| 3  | Hardcoding URLs, secrets, or credentials           | `grep -r "mongodb://" --include="*.js"`  | Use `process.env.VARIABLE_NAME` via `.env`           |
| 4  | Committing `.env` files to Git                     | Check `.gitignore` for `.env` entry      | Add `.env` to `.gitignore`; provide `.env.example`   |
| 5  | Skipping error handling (no try/catch)             | Look for bare `await` without try/catch  | Wrap every async call in try/catch + `next(error)`   |
| 6  | Using `console.log` in production code             | `grep -r "console.log" --include="*.js"` | Use the `logger` utility (`utils/logger.js`)         |
| 7  | Storing passwords in plain text                    | Check user model for `password: String`  | Use `bcrypt.hash()` before saving (v2.0)             |
| 8  | Using loose equality (`==`, `!=`)                  | ESLint rule: `eqeqeq`                   | Always use `===` and `!==`                           |
| 9  | Empty catch blocks `catch (err) {}`                | Look for empty catch bodies              | Handle or re-throw: `catch (err) { next(err); }`    |
| 10 | Using inline styles in HTML                        | `grep 'style="' --include="*.html"`      | Use CSS classes and external stylesheets             |
| 11 | Using `!important` in CSS (except utilities)       | `grep '!important' --include="*.css"`    | Fix specificity with better selector design          |
| 12 | Using CSS IDs for styling                          | Look for `#id { }` in CSS files          | Use classes; IDs are for JavaScript hooks only       |
| 13 | Fetching all documents without filters/limits      | Look for `Model.find({})`                | Always add query filters and `.limit()`              |
| 14 | Using `eval()` or `Function()`                     | `grep -r "eval(" --include="*.js"`       | Use safer alternatives (JSON.parse, etc.)            |
| 15 | Committing `node_modules/`                         | Check `.gitignore` for node_modules      | `node_modules/` must be in `.gitignore`              |
| 16 | Using synchronous file operations                  | Look for `fs.readFileSync`               | Use `fs.promises.readFile` or `fs.readFile` with async |
| 17 | Returning raw database documents to the client     | Look for `res.json(mongooseDoc)`         | Format response using a helper function              |
| 18 | Using `String()` for ObjectId comparison           | Look for `toString()` comparisons        | Use `mongoose.Types.ObjectId` or `.equals()` method  |
| 19 | Missing `Content-Type` header on API responses     | Test with curl and check headers         | Use `res.json()` which sets it automatically         |
| 20 | Ignoring unhandled promise rejections              | Check for `process.on` handlers          | Add `unhandledRejection` and `uncaughtException` handlers |

### ESLint Configuration

```json
// .eslintrc.json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^(next|req|res)$" }],
    "no-empty": ["error", { "allowEmptyCatch": false }],
    "curly": ["error", "all"],
    "semi": ["error", "always"],
    "quotes": ["error", "single", { "avoidEscape": true }],
    "indent": ["error", 2],
    "no-trailing-spaces": "error",
    "comma-dangle": ["error", "always-multiline"],
    "arrow-body-style": ["warn", "as-needed"],
    "prefer-template": "error",
    "no-throw-literal": "error",
    "require-await": "warn",
    "no-return-await": "error",
    "no-duplicate-imports": "error"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 📎 Appendix

### A. Quick Reference Card

```
┌────────────────────────────────────────────────────────────────────┐
│                    CODE STANDARDS QUICK REFERENCE                  │
│                                                                    │
│  NAMING                                                           │
│  ──────                                                           │
│  variables      camelCase        shortCode, longUrl               │
│  constants      UPPER_SNAKE      MAX_RETRIES, BASE_URL            │
│  functions      camelCase        generateShortCode()              │
│  files          camelCase        urlController.js                 │
│  classes        PascalCase       AppError, CacheService           │
│  CSS classes    BEM              form__input--error               │
│  CSS vars       kebab-case       --color-primary                  │
│  HTML IDs       kebab-case       url-input, shorten-btn           │
│                                                                    │
│  RULES                                                            │
│  ─────                                                            │
│  const > let > NEVER var                                          │
│  async/await > NEVER callbacks                                    │
│  === always > NEVER ==                                            │
│  try/catch on EVERY async function                                │
│  30 lines max per function                                        │
│  3 params max (use object for more)                               │
│  200 lines max per file                                           │
│                                                                    │
│  RESPONSE FORMAT                                                  │
│  ───────────────                                                  │
│  { success: true,  data: { ... } }     // success                │
│  { success: false, error: '...' }      // error                  │
│                                                                    │
│  COMMITS                                                          │
│  ───────                                                          │
│  feat(scope): description                                         │
│  fix(scope): description                                          │
│  test(scope): description                                         │
│  docs: description                                                │
│                                                                    │
│  NEVER                                                            │
│  ─────                                                            │
│  ❌ var  ❌ callbacks  ❌ console.log  ❌ hardcoded secrets       │
│  ❌ ==   ❌ eval()     ❌ .env in git  ❌ inline styles           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

> **Document Status:** This Code Standards document is the definitive engineering reference for the QuickLink project. All code written by any agent or developer must comply with these standards. Violations are flagged during the Quality Gate review.

---

*© 2026 QuickLink — Built with 📏 on Google Antigravity*
