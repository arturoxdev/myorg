import "server-only"
import { and, asc, desc, eq, gt, gte, ilike, isNotNull, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm"
import { format } from "date-fns"

import { db } from "@/db"
import { categories, tasks } from "@/db/schema"
import { requireSession } from "@/lib/auth"

export type TaskView = "all" | "today" | "upcoming" | "completed"

export type TaskFilters = {
  view?: TaskView
  categoryId?: string
  q?: string
}

export async function getCategories() {
  await requireSession()
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      emoji: categories.emoji,
      iconKey: categories.iconKey,
      createdAt: categories.createdAt,
      pending: sql<number>`count(${tasks.id}) filter (where ${tasks.completed} = false)`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(tasks, eq(tasks.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name))
  return rows
}

export async function getCategory(id: string) {
  await requireSession()
  return db.query.categories.findFirst({ where: eq(categories.id, id) })
}

export async function getTasks({ view = "all", categoryId, q }: TaskFilters) {
  await requireSession()
  const today = format(new Date(), "yyyy-MM-dd")
  const conditions: (SQL | undefined)[] = []

  // Las vistas devuelven pendientes y completadas; la lista las separa en secciones.
  if (view === "completed") conditions.push(eq(tasks.completed, true))

  if (view === "today") {
    // Pendientes vencidas o de hoy, y las completadas que eran para hoy.
    conditions.push(
      or(
        and(eq(tasks.completed, false), isNotNull(tasks.dueDate), lte(tasks.dueDate, today)),
        and(eq(tasks.completed, true), eq(tasks.dueDate, today))
      )
    )
  }
  if (view === "upcoming") conditions.push(gt(tasks.dueDate, today))
  if (categoryId) conditions.push(eq(tasks.categoryId, categoryId))
  if (q) conditions.push(or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`)))

  return db.query.tasks.findMany({
    where: and(...conditions),
    with: { category: true },
    orderBy: [
      sql`${tasks.dueDate} asc nulls last`,
      sql`array_position(array['urgent','high','medium','low']::priority[], ${tasks.priority})`,
      desc(tasks.createdAt),
    ],
  })
}

/**
 * Tareas para el calendario: las programadas entre `start` y `end` (inclusive)
 * y las pendientes sin fecha o vencidas, que se organizan desde el panel lateral.
 */
export async function getCalendarTasks(start: string, end: string, today: string) {
  await requireSession()
  return db.query.tasks.findMany({
    where: or(
      and(gte(tasks.dueDate, start), lte(tasks.dueDate, end)),
      and(eq(tasks.completed, false), or(isNull(tasks.dueDate), lt(tasks.dueDate, today)))
    ),
    with: { category: true },
    orderBy: [
      sql`array_position(array['urgent','high','medium','low']::priority[], ${tasks.priority})`,
      desc(tasks.createdAt),
    ],
  })
}

export async function getTask(id: string) {
  await requireSession()
  return db.query.tasks.findFirst({ where: eq(tasks.id, id), with: { category: true } })
}
