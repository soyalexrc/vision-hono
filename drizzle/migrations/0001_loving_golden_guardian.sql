CREATE TABLE `ContactForm` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`from` text NOT NULL,
	`createdAt` integer DEFAULT 1746448215495 NOT NULL
);
