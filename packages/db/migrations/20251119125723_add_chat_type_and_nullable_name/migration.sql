-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'group',
ALTER COLUMN "name" DROP NOT NULL;
