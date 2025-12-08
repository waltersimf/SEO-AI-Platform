-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'pending', 'unpaid', 'overdue');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "budgetSpent" DOUBLE PRECISION,
ADD COLUMN     "budgetTotal" DOUBLE PRECISION,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentDueDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid';
