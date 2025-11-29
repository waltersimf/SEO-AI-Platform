/*
  Warnings:

  - You are about to drop the column `recurringPattern` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "recurringPattern",
ADD COLUMN     "recurrenceEnd" TIMESTAMP(3),
ADD COLUMN     "recurrenceRule" TEXT;
