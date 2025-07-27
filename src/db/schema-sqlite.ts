import {sqliteTable, text, integer} from "drizzle-orm/sqlite-core";
export const ally = sqliteTable("Ally", {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text({ length: 256 }).notNull(),
    lastname: text({ length: 256 }).notNull(),
    email: text({ length: 256 }).notNull(),
    phoneNumber: text({ length: 256 }).notNull(),
    createdAt: integer().default(Date.now()).notNull(),
});

export const contactForm = sqliteTable("ContactForm", {
    id: integer().primaryKey({autoIncrement: true}),
    name: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    message: text().notNull(),
    from: text().notNull(),
    createdAt: integer().default(Date.now()).notNull(),
});
