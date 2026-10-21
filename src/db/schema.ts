import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"])

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // Una categoría se representa con un emoji o con un logo subido a R2.
  emoji: text("emoji"),
  iconKey: text("icon_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  // HTML generado por el editor (puede contener imágenes alojadas en R2).
  description: text("description").notNull().default(""),
  dueDate: date("due_date", { mode: "string" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  priority: priorityEnum("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type Category = typeof categories.$inferSelect
export type Task = typeof tasks.$inferSelect
export type Priority = (typeof priorityEnum.enumValues)[number]

export const categoriesRelations = relations(categories, ({ many }) => ({
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one }) => ({
  category: one(categories, { fields: [tasks.categoryId], references: [categories.id] }),
}))
