/*
  Warnings:

  - Made the column `city` on table `wasteexchange` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `textilewaste` MODIFY `images` TEXT NULL;

-- AlterTable
ALTER TABLE `wasteexchange` MODIFY `city` TEXT NOT NULL;
