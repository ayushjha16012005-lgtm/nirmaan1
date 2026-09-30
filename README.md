<div align="center">

# 🏗️ NIRMAAN

### *Kaam Milega. Samman Milega.*
**Bharat ka Nirmaan, Nahi Rukega.**

A direct, fair marketplace that connects India's construction workers (*karigars*) with the people who need them — no middleman, full wages, transparent payments.

</div>

---

## 📖 About

Nirmaan is a construction-labour marketplace for India. Masons (*rajmistri*), electricians, plumbers, painters, tile-fitters and other skilled workers can find nearby jobs, while households and builders can hire verified karigars directly — without a *thekedar* taking a cut.

> *Logon se banta hai Bharat. Har Nirmaan mein ek behtar kal.*

### Why Nirmaan

- **Full wages for workers** — direct hiring, no middleman commission.
- **Savings for builders** — up to ~20% lower cost than the traditional contractor route.
- **Trust built in** — verified karigars, ratings & reviews, and escrow payments.
- **Built for Bharat** — multilingual (English / Hindi), voice-first, simple UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| ✅ **Verified Karigars** | Document-based verification of worker profiles |
| 🗺️ **Map-based Discovery** | Find karigars near you (distance, rating and service filters) using Leaflet maps |
| 📍 **Live Tracking** | Follow a karigar's journey — *Accepted → On the way → Arriving → Completed* |
| 💸 **Secure Payments (Escrow)** | Money is held safely and released on job completion |
| 💬 **In-app Support & Messages** | Chat between clients and workers |
| ⭐ **Ratings & Reviews** | Build reputation on both sides |
| 🛠️ **Wide Range of Services** | Mason, Electrician, Plumber, Painter, Tiles and more |
| 🎙️ **AI Saarthi** | Voice and text AI assistant (Gemini-powered) that can search workers, post jobs and manage bookings via tool-calling |
| 🏛️ **Govt. Schemes & Benefits** | Information on schemes relevant to construction workers |
| 🌐 **Multilingual & Theming** | i18n (EN/HI), light/dark themes |
| 🛡️ **Admin Panel** | Verification, moderation and audit logs |

---

## 📱 App Screens

| Karigar Splash | Karigar Home | User Home (Map) | Live Tracking |
|:---:|:---:|:---:|:---:|
| *Mehnat ka Samman. Har Din Nirmaan.* | *Zyada Kaam. Zyada Samman.* | *Sahi Log. Sahi Kaam. Sahi Jagah.* | *Bharosa Har Kadam Par.* |

> Add the design mockup at `docs/mockups.jpg` and reference it here:
> `![Nirmaan Screens](docs/mockups.jpg)`

---

## 🧰 Tech Stack

**Frontend**
- Vanilla JavaScript (ES modules) with a custom router, store, and component system
- [Vite](https://vitejs.dev/) — dev server & bundler
- [Leaflet](https://leafletjs.com/) — maps
- [Supabase JS](https://supabase.com/docs/reference/javascript) — auth & data
- [vanilla-tilt](https://micku7zu.github.io/vanilla-tilt.js/) — UI effects

**Backend** (`/backend`)
- Node.js + [Express](https://expressjs.com/) + TypeScript
- [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- JWT authentication, role-based permissions (`WORKER`, `CLIENT`, `ADMIN`)
- [Zod](https://zod.dev/) validation, Helmet, CORS, Morgan, rate limiting
- Google Gemini AI provider with a policy-guarded **tool layer** (workers, jobs, bookings, reviews, location, admin)
- [Vitest](https://vitest.dev/) + Supertest for testing

---

## 📁 Project Structure

```
Nirmaan/
├── index.html            # App entry point
├── package.json          # Frontend dependencies & scripts
├── core/                 # Router, store, i18n, theme, UI helpers, observer
├── components/           # Header, footer, bottom-nav, map, karigar-card
├── pages/                # Screens: splash, auth, onboarding, user-home,
│                         #   kaarigar-home, hire, track, projects, admin, ...
├── services/             # API, Supabase, escrow, tracking, voice clients
├── css/                  # styles, themes, animations
├── data/                 # constants & mock data
├── js/                   # Landing/dashboard pages, chatbot, dynamic pricing
│
└── backend/
    ├── prisma/           # schema.prisma & seed.ts
    ├── src/
    │   ├── api/routes/   # auth, workers, jobs, bookings, reviews,
    │   │                 #   location, notifications, admin, ai, tools, health
    │   ├── services/     # Business logic
    │   ├── repositories/ # Data access layer
    │   ├── auth/         # JWT, roles, permissions
    │   ├── middleware/   # auth, error-handler, rate-limit, request-id
    │   ├── ai/           # Gemini provider & assistant
    │   ├── tools/        # AI tool registry, manager & policy
    │   ├── voice/        # Voice & language handling
    │   └── config/       # Environment config
    └── tests/            # Security, concurrency, e2e & multilingual tests
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database
- A **Supabase** project (URL + anon key)
- *(Optional)* Gemini API key and a Maps API key for AI and geocoding

### 1. Clone & install

```bash
git clone <your-repo-url>
cd Nirmaan
cd nirmaan2
npm install
cd backend && npm install
```

### 2. Configure environment variables

**Frontend** — create `.env` in the project root:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://user:password@localhost:5432/nirmaan

JWT_SECRET=your-jwt-secret
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
MAPS_API_KEY=
```

> ⚠️ Never commit `.env` files or share your keys publicly.

### 3. Set up the database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed        # optional sample data
```

### 4. Run the app

```bash
# Backend (from /backend)
npm run dev

# Frontend (from project root, in a new terminal)
npm run dev
```

The frontend runs on **http://localhost:5173** by default.

### Netlify deployment

The repository-root `netlify.toml` configures Netlify to run `npm ci --include=dev` before the frontend build inside `nirmaan2`, then publish its `dist` directory. This explicit installation uses the committed lockfile and makes Vite available even when deployment is invoked through the Netlify CLI without a separate dependency-install step. Deploy the repository rather than the repository root as a static folder; the root does not contain the app's `index.html`.

The welcome screen and existing self-contained demo screens remain accessible. Routes that depend on missing API, voice, tracking, escrow, or hiring source show an explicit unavailable notice instead of preventing deployment or failing at runtime. Their original page files remain in the repository for future restoration. The Express backends are not deployed by this frontend configuration, and the existing demo login is not production authentication.

Navigation uses hash URLs (for example, `/#/projects`), so it does not need a catch-all server redirect.

---

## 📜 Available Scripts

**Frontend (root)**

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

**Backend (`/backend`)**

| Command | Description |
|---|---|
| `npm run dev` | Start API with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm test` | Run test suite |
| `npm run test:watch` | Tests in watch mode |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run DB migrations |
| `npm run prisma:seed` | Seed the database |

---

## 🔌 API Overview

Base URL: `/api/v1`

| Route | Purpose |
|---|---|
| `/auth` | Sign-up, login, session |
| `/workers` | Worker profiles, documents, availability |
| `/jobs` | Post, browse, apply to jobs |
| `/bookings` | Booking lifecycle |
| `/reviews` | Ratings & reviews |
| `/location` | Geocoding & nearby search |
| `/notifications` | User notifications |
| `/ai` | AI Saarthi assistant |
| `/tools` | Policy-guarded AI tool execution |
| `/admin` | Verification, moderation, audit |
| `/health` | Health check |

**Booking lifecycle:** `REQUESTED → ACCEPTED → CONFIRMED → WORKER_ON_WAY → ARRIVED → IN_PROGRESS → COMPLETED` (or `REJECTED` / cancelled)

**Job lifecycle:** `OPEN → ASSIGNED → IN_PROGRESS → COMPLETED` (or `CANCELLED` / `DISPUTED`)

---

## 🧪 Testing

```bash
cd backend
npm test
```

The suite covers authentication & authorization security, AI/tool policy security, storage security, booking concurrency, HTTP integration, end-to-end user journeys, and multilingual behaviour.

---

## 🔐 Security Notes

- JWT-based auth with role-based access control
- Helmet, CORS and rate limiting enabled
- Input validation via Zod
- AI tool calls pass through a permission policy layer
- Audit logging for sensitive actions
- Keep `.env` out of version control (already in `.gitignore`)

---

## 🗺️ Roadmap

- [ ] Native mobile apps (Android / iOS)
- [ ] Payments gateway integration for escrow
- [ ] More regional languages
- [ ] Govt. scheme eligibility checker
- [ ] Offline-friendly mode for low-connectivity areas

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push and open a Pull Request

---

## 📄 License

ISC © Nirmaan India

---

<div align="center">

*Milkar Banayenge Behtar Bharat.* 🇮🇳

</div>
