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

| Status        | Description               |
|---------------|---------------------------|
| `TODO`        | Not started yet           |
| `IN_PROGRESS` | Currently being worked on |
| `REVIEW`      | Awaiting review           |
| `DONE`        | Completed                 |

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

---

## How to Use

### 1. Create an Account

- Open the app at **http://localhost:3000**
- Click **"Get started for free"** on the landing page
- Fill in your username, email, and password, then submit the signup form
- You will be redirected to your workspace

### 2. Log In

- Click **"Sign in"** on the landing page
- Enter your email and password
- On success you are taken directly to **My Workspace**

### 3. Managing Boards

- **Create a board** — Click the **"New Board"** button (top right of the workspace) or the dashed **"New Board"** card. Enter a title and an optional description, then click **"Create Board"**
- **Open a board** — Click any board card to open it
- **Delete a board** — Hover over a board card and click the **✕** button that appears in the top-right corner. This also deletes all lists and cards inside it

### 4. Managing Lists

Inside a board you will see four default columns: **To-Do**, **In Progress**, **In Review**, and **Done**.

- **Add a custom list** — Click the dashed **"Add list"** column at the far right, type a title, and click **"Add list"**
- **Delete a custom list** — Click the **✕** icon in the list header. Note: the four default columns cannot be deleted
- Deleting a list also deletes all cards inside it

### 5. Managing Cards

- **Create a card** — Click **"+ Add card"** at the bottom of any list. Fill in the title, an optional description, and a deadline date, then click **"Add Card"**
- **Edit a card** — Hover over a card and click the **pencil icon**. You can update the title, description, deadline, and status, then click **"Save Changes"**
- **Move a card** — Click and drag a card to another column. Dropping it onto a default column (To-Do, In Progress, In Review, Done) also updates the card's status automatically
- **Delete a card** — Hover over a card and click the **trash icon**
- Overdue deadlines are highlighted in **red** on the card

### 6. Assigning Users to Cards

- Users must be a member of the board first (see below)
- On any card, click the small **"+"** button next to the assignee avatars
- Select a username from the dropdown — they are immediately assigned and their avatar appears on the card

### 7. Adding Members to a Board

- Inside a board, click the **"+ Member"** button in the top-right header
- Select a registered user from the dropdown and click **"Add Member"**
- They will now appear in the board's member list and can be assigned to cards