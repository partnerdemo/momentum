# ⚙️ Momentum — Core API Service (`momentum-api`)

This is the central backend API service for the Momentum platform. It governs database models, user authentication, security, co-parenting synchronization, task completions, and websocket-assisted live updates.

---

## 🛠️ Tech Stack & Dependencies
*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js with TypeScript
*   **Database:** MongoDB via Mongoose ODM
*   **Real-time:** Socket.IO
*   **Auth:** Google OAuth2 Client & JSON Web Tokens (JWT)

---

## ⚙️ Environment Configuration

To run the API service, create a `.env` file in the root of this folder (`momentum-api/.env`).

```ini
# Server Configurations
PORT=3001
NODE_ENV=development

# Database Connectivity
MONGO_URI=mongodb://localhost:27017/momentum

# Security Keys
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🏃 Local Setup & Development

First, ensure your local MongoDB daemon is running:
```bash
# Start MongoDB locally (Mac/Linux)
brew services start mongodb-community
# Or via Windows Services manager or Docker:
docker run -d -p 27017:27017 --name local-mongo mongo:latest
```

Then, run commands from this directory or via the monorepo root:

### From the Service Directory (`momentum-api/`):
```bash
# Install specific local dependencies
npm install

# Run backend service in watch/development mode
npm run dev

# Compile TypeScript production builds
npm run build

# Start compiled production code
npm start
```

### From the Monorepo Root Directory:
```bash
npm run dev:api
```

---

## 📂 Internal Directory Structure

```
src/
├── config/             # Database connection setups
├── controllers/        # Express handlers (auth, tasks, households, quests)
├── middleware/         # Auth checkers, request validators, error handlers
├── models/             # Mongoose schemas (FamilyMember, Household, Task, etc.)
├── routes/             # Express routing mapping paths to controllers
├── services/           # Points, notifications, and transactions services
├── utils/              # Token signatures, websocket helpers, errors
└── server.ts           # App bootstrapper & Express/Socket.IO bootstrap
```

---

## 🧪 Database Utilities & Maintenance Scripts

These commands operate against whatever `MONGO_URI` your `.env` points at — make sure you're not pointed at production when running destructive scripts.

```bash
# Inspect — non-destructive
npm run db:check               # show user/household counts and recent records
npm run pin:check              # report PIN hash presence per profile
npm run pin:debug              # verbose PIN verification trace

# Maintenance — destructive
npm run db:clean-links         # remove orphaned HouseholdLink documents
npx tsx src/scripts/resetUser.ts [email]   # wipe ONE user + their entire household
npm run db:clear               # ⚠️ wipe the entire database (alias of resetDb)
npx tsx src/scripts/resetDb.ts             # ⚠️ wipe entire DB explicitly
```

**`resetUser.ts` default target** is `anthony.ha2120@gmail.com` if no email is passed.

Endpoints can be tested locally with Postman/Bruno/curl at `http://localhost:3001/api/v1/`. WebSocket event reference: [`docs/architecture/WEBSOCKET.md`](../docs/architecture/WEBSOCKET.md).
