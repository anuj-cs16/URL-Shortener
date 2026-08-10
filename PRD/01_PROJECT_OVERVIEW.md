# 📋 Product Requirements Document (PRD)

## **QuickLink — URL Shortener Web Application**

| Field            | Details                          |
| ---------------- | -------------------------------- |
| **Document**     | Product Requirements Document    |
| **Version**      | 1.0                              |
| **Status**       | Draft                            |
| **Author**       | Product Team                     |
| **Created**      | August 10, 2026                  |
| **Last Updated** | August 10, 2026                  |
| **Platform**     | Google Antigravity               |

---

## 📑 Table of Contents

1. [Project Summary](#1--project-summary)
2. [Core Features List](#2--core-features-list)
3. [Non-Functional Requirements](#3--non-functional-requirements)
4. [User Stories](#4--user-stories)
5. [Success Metrics](#5--success-metrics)
6. [Project Timeline](#6--project-timeline)
7. [Tech Stack Overview](#7--tech-stack-overview)

---

## 1. 🎯 Project Summary

### 1.1 Project Name

**QuickLink** — A modern, fast, and reliable URL Shortener web application.

### 1.2 Project Goal & Purpose

QuickLink aims to provide users with a seamless way to transform long, unwieldy URLs into short, shareable links. The application empowers individuals, marketers, and businesses to manage, track, and share links effortlessly — all through a clean, intuitive web interface.

> **Vision:** Make every link shareable, trackable, and beautiful.

### 1.3 Problem Statement

| Problem                                                    | Impact                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| Long URLs are ugly, hard to share, and break in messages   | Poor user experience across social media, email, and print     |
| No visibility into who clicks shared links                 | Marketers and creators can't measure engagement                |
| Existing tools are bloated, paywalled, or privacy-invasive | Users avoid link shortening or rely on untrusted free services |
| No easy way to generate QR codes alongside short links     | Missed opportunity for offline-to-online engagement            |

### 1.4 Target Users

| User Segment               | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| 🧑‍💻 **Individual Users**    | Anyone who wants to shorten a URL for personal sharing (social media, chat) |
| 📢 **Marketers & Creators** | Content creators, social media managers who need click tracking & analytics |
| 🏢 **Small Businesses**     | Teams that share branded or campaign-specific links                         |
| 👨‍🎓 **Students & Educators** | Sharing resource links in presentations, documents, and classrooms          |
| 👨‍💻 **Developers**           | Engineers who need quick, programmatic link shortening                      |

### 1.5 Project Scope

#### ✅ In Scope

- Shorten any valid public URL into a unique short link
- Track total click count per shortened URL
- Generate a QR code for every short link
- Copy short link to clipboard with one click
- Auto-expire links after 7 days
- User dashboard to view and manage created links
- Custom short code support (e.g., `quicklink.app/my-brand`)
- Input URL validation (format, reachability)
- Fully mobile-responsive design
- Rate limiting to prevent abuse

#### ❌ Out of Scope (v1.0)

- User authentication / account system (login, signup)
- Paid plans or premium tiers
- API access for third-party integrations
- Custom domain support
- Advanced analytics (geographic data, device breakdown, referrer tracking)
- Browser extension
- Bulk URL shortening
- Link editing after creation

---

## 2. 🚀 Core Features List

### Feature Breakdown

| #  | Feature                        | Priority    | Description                                                                               |
| -- | ------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| F1 | **Paste Long URL → Short URL** | 🔴 Critical | User pastes a long URL into an input field and receives a shortened URL instantly          |
| F2 | **Click Tracking & Count**     | 🔴 Critical | Every short URL tracks total number of clicks; count is displayed on the dashboard         |
| F3 | **Copy to Clipboard**          | 🟡 High     | One-click button to copy the generated short URL to the clipboard with visual confirmation |
| F4 | **QR Code Generation**         | 🟡 High     | Automatically generate a downloadable QR code for every shortened URL                     |
| F5 | **URL Expiry (7 Days)**        | 🟡 High     | Shortened URLs automatically expire and become inactive after 7 days from creation         |
| F6 | **User Dashboard**             | 🟡 High     | A dashboard page listing all URLs created in the current session with stats                |
| F7 | **Custom Short Code**          | 🟢 Medium   | Users can optionally specify a custom alias for their short URL                            |
| F8 | **URL Validation**             | 🔴 Critical | Validate that the input is a properly formatted, reachable URL before shortening           |
| F9 | **Mobile Responsive Design**   | 🔴 Critical | Fully responsive UI that works flawlessly on mobile, tablet, and desktop                   |

### Feature Details

#### F1 — Paste Long URL → Get Short URL

- Single input field prominently displayed on the homepage
- "Shorten" button triggers URL processing
- Backend generates a unique 6–8 character alphanumeric code
- Short URL is displayed immediately with copy and QR options
- Duplicate detection: if the same long URL is submitted again, return the existing short URL

#### F2 — Click Tracking & Count

- Every redirect through a short URL increments a click counter
- Click count is stored in the database and displayed on the dashboard
- Counter updates in near real-time (within 5 seconds)

#### F3 — Copy to Clipboard

- "📋 Copy" button next to every generated short URL
- Uses the Clipboard API for modern browsers
- Visual feedback: button text changes to "✅ Copied!" for 2 seconds
- Fallback mechanism for older browsers

#### F4 — QR Code Generation

- QR code is generated client-side for every short URL
- Displayed inline below the short URL result
- "⬇️ Download QR" button to save as PNG image
- QR code encodes the full short URL

#### F5 — URL Expiry (7 Days)

- Each shortened URL has a `created_at` timestamp and a `expires_at` field (created_at + 7 days)
- Expired URLs return a friendly "This link has expired" page when visited
- Dashboard shows remaining time-to-live for each URL
- A scheduled cleanup job purges expired records from the database daily

#### F6 — User Dashboard

- Accessible via a "Dashboard" link in the navigation
- Session-based: tracks URLs created during the current browser session (stored via `localStorage`)
- Displays a table with columns:

| Column         | Description                          |
| -------------- | ------------------------------------ |
| Original URL   | Truncated display of the long URL    |
| Short URL      | Clickable short link                 |
| Clicks         | Total click count                    |
| Created        | Date and time of creation            |
| Expires In     | Countdown or "Expired" badge         |
| Actions        | Copy, QR Download, Delete            |

- Search and filter functionality within the dashboard
- Empty state with a call-to-action to create the first link

#### F7 — Custom Short Code

- Optional text input for users to specify a custom alias
- Validation rules:
  - 3–30 characters
  - Alphanumeric, hyphens, and underscores only
  - Must be unique (not already taken)
- If left blank, system auto-generates a random code
- Real-time availability check as user types

#### F8 — URL Validation

- **Client-side:** Regex-based format validation (must start with `http://` or `https://`)
- **Server-side:** Format validation + optional reachability check (HEAD request with timeout)
- Blocked URL patterns: localhost, private IPs, known malicious domains
- Clear error messages for invalid inputs:
  - "Please enter a valid URL starting with http:// or https://"
  - "This URL doesn't appear to be reachable"
  - "This URL is not allowed for security reasons"

#### F9 — Mobile Responsive Design

- Mobile-first CSS approach
- Breakpoints:

| Breakpoint | Target          |
| ---------- | --------------- |
| < 480px    | Small phones    |
| 480–768px  | Large phones    |
| 768–1024px | Tablets         |
| > 1024px   | Desktop         |

- Touch-friendly buttons (minimum 44×44px tap targets)
- Collapsible navigation on mobile
- Optimized table layout on small screens (card view for dashboard)

---

## 3. 🔒 Non-Functional Requirements

### 3.1 Performance

| Metric                     | Target                | Measurement Method            |
| -------------------------- | --------------------- | ----------------------------- |
| Initial page load          | < 2 seconds           | Lighthouse / WebPageTest      |
| URL shortening response    | < 500ms               | Server-side timing            |
| Redirect latency           | < 100ms               | Server-side timing            |
| Dashboard data load        | < 1 second            | Client-side performance API   |
| Time to Interactive (TTI)  | < 2.5 seconds         | Lighthouse                    |
| Largest Contentful Paint   | < 1.5 seconds         | Core Web Vitals               |

### 3.2 Security

| Requirement                | Implementation                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| Input Validation           | Server-side sanitization of all user inputs                       |
| Rate Limiting              | Max 30 URL creations per IP per hour; max 100 redirects per minute |
| XSS Prevention             | Content Security Policy headers; output encoding                  |
| SQL/NoSQL Injection        | Parameterized queries; Mongoose schema validation                 |
| HTTPS                      | TLS enforced on all endpoints                                     |
| CORS                       | Restricted to allowed origins only                                |
| Malicious URL Blocking     | Deny-list of known phishing/malware domains                       |
| Helmet.js                  | Secure HTTP headers via Express middleware                        |

### 3.3 Scalability

| Metric                     | Target                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Concurrent Users           | Handle up to 10,000 simultaneous users                            |
| Database Capacity          | Support 1M+ shortened URLs                                       |
| Horizontal Scaling         | Stateless architecture; deployable across multiple Cloud Run instances |
| Auto-scaling               | Cloud Run auto-scales based on request volume                     |

### 3.4 Availability

| Metric                     | Target                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Uptime SLA                 | 99.9% (< 8.76 hours downtime per year)                           |
| Disaster Recovery          | Automated database backups every 24 hours                         |
| Health Checks              | `/health` endpoint monitored by Cloud Monitoring                  |
| Graceful Degradation       | Static fallback page if backend is unreachable                    |

### 3.5 Accessibility

| Requirement                | Standard                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| WCAG Compliance            | Level AA (WCAG 2.1)                                               |
| Keyboard Navigation        | All interactive elements fully keyboard-accessible                |
| Screen Reader Support      | Proper ARIA labels and semantic HTML                              |
| Color Contrast             | Minimum 4.5:1 ratio for text                                     |
| Mobile Friendly            | Responsive design passing Google Mobile-Friendly Test             |

---

## 4. 👤 User Stories

### Core User Stories

| #   | User Story                                                                                                                                 | Feature | Priority    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ----------- |
| US1 | As a **user**, I want to **paste a long URL and receive a short link**, so that **I can share it easily on social media and messaging apps**. | F1      | 🔴 Critical |
| US2 | As a **marketer**, I want to **see how many times my short link was clicked**, so that **I can measure the effectiveness of my campaigns**. | F2      | 🔴 Critical |
| US3 | As a **user**, I want to **copy the short URL to my clipboard with one click**, so that **I can quickly paste it wherever I need**.         | F3      | 🟡 High     |
| US4 | As a **business owner**, I want to **generate a QR code for my short link**, so that **I can use it on printed materials like flyers and business cards**. | F4      | 🟡 High     |
| US5 | As a **platform administrator**, I want **links to automatically expire after 7 days**, so that **the system stays clean and storage is managed efficiently**. | F5      | 🟡 High     |
| US6 | As a **frequent user**, I want to **view all my shortened URLs in a dashboard**, so that **I can manage and track all my links in one place**. | F6      | 🟡 High     |
| US7 | As a **brand-conscious user**, I want to **choose a custom short code for my URL**, so that **my links look professional and are easy to remember**. | F7      | 🟢 Medium   |
| US8 | As a **user**, I want the system to **validate my URL before shortening**, so that **I don't create broken or invalid short links**.         | F8      | 🔴 Critical |
| US9 | As a **mobile user**, I want to **use the app comfortably on my phone**, so that **I can shorten and share URLs on the go**.                | F9      | 🔴 Critical |
| US10 | As a **user**, I want to **see a friendly error message when I enter an invalid URL**, so that **I understand what went wrong and how to fix it**. | F8     | 🟡 High     |
| US11 | As a **user**, I want to **download the QR code as an image file**, so that **I can use it in presentations, documents, or print media**. | F4      | 🟢 Medium   |
| US12 | As a **user**, I want to **see how much time is left before my link expires**, so that **I can plan to reshare or recreate it if needed**. | F5      | 🟢 Medium   |
| US13 | As a **user visiting an expired link**, I want to **see a clear message that the link has expired**, so that **I'm not confused by a generic error page**. | F5     | 🟡 High     |
| US14 | As a **user**, I want to **search and filter my URLs on the dashboard**, so that **I can quickly find a specific link among many**.          | F6      | 🟢 Medium   |
| US15 | As a **user**, I want to **delete a shortened URL from my dashboard**, so that **I can remove links I no longer need**.                     | F6      | 🟢 Medium   |

### Acceptance Criteria (Key Stories)

#### US1 — Shorten a URL

```
GIVEN   I am on the QuickLink homepage
WHEN    I paste "https://www.example.com/very/long/path?query=value" into the input field
AND     I click the "Shorten" button
THEN    I should see a shortened URL like "https://quicklink.app/aB3dEf"
AND     the short URL should be displayed with Copy and QR options
AND     the URL should be saved to the database with a 7-day expiry
```

#### US2 — Track Click Count

```
GIVEN   I have created a short URL "https://quicklink.app/aB3dEf"
WHEN    5 different people click on the short URL
THEN    the click counter for that URL should show "5"
AND     the count should be visible on my dashboard
```

#### US7 — Custom Short Code

```
GIVEN   I am on the QuickLink homepage
WHEN    I paste a valid long URL
AND     I enter "my-brand" as a custom short code
AND     the code "my-brand" is available
THEN    I should receive "https://quicklink.app/my-brand" as my short URL

GIVEN   I enter a custom code that is already taken
THEN    I should see an error: "This custom code is already in use. Please try another."
```

---

## 5. 📊 Success Metrics

### 5.1 Key Performance Indicators (KPIs)

| KPI                           | Target (Month 1)    | Target (Month 3)    | Measurement Tool            |
| ----------------------------- | -------------------- | -------------------- | --------------------------- |
| 🔗 Total URLs Created         | 5,000                | 25,000               | Database analytics          |
| 👆 Total Clicks (Redirects)   | 50,000               | 500,000              | Click tracking system       |
| 👥 Unique Visitors            | 2,000                | 10,000               | Google Analytics / Cloud Monitoring |
| 📱 Mobile Usage Rate          | > 40%                | > 50%                | Analytics device breakdown  |
| ⏱️ Avg. Page Load Time        | < 2 seconds          | < 1.5 seconds        | Lighthouse / RUM            |
| 🟢 Uptime                     | 99.9%                | 99.9%                | Cloud Monitoring            |
| 🎯 QR Code Downloads          | 1,000                | 5,000                | Event tracking              |
| 📋 Clipboard Copy Actions     | 4,000                | 20,000               | Event tracking              |
| 🔁 Returning Visitors         | > 20%                | > 35%                | Analytics                   |
| ⚠️ Error Rate (4xx/5xx)       | < 1%                 | < 0.5%               | Cloud Monitoring            |

### 5.2 Definition of Success

The project will be considered **successful** if:

1. ✅ All 9 core features are implemented and functional
2. ✅ Page load time is consistently under 2 seconds
3. ✅ System maintains 99.9% uptime over the first month
4. ✅ At least 5,000 URLs are created in the first month
5. ✅ User feedback score averages ≥ 4.0/5.0
6. ✅ Zero critical security vulnerabilities in production
7. ✅ Mobile responsiveness passes Google's Mobile-Friendly Test

### 5.3 Monitoring & Alerting

| Event                     | Alert Channel        | Threshold                    |
| ------------------------- | -------------------- | ---------------------------- |
| Uptime drops below 99.9%  | Email + Slack        | Immediate                    |
| Error rate exceeds 2%     | Email + Slack        | Within 5 minutes             |
| Response time > 3 seconds | Email                | Sustained for 10+ minutes    |
| Database storage > 80%    | Email                | Daily check                  |
| Rate limit breaches       | Logging              | Per occurrence               |

---

## 6. 📅 Project Timeline

### Overview

| Phase   | Focus                        | Duration   | Dates (Estimated)       |
| ------- | ---------------------------- | ---------- | ----------------------- |
| Phase 1 | Setup & Basic Features       | Week 1     | Aug 11 – Aug 17, 2026   |
| Phase 2 | Advanced Features            | Week 2     | Aug 18 – Aug 24, 2026   |
| Phase 3 | Testing & Deployment         | Week 3     | Aug 25 – Aug 31, 2026   |

---

### 🔷 Phase 1 — Setup & Basic Features (Week 1)

| Day       | Task                                                             | Deliverable                       |
| --------- | ---------------------------------------------------------------- | --------------------------------- |
| Day 1     | Project scaffolding, repository setup, CI/CD pipeline            | Git repo, folder structure        |
| Day 2     | Database schema design, MongoDB connection setup                 | Models, DB connection             |
| Day 3     | Backend API: URL shortening endpoint (`POST /api/shorten`)       | Working API endpoint              |
| Day 4     | Backend API: Redirect endpoint (`GET /:code`) with click tracking | Redirect + click counter         |
| Day 5     | Frontend: Homepage UI — input field, shorten button, result display | Responsive homepage              |
| Day 6     | URL validation (client-side + server-side)                       | Validated input pipeline          |
| Day 7     | Copy to clipboard functionality, integration testing             | End-to-end basic flow working     |

**Phase 1 Exit Criteria:**
- ✅ User can shorten a URL and receive a working short link
- ✅ Short link redirects to the original URL
- ✅ Click count is tracked
- ✅ Copy to clipboard works
- ✅ URL validation is in place

---

### 🔷 Phase 2 — Advanced Features (Week 2)

| Day       | Task                                                             | Deliverable                       |
| --------- | ---------------------------------------------------------------- | --------------------------------- |
| Day 8     | QR code generation (client-side library integration)             | QR code display + download        |
| Day 9     | URL expiry system: `expires_at` field, expiry check middleware   | Auto-expiry logic                 |
| Day 10    | User dashboard: frontend UI (table, stats, search)               | Dashboard page                    |
| Day 11    | User dashboard: backend API (`GET /api/urls`, session handling)  | Dashboard data API                |
| Day 12    | Custom short code: input field, validation, availability check   | Custom alias feature              |
| Day 13    | Expired link page, rate limiting middleware, security headers     | Security + UX polish              |
| Day 14    | Mobile responsiveness pass, cross-browser testing                | Fully responsive app              |

**Phase 2 Exit Criteria:**
- ✅ QR codes generate and download correctly
- ✅ URLs expire after 7 days
- ✅ Dashboard displays all session URLs with stats
- ✅ Custom short codes work with validation
- ✅ Rate limiting is active
- ✅ App is fully responsive

---

### 🔷 Phase 3 — Testing & Deployment (Week 3)

| Day       | Task                                                             | Deliverable                       |
| --------- | ---------------------------------------------------------------- | --------------------------------- |
| Day 15    | Unit testing: API endpoints, validation logic                    | Test suite (Jest/Mocha)           |
| Day 16    | Integration testing: end-to-end flows                            | E2E test results                  |
| Day 17    | Performance testing: load testing with k6/Artillery              | Performance report                |
| Day 18    | Security audit: dependency scan, OWASP checklist                 | Security report                   |
| Day 19    | Dockerize application, Cloud Run configuration                   | Dockerfile, cloud config          |
| Day 20    | Deploy to Google Cloud Run, DNS setup, SSL verification          | Live production URL               |
| Day 21    | Monitoring setup, documentation, handoff                         | Monitoring dashboards, README     |

**Phase 3 Exit Criteria:**
- ✅ All tests pass with > 80% code coverage
- ✅ No critical or high-severity security vulnerabilities
- ✅ Application deployed and accessible on Cloud Run
- ✅ Monitoring and alerting configured
- ✅ Documentation complete

---

## 7. 🛠️ Tech Stack Overview

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │   HTML5    │  │   CSS3     │  │     JavaScript (ES6+)  │  │
│  └────────────┘  └────────────┘  └────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Google Cloud Run                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Node.js + Express.js Server               │  │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────────┐ │  │
│  │  │  Routes  │ │Middleware │ │    Controllers        │ │  │
│  │  └──────────┘ └───────────┘ └───────────────────────┘ │  │
│  └───────────────────────┬────────────────────────────────┘  │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                             │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  urls collection │  │  clicks / analytics collection  │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Technology Breakdown

| Layer          | Technology            | Purpose                                           |
| -------------- | --------------------- | ------------------------------------------------- |
| **Frontend**   | HTML5                 | Semantic page structure                           |
|                | CSS3                  | Styling, animations, responsive design            |
|                | JavaScript (ES6+)     | Client-side interactivity, API calls, QR generation |
| **Backend**    | Node.js (v18+ LTS)    | Runtime environment                               |
|                | Express.js            | Web framework, routing, middleware                |
| **Database**   | MongoDB (Atlas)       | NoSQL document storage for URLs and analytics     |
|                | Mongoose              | ODM for schema validation and queries             |
| **Hosting**    | Google Cloud Run      | Serverless container deployment with auto-scaling  |
| **Platform**   | Google Antigravity    | Development platform and tooling                  |
| **Dev Tools**  | Git + GitHub          | Version control and collaboration                 |
|                | Docker                | Containerization for consistent deployments       |
|                | Jest / Mocha          | Unit and integration testing                      |
|                | ESLint + Prettier     | Code quality and formatting                       |

### Key Libraries & Dependencies

| Package              | Version   | Purpose                                    |
| -------------------- | --------- | ------------------------------------------ |
| `express`            | ^4.x      | Web framework                              |
| `mongoose`           | ^7.x      | MongoDB ODM                                |
| `nanoid`             | ^5.x      | Short unique ID generation                 |
| `valid-url`          | ^1.x      | URL format validation                      |
| `qrcode`             | ^1.x      | QR code generation (client or server)      |
| `helmet`             | ^7.x      | Security headers                           |
| `express-rate-limit`  | ^7.x      | Rate limiting middleware                   |
| `cors`               | ^2.x      | Cross-Origin Resource Sharing              |
| `dotenv`             | ^16.x     | Environment variable management            |
| `morgan`             | ^1.x      | HTTP request logging                       |

### Database Schema (MongoDB)

```javascript
// URL Document Schema
{
  _id: ObjectId,
  originalUrl: String,       // The original long URL
  shortCode: String,         // The unique short code (indexed, unique)
  customCode: Boolean,       // Whether this was a user-defined code
  clickCount: Number,        // Total number of clicks (default: 0)
  createdAt: Date,           // Timestamp of creation
  expiresAt: Date,           // Expiry date (createdAt + 7 days)
  isActive: Boolean,         // Whether the link is still active
  sessionId: String          // Browser session identifier
}
```

### API Endpoints

| Method | Endpoint              | Description                             | Rate Limit         |
| ------ | --------------------- | --------------------------------------- | ------------------- |
| POST   | `/api/shorten`        | Create a new short URL                  | 30 req/hr per IP    |
| GET    | `/api/urls`           | Get all URLs for a session              | 60 req/hr per IP    |
| GET    | `/api/urls/:code`     | Get details for a specific short URL    | 120 req/hr per IP   |
| DELETE | `/api/urls/:code`     | Delete a short URL                      | 30 req/hr per IP    |
| GET    | `/:code`              | Redirect to original URL (public)       | 100 req/min per IP  |
| GET    | `/health`             | Health check endpoint                   | Unlimited           |

---

## 📎 Appendix

### A. Glossary

| Term            | Definition                                                         |
| --------------- | ------------------------------------------------------------------ |
| Short Code      | The unique alphanumeric string appended to the base URL            |
| Redirect        | The process of forwarding a user from a short URL to the original  |
| TTL             | Time-to-Live — the duration before a link expires                  |
| Rate Limiting   | Restricting the number of requests a user can make in a time window |
| QR Code         | Quick Response code — a scannable barcode encoding a URL           |

### B. Risks & Mitigations

| Risk                                 | Probability | Impact | Mitigation                                                    |
| ------------------------------------ | ----------- | ------ | ------------------------------------------------------------- |
| Abuse (spam/phishing links)          | High        | High   | Rate limiting, URL deny-list, input validation                |
| Database overload                    | Medium      | High   | Auto-expiry cleanup, indexing, connection pooling             |
| Short code collision                 | Low         | Medium | Use nanoid with sufficient length (8 chars = 2.8T combinations) |
| Cloud Run cold start latency         | Medium      | Low    | Minimum instance count = 1, keep-alive pings                  |
| Third-party library vulnerabilities  | Medium      | Medium | Dependabot alerts, regular `npm audit`, lock file             |

### C. Future Enhancements (v2.0 Candidates)

- 🔐 User authentication and persistent accounts
- 🌐 Custom domain support
- 📊 Advanced analytics (geography, devices, referrers, time-series charts)
- 🔌 REST API with API keys for developer access
- 📦 Bulk URL shortening (CSV upload)
- 🧩 Browser extension for one-click shortening
- 🏷️ Link tagging and categorization
- 📧 Email notifications before link expiry

---

> **Document Status:** This PRD is a living document and will be updated as the project evolves. All stakeholders should review and provide feedback before development begins.

---

*© 2026 QuickLink — Built with ❤️ on Google Antigravity*
