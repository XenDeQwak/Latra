import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"];
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const board = await prisma.board.create({
    data: {
      title: 'My Board',
      lists: {
        create: [
          { title: 'To-Do' },
          { title: 'In Progress' },
          { title: 'In Review'},
          { title: 'Done' },
        ],
      },
    },
  });

  console.log('Seeded board:', board);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });