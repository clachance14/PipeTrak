/*
  Warnings:

  - Added the required column `nextPaymentDate` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "nextPaymentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "subscriptionId" TEXT NOT NULL;
