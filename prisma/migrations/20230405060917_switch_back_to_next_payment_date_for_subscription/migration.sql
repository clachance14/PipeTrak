/*
  Warnings:

  - You are about to drop the column `billingAnchor` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "billingAnchor",
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3);
