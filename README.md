# PCLU-OptimaSched

A clash-free academic class-scheduling system for **PCLU**. Build a weekly timetable
of course sections across rooms and instructors, and let the engine catch every
double-booking before it ever reaches the printed schedule — then suggest the next
open slot automatically.

Built as a clean **MVC** Express application with server-rendered **EJS** views,
a **PostgreSQL** data layer, session-based **authentication**, and **Axios** used
server-side to pull public-holiday data onto the dashboard.

---

## Why it exists

Most scheduling tools tell you about a conflict *after* you've saved it. OptimaSched
flips that: every block is validated against the live timetable the moment you try
to place it. A block clashes when another block shares the **same room, the same
section, or the same instructor** and their times overlap. When that happens, the
app explains exactly what it collided with and offers the next clash-free windows
for that section and room as one-click suggestions.

---

## Tech stack

| Layer            | Choice                                                            |
|------------------|-------------------------------------------------------------------|
| Server           | Node.js + Express                                                 |
| Views            | EJS + `express-ejs-layouts`                                        |
| Database         | PostgreSQL (via `pg`)                                              |
| Auth & sessions  | `express-session` + `connect-pg-simple` (sessions stored in PG), `bcryptjs` |
| HTTP client      | Axios (server-side holiday lookup)                                 |
| Validation       | `express-validator`                                               |
| REST verbs       | `method-override` (PUT/DELETE from HTML forms)                    |
| Styling          | Hand-written CSS design system (no framework)                     |

---

## Project structure (MVC)

```
PCLU-OptimaSched/
├── server.js                 # app entry — middleware, sessions, route mounting
├── config/
│   └── db.js                 # pg Pool + query helpers
├── database/
│   ├── schema.sql            # tables, constraints, indexes
│   ├── seed.sql              # sample departments, rooms, instructors, courses
│   └── init.js               # runs schema, creates default admin, optional --seed
├── models/                   # one module per table — all SQL lives here
│   ├── userModel.js  departmentModel.js  instructorModel.js
│   ├── roomModel.js  courseModel.js      sectionModel.js
│   └── scheduleModel.js      # includes findConflicts() overlap query
├── services/                 # business logic, framework-agnostic
│   ├── conflictService.js    # classify() + suggestSlots()
│   └── holidayService.js     # Axios → Nager.Date, cached
├── controllers/              # request handlers, thin — call models/services
├── routes/                   # Express routers, one per resource
├── middleware/               # auth guards + error handlers
├── views/                    # EJS templates (+ partials, layout)
└── public/
    ├── css/style.css         # design system
    └── js/main.js            # AJAX conflict-check + suggestion chips
```

---

## Getting started

### Prerequisites
- Node.js 18+ (tested on Node 22)
- PostgreSQL 13+ running locally

### 1. Install dependencies
```bash
npm install
```

### 2. Create the database
```bash
createdb pclu_optimasched
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set a real `SESSION_SECRET`, plus your Postgres connection
(`DATABASE_URL` *or* the individual `PG*` values). `HOLIDAY_COUNTRY` defaults to `PH`.

### 4. Initialise schema + sample data
```bash
npm run db:seed     # schema + default admin + sample departments/rooms/courses
```
Use `npm run db:init` instead if you want the schema and admin user **without**
sample data.

### 5. Run
```bash
npm run dev         # nodemon, auto-reload
# or
npm start
```
Open **http://localhost:3000**.

---

## Default login

After `db:init` / `db:seed`:

```
Email:    admin@pclu.edu.ph
Password: OptimaSched@2025
```

> The **first** user to register on a fresh database automatically becomes an
> admin. Created the default admin via the script? Just log in with the
> credentials above. Roles available: **admin**, **scheduler**, **viewer**.

---

## How conflict detection works

1. You fill in section, room, day and time on the schedule form.
2. **Check for conflicts** posts to `POST /schedules/check`, which runs
   `conflictService.classify()`. Two blocks overlap when
   `existing.start < candidate.end AND existing.end > candidate.start` *and* they
   share a room, section, or instructor.
3. If it's clear, you get a green all-clear. If not, you get the specific reasons
   plus suggested open slots from `suggestSlots()`, which scans 07:00–19:00 in
   30-minute steps Monday–Saturday for the first windows with no clash.
4. The same validation runs again on save, so the API is safe even with JS off.

Days are stored as `1 = Monday … 7 = Sunday`. The timetable grid renders
Monday–Saturday, 07:00–19:00.

---

## Notes

- Sessions are stored in PostgreSQL (the `session` table), so logins survive restarts.
- The holiday widget degrades gracefully — if the Nager.Date API is unreachable,
  the dashboard simply shows no upcoming holidays rather than erroring.
- Passwords are hashed with `bcryptjs` (pure JS, no native build step).
