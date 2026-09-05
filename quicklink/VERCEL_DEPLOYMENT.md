# 🚀 QuickLink Vercel Deployment Guide

This repository is pre-configured for one-click serverless deployment on **Vercel**.

---

## 🛠️ Step 1: Push to GitHub

Ensure your latest code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: configure Vercel deployment & serverless support"
git push origin main
```

---

## 🌐 Step 2: Import Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Import your GitHub repository: `anuj-cs16/URL-Shortener`.
3. In **Framework Preset**, select **Other** (or **Create React App**).
4. If asked for **Root Directory**, select `quicklink` (or leave default `/` since root `vercel.json` is provided).

---

## 🔑 Step 3: Configure Environment Variables

In the Vercel **Environment Variables** section, add the following variables:

| Variable Name | Description | Example Value |
|---|---|---|
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/quicklink?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT auth | `super_secret_jwt_key_quicklink_2026` |
| `BASE_URL` | Your live Vercel domain | `https://your-app-name.vercel.app` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini Model identifier | `gemini-2.5-flash` |
| `NODE_ENV` | Environment mode | `production` |

> [!IMPORTANT]
> Make sure your MongoDB Atlas Cluster IP Access List includes `0.0.0.0/0` (Allow Access from Anywhere) so Vercel serverless functions can connect.

---

## 🚀 Step 4: Deploy!

Click **Deploy**. Vercel will:
1. Build the Node.js backend serverless handler (`api/index.js`).
2. Build the React frontend production bundle (`client/build`).
3. Deploy the live URL!

Your QuickLink Shortener is live on Vercel with AI Features, URL Shortening, Analytics, and Team Workspaces! 🎉
