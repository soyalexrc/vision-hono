CREATE TABLE `Ally` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`lastname` text(256) NOT NULL,
	`email` text(256) NOT NULL,
	`phoneNumber` text(256) NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
