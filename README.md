# Latra

A full-stack task management application built with **Next.js** and **NestJS**, featuring a Trello-style **Board → List → Card** workflow with user authentication and drag-and-drop support.

---

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | [Next.js 16](https://nextjs.org/) + React 19 + Tailwind CSS |
| Backend    | [NestJS 11](https://nestjs.com/)                             |
| ORM        | [Prisma 7](https://www.prisma.io/)                           |
| Database   | PostgreSQL                                                   |
| Language   | TypeScript                                                   |
| Drag & Drop| [@dnd-kit/core](https://dndkit.com/)                        |

---

## Data Model

```
User
 ├── boards (many-to-many)
 │    └── Board
 │         └── List
 │              └── Card (with Status: TODO | IN_PROGRESS | REVIEW | DONE)
 └── assignedCards (many-to-many)
```

### Card Status

| Status        | Description         |
|---------------|---------------------|
| `TODO`        | Not started yet     |
| `IN_PROGRESS` | Currently being worked on |
| `REVIEW`      | Awaiting review     |
| `DONE`        | Completed           |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally or via a connection string
- npm

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/latra"
```
### NOTE
If you have received a .env file in the mail, copy and paste the database URL link there instead.

Run migrations and seed the database:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run start:dev
```

API will be available at **http://localhost:3001**

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App will be available at **http://localhost:3000**

---

## Project Structure

```
Latra/
├── backend/
│   ├── src/
│   │   ├── auth/            # Authentication (register, login)
│   │   ├── boards/          # Board CRUD
│   │   ├── lists/           # List CRUD
│   │   ├── cards/           # Card CRUD
│   │   ├── users/           # User management
│   │   ├── prisma.module.ts # Prisma module
│   │   ├── prisma.service.ts
│   │   └── main.ts          # Entry point (port 3001)
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       ├── seeds.ts         # Seed data
│       └── migrations/
│
└── frontend/
    ├── app/
    │   ├── page.tsx         # Home / dashboard
    │   ├── login/           # Login page
    │   ├── signup/          # Registration page
    │   └── boards/          # Board view
    ├── components/
    │   └── Navbar.tsx
    ├── lib/                 # Utilities / API helpers
    └── types/               # TypeScript types
```