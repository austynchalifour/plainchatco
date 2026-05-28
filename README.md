# PlainChat — Social Scheduling Platform

A full-stack social media scheduling platform built with Node.js, Express, MySQL, and React.

## Features

- **Post Composer** — Write posts with media, hashtags, and character counter
- **Smart Scheduler** — Schedule posts to any date/time; auto-published by background cron
- **Post Queue** — Manage all drafts, scheduled, and published posts in one place
- **Calendar View** — Visual monthly calendar of your scheduled content
- **Analytics** — Post activity charts, platform breakdown, engagement stats
- **Multi-Account** — Connect Twitter/X, Instagram, Facebook, LinkedIn, TikTok, YouTube
- **User Profiles** — Avatar, timezone, notification preferences

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Node.js, Express                  |
| Database  | MySQL 8+                          |
| Scheduler | node-cron (runs every minute)     |
| Auth      | JWT (jsonwebtoken + bcryptjs)     |
| Frontend  | React 18 + Vite                   |
| Styling   | Tailwind CSS                      |
| Charts    | Recharts                          |
| Icons     | Lucide React                      |

## Project Structure

```
Social Scheduling Tool/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & setup script
│   │   ├── controllers/     # Auth, posts, accounts, analytics
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── routes/          # Express route definitions
│   │   ├── app.js           # Express app
│   │   └── server.js        # Entry point + cron scheduler
│   ├── schema.sql           # Database schema
│   ├── .env.example         # Environment variables template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance
    │   ├── components/      # Reusable UI components
    │   ├── context/         # Auth context
    │   └── pages/           # All page components
    ├── index.html
    └── package.json
```

## Setup

### 1. MySQL Database

Make sure MySQL is running, then:

```bash
# Copy and edit environment variables
cd backend
copy .env.example .env
# Edit .env with your DB credentials

# Install dependencies
npm install

# Create the database + tables
npm run db:setup
```

### 2. Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Open in browser

Visit [http://localhost:5173](http://localhost:5173) and register your first account.

## Environment Variables (backend/.env)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=plainchat
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

## API Endpoints

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | /api/auth/register          | Register new user         |
| POST   | /api/auth/login             | Login                     |
| GET    | /api/auth/me                | Get current user          |
| PUT    | /api/auth/profile           | Update profile            |
| PUT    | /api/auth/password          | Change password           |
| GET    | /api/posts                  | List posts (paginated)    |
| POST   | /api/posts                  | Create post               |
| PUT    | /api/posts/:id              | Update post               |
| DELETE | /api/posts/:id              | Delete post               |
| POST   | /api/posts/:id/publish      | Publish immediately       |
| POST   | /api/posts/:id/duplicate    | Duplicate as draft        |
| GET    | /api/posts/calendar         | Calendar view posts       |
| GET    | /api/accounts               | List social accounts      |
| POST   | /api/accounts/connect       | Connect account           |
| DELETE | /api/accounts/:id           | Disconnect account        |
| GET    | /api/analytics/dashboard    | Dashboard stats           |
| GET    | /api/analytics/platforms    | Per-platform stats        |
| GET    | /api/analytics/engagement   | Engagement totals         |
