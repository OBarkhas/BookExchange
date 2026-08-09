-- AlterTable
ALTER TABLE "ExchangeRequest" ADD COLUMN     "hiddenByReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenBySender" BOOLEAN NOT NULL DEFAULT false;
