-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "notifyAnnouncements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyProductUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyReplies" BOOLEAN NOT NULL DEFAULT true;
