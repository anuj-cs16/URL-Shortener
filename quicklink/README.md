# 🔗 QuickLink — URL Shortener

QuickLink is a modern, fast, and reliable URL Shortener web application. It transforms long, unmanageable URLs into short, shareable links. The application comes equipped with client-side downloadable QR codes, click tracking, custom aliases, and automatic links expiry.

---

## ✨ Features

*   **Paste Long URL → Get Short URL:** Instantly shorten any valid HTTP/HTTPS link.
*   **Custom Short Codes:** Choose your own memorable aliases (e.g. `quicklink.app/my-brand`).
*   **QR Code Generation:** Generate downloadable QR codes for offline-to-online link sharing.
*   **Click Tracking & Count:** Record total views and redirection metrics.
*   **Copy to Clipboard:** Simple one-click clipboard copying.
*   **URL Expiry:** Temporary link persistence. Links expire automatically after 7 days.
*   **Dashboard History:** Session-based visual history table tracking your links.
*   **Mobile Responsive:** Fully responsive glassmorphism UI designed for mobile, tablet, and desktop viewports.
*   **Security Built-in:** Express rate limit protections, secure HTTP headers, and input validators.

---

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3 (Vanilla CSS variables), JavaScript (ES6, Fetch API)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose ODM
*   **Libraries:** `qrcode`, `nanoid`, `helmet`, `cors`, `express-rate-limit`, `valid-url`, `dotenv`
*   **Testing:** Jest, Supertest

---

## 📋 Prerequisites

Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/) (v16.x or newer recommended)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on default port 27017 or a MongoDB Atlas cluster URI)

---

## 🚀 Installation & Setup

1.  **Clone or navigate to the project directory:**
    ```bash
    cd quicklink
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Configuration:**
    Copy the template variables file into a local `.env` configuration file:
    ```bash
    cp .env.example .env
    ```
    Open the newly created `.env` file and populate your connection parameters:
    ```env
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/quicklink
    BASE_URL=http://localhost:5000
    NODE_ENV=development
    ```

---

## 💻 Running Locally

To run the application locally in development mode (with auto-restart support via nodemon):
```bash
npm run dev
```

The application will launch and connect to the database. Open [http://localhost:5000](http://localhost:5000) in your web browser to access the dashboard.

To launch the server in standard production mode:
```bash
npm start
```

---

## 🔌 API Documentation

| Method | Endpoint | Description | Request Body | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/shorten` | Shorten a long URL | `{ "longUrl": "...", "customCode": "..." }` | `201`, `400` |
| **GET** | `/api/urls` | Retrieve all URLs | None | `200` |
| **GET** | `/api/urls/:shortCode` | Retrieve click statistics | None | `200`, `404` |
| **DELETE** | `/api/urls/:shortCode` | Delete shortened link | None | `200`, `404` |
| **GET** | `/:shortCode` | Redirection to long URL | None | `301`, `404`, `410` |
| **GET** | `/api/health` | Service health status | None | `200` |

---

## 🧪 Running Tests

A comprehensive suite of integration and validation tests is available using Jest and Supertest.

To execute the tests:
```bash
npm test
```

Tests run sequentially against a dedicated test database (`mongodb://127.0.0.1:27017/quicklink_test`) and exit cleanly when completed.

---

## ☁️ Deployment Instructions

The application is containerized and ready for cloud deployment (e.g. to Google Cloud Run).

### Build and Run Docker Container Locally
1.  **Build the Docker image:**
    ```bash
    docker build -t quicklink-app .
    ```
2.  **Run the container:**
    ```bash
    docker run -p 5000:5000 --env-file .env quicklink-app
    ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
