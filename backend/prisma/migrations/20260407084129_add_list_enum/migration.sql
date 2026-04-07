/*
  Warnings:

  - You are about to drop the column `isDone` on the `Card` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "isDone",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'TODO';
