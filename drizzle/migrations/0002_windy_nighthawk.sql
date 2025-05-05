PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Ally` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`lastname` text(256) NOT NULL,
	`email` text(256) NOT NULL,
	`phoneNumber` text(256) NOT NULL,
	`createdAt` integer DEFAULT 1746448340864 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_Ally`("id", "name", "lastname", "email", "phoneNumber", "createdAt") SELECT "id", "name", "lastname", "email", "phoneNumber", "createdAt" FROM `Ally`;--> statement-breakpoint
DROP TABLE `Ally`;--> statement-breakpoint
ALTER TABLE `__new_Ally` RENAME TO `Ally`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_ContactForm` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`from` text NOT NULL,
	`createdAt` integer DEFAULT 1746448340864 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_ContactForm`("id", "name", "email", "phone", "message", "from", "createdAt") SELECT "id", "name", "email", "phone", "message", "from", "createdAt" FROM `ContactForm`;--> statement-breakpoint
DROP TABLE `ContactForm`;--> statement-breakpoint
ALTER TABLE `__new_ContactForm` RENAME TO `ContactForm`;