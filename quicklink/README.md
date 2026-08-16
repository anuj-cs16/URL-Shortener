# 🔗 QuickLink — URL Shortener

QuickLink is a modern, full-stack URL Shortener web application built with **React** and **Node.js**. It transforms long, unmanageable URLs into short, shareable links — complete with QR codes, click analytics, custom aliases, email notifications, and automatic link expiry.

---

## ✨ Features

### Core
- **Paste Long URL → Get Short URL:** Instantly shorten any valid HTTP/HTTPS link
- **Custom Short Codes:** Choose your own memorable aliases (e.g., `quicklink.app/my-brand`)
- **QR Code Generation:** Generate downloadable QR codes for offline-to-online sharing
- **Click Tracking & Analytics:** Record total views, device breakdown, browser stats, and geographic data
- **URL Expiry (7 Days):** Links automatically expire after 7 days with friendly expiry pages

### User Experience
- **User Authentication:** Secure signup/login with JWT tokens
- **Dashboard:** Manage all your shortened URLs with stats, search, and filtering
- **Analytics Pages:** Detailed per-URL analytics with Chart.js visualizations
- **Copy to Clipboard:** One-click clipboard copying with visual feedback
- **Mobile Responsive:** Premium dark glassmorphism UI optimized for all devices

### Advanced
- **Email Notifications:** Configurable alerts for URL creation, click milestones, weekly reports, and security events
- **Rate Limiting:** Built-in abuse prevention with Express rate limiters
- **Security Headers:** Helmet.js for secure HTTP headers and CSP
- **Scheduled Jobs:** Cron-based weekly reports, expiry warnings, and cleanup routines

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, React Router 7, Framer Motion, Chart.js | Modern SPA with animations and data visualization |
| **Backend** | Node.js, Express 5 | REST API server |
| **Database** | MongoDB, Mongoose | Document storage with TTL indexes |
| **Auth** | JWT, bcryptjs | Secure authentication |
| **Email** | Nodemailer, Handlebars | Templated email notifications |
| **Testing** | Jest, Supertest | Unit and integration testing |
| **DevOps** | Docker, Cloud Run | Containerized deployment |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (local instance or Atlas cluster)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/quicklink.git
cd quicklink
```

### 2. Install dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/quicklink
BASE_URL=http://localhost:8080
NODE_ENV=development

# JWT Settings
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Email (Optional — app works without it)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=QuickLink <your_email@gmail.com>
```

---

## 💻 Running Locally

### Development Mode (with hot-reload)
```bash
# Terminal 1: Start backend (port 8080)
npm run dev

# Terminal 2: Start React dev server (port 3000, proxied to 8080)
cd client && npm start
```

### Production Mode (single server)
```bash
# Build React client
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

Open [http://localhost:8080](http://localhost:8080) to access the app.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| `POST` | `/api/shorten` | Create a short URL | ✅ | 30/hr |
| `GET` | `/api/urls` | List user's URLs | ✅ | 60/hr |
| `GET` | `/api/urls/:code` | Get URL details | ✅ | 120/hr |
| `GET` | `/api/urls/:code/qr` | Generate QR code | ✅ | 120/hr |
| `DELETE` | `/api/urls/:code` | Delete a URL | ✅ | 30/hr |
| `GET` | `/:code` | Redirect to original | ❌ | 100/min |
| `GET` | `/api/health` | Health check | ❌ | Unlimited |
| `POST` | `/api/auth/register` | Register user | ❌ | 10/hr |
| `POST` | `/api/auth/login` | Login | ❌ | 20/hr |
| `GET` | `/api/analytics/dashboard` | Dashboard stats | ✅ | 60/hr |
| `GET` | `/api/analytics/url/:code` | Per-URL analytics | ✅ | 60/hr |
| `GET` | `/api/notifications` | List notifications | ✅ | 60/hr |

---

## 🧪 Running Tests

```bash
npm test
```

Tests run against a dedicated test database and include:
- URL shortening and redirection flows
- User authentication and authorization
- Analytics data aggregation
- Notification CRUD operations

---

## 🐳 Docker Deployment

### Build and run locally
```bash
# Build the multi-stage Docker image
docker build -t quicklink-app .

# Run the container
docker run -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/quicklink \
  -e JWT_SECRET=your_secret \
  -e NODE_ENV=production \
  quicklink-app
```

### Deploy to Google Cloud Run
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/quicklink

# Deploy to Cloud Run
gcloud run deploy quicklink \
  --image gcr.io/PROJECT_ID/quicklink \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets MONGO_URI=mongo-uri:latest,JWT_SECRET=jwt-secret:latest
```

---

## 📁 Project Structure

```
quicklink/
├── client/                 # React frontend (CRA)
│   ├── public/             # Static assets & HTML template
│   ├── src/
│   │   ├── api/            # Axios API clients
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context provider
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route page components
│   │   └── styles/         # Global CSS & variables
│   └── build/              # Production build output
├── config/                 # Database configuration
├── controllers/            # Express route handlers
├── middleware/             # Auth, validation, rate limiting, errors
├── models/                 # Mongoose schemas
├── routes/                 # Express route definitions
├── utils/                  # Helpers, email service, cron jobs
├── templates/              # Handlebars email templates
├── tests/                  # Jest test suites
├── public/                 # Static error pages (404, expired)
├── server.js               # Express app entry point
├── Dockerfile              # Multi-stage production container
└── package.json            # Backend dependencies
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

*© 2026 QuickLink — Built with ❤️*
