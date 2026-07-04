# 🛡️ Momentum — Mobile Backend-For-Frontend Gateway (`momentum-mobile-bff`)

The Backend-For-Frontend (BFF) is the dedicated gateway serving the **Momentum Mobile** application. It acts as an aggregation proxy, consolidating multiple upstream API calls into a single response payload to reduce latency and battery usage on mobile clients. It also acts as the gatekeeper for rate limiting and WebSocket proxying.

---

## 🛠️ Tech Stack & Dependencies
*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js with TypeScript
*   **Real-time:** Socket.IO Client (upstream) and Socket.IO Server (downstream client connections)
*   **APIs:** Native fetch-based routing proxy forwarding to `momentum-api`

---

## ⚙️ Environment Configuration

To run the BFF gateway, create a `.env` file in the root of this folder (`momentum-mobile-bff/.env`):

```ini
# Gateway Server Settings
PORT=3002
NODE_ENV=development

# Upstream Core API Service
API_BASE_URL=http://localhost:3001/api/v1
```

---

## 🏃 Local Setup & Development

Run commands from this directory or via the monorepo root:

### From the Service Directory (`momentum-mobile-bff/`):
```bash
# Install specific local dependencies
npm install

# Run the gateway in watch/development mode
npm run dev

# Compile TypeScript production builds
npm run build

# Start compiled production gateway
npm start
```

### From the Monorepo Root Directory:
```bash
npm run dev:bff
```

---

## 📂 Key Architecture Design

### 1. Dashboard Aggregation (`src/routes/dashboard.ts`)
Instead of forcing mobile devices to fire 8 separate HTTP queries upon loading the application, the BFF intercepts the call and runs them concurrently:
1.  `/households/current`
2.  `/tasks/assigned`
3.  `/tasks/approvals`
4.  `/quests/active`
5.  `/routines`
6.  `/wishlist`
7.  `/meal-planner/current`
8.  `/streaks/status`

It parses the combined results and returns a unified state object.

### 2. WebSocket Proxying (`src/socket.ts`)
The BFF manages user-specific Socket.IO rooms downstream, while holding a unified client socket upstream linked directly to `momentum-api`. This prevents duplicate connections and allows granular control of real-time update push frequencies to physical mobile phones.

---

## 🧪 Testing & Verification
Verify build compilations and test responses using:
```bash
# Verify type consistency
npm run build
```
For deep gateway configuration specifics, consult the [BFF Migration Blueprint](file:///c:/Users/antho/OneDrive/Desktop/Momentum/.agent/MOBILE_BFF_COMPLETE.md).
