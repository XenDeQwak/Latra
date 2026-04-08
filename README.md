# 📋 Latra

A full-stack task management application built with **Next.js** and **NestJS**, featuring a Trello-style **Board → List → Card** workflow with user authentication and drag-and-drop support.

---

## 🧱 Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | [Next.js 16](https://nextjs.org/) + React 19 + Tailwind CSS |
| Backend    | [NestJS 11](https://nestjs.com/)                             |
| ORM        | [Prisma 7](https://www.prisma.io/)                           |
| Database   | PostgreSQL                                                   |
| Language   | TypeScript                                                   |
| Drag & Drop| [@dnd-kit/core](https://dndkit.com/)                        |

---

## 📐 Data Model

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

## 🚀 Getting Started

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
PORT=3001
```

Run migrations and seed the database:

```bash
npx prisma migrate dev
npx tsx prisma/seeds.ts   # optional
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

## 📁 Project Structure

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

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| POST   | `/auth/register` | Register new user |
| POST   | `/auth/login`    | Login             |

### Boards
| Method | Endpoint      | Description        |
|--------|---------------|--------------------|
| GET    | `/boards`     | Get all boards     |
| GET    | `/boards/:id` | Get board by ID    |
| POST   | `/boards`     | Create a board     |
| PATCH  | `/boards/:id` | Update a board     |
| DELETE | `/boards/:id` | Delete board (cascades to lists & cards) |

### Lists
| Method | Endpoint     | Description     |
|--------|--------------|-----------------|
| GET    | `/lists`     | Get all lists   |
| GET    | `/lists/:id` | Get list by ID  |
| POST   | `/lists`     | Create a list   |
| PATCH  | `/lists/:id` | Update a list   |
| DELETE | `/lists/:id` | Delete a list   |

### Cards
| Method | Endpoint     | Description                   |
|--------|--------------|-------------------------------|
| GET    | `/cards`     | Get all cards                 |
| GET    | `/cards/:id` | Get card by ID                |
| POST   | `/cards`     | Create a card                 |
| PATCH  | `/cards/:id` | Update card (title, status, deadline, assignees) |
| DELETE | `/cards/:id` | Delete a card                 |

---

## 🗄️ Database Schema

```prisma
model User {
  id            Int     @id @default(autoincrement())
  email         String  @unique
  username      String
  password      String
  boards        Board[] @relation("UserBoards")
  assignedCards Card[]  @relation("CardAssignees")
}

model Board {
  id          Int    @id @default(autoincrement())
  title       String
  description String
  lists       List[]
  users       User[] @relation("UserBoards")
}

model List {
  id        Int      @id @default(autoincrement())
  title     String
  boardId   Int
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
}

model Card {
  id            Int      @id @default(autoincrement())
  title         String
  description   String
  status        Status   @default(TODO)
  deadline      DateTime
  listId        Int
  list          List     @relation(fields: [listId], references: [id])
  assignedUsers User[]   @relation("CardAssignees")
}

enum Status { TODO  IN_PROGRESS  REVIEW  DONE }
```

---

## 🛠️ Useful Commands

### Backend

```bash
npm run start:dev        # Development with hot reload
npm run build            # Build for production
npm run start:prod       # Run production build
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create & apply a migration
npx prisma generate      # Regenerate Prisma client
npx tsx prisma/seeds.ts  # Seed the database
```

### Frontend

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Run production build
npm run lint    # Run ESLint
```

---

## 📝 License

This project is unlicensed and intended for personal/educational use.