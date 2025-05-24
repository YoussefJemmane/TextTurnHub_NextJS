/*
  Warnings:

  - The primary key for the `conversationuser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `userpermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `userrole` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `artisanprofile` DROP FOREIGN KEY `ArtisanProfile_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `CartItem_userId_fkey`;

-- DropForeignKey
ALTER TABLE `companyprofile` DROP FOREIGN KEY `CompanyProfile_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `conversationuser` DROP FOREIGN KEY `ConversationUser_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_sender_id_fkey`;

-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `userprofile` DROP FOREIGN KEY `UserProfile_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `userrole` DROP FOREIGN KEY `UserRole_user_id_fkey`;

-- DropIndex
DROP INDEX `ConversationUser_user_id_fkey` ON `conversationuser`;

-- DropIndex
DROP INDEX `Message_sender_id_fkey` ON `message`;

-- AlterTable
ALTER TABLE `artisanprofile` MODIFY `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `cartitem` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `companyprofile` MODIFY `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `conversationuser` DROP PRIMARY KEY,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`conversation_id`, `user_id`);

-- AlterTable
ALTER TABLE `message` MODIFY `sender_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `textilewaste` MODIFY `images` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `userpermission` DROP PRIMARY KEY,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`user_id`, `permission_id`);

-- AlterTable
ALTER TABLE `userprofile` MODIFY `user_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `userrole` DROP PRIMARY KEY,
    MODIFY `user_id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`user_id`, `role_id`);

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyProfile` ADD CONSTRAINT `CompanyProfile_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtisanProfile` ADD CONSTRAINT `ArtisanProfile_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationUser` ADD CONSTRAINT `ConversationUser_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `cartitem` RENAME INDEX `CartItem_productId_fkey` TO `CartItem_productId_idx`;

-- RenameIndex
ALTER TABLE `cartitem` RENAME INDEX `CartItem_userId_fkey` TO `CartItem_userId_idx`;
