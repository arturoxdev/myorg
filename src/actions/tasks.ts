"use server"

import { eq, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/db"
import { priorityEnum, tasks } from "@/db/schema"
import { requireSession } from "@/lib/auth"
import { deleteObject } from "@/lib/r2"
import type { ActionResult } from "@/actions/categories"

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  description: z.string().max(200_000),
  dueDate: z.iso.date().nullable(),
  categoryId: z.uuid().nullable(),
  priority: z.enum(priorityEnum.enumValues),
})

export type TaskInput = z.input<typeof taskSchema>

/** Claves de R2 de las imágenes incrustadas en la descripción. */
function imageKeys(html: string) {
  return new Set(Array.from(html.matchAll(/\/api\/files\/(tasks\/[\w-]+\.\w+)/g), (m) => m[1]))
}

async function deleteImages(keys: Iterable<string>) {
  await Promise.all(Array.from(keys, (key) => deleteObject(key).catch(() => {})))
}

export async function saveTask(id: string | null, input: TaskInput): Promise<ActionResult> {
  await requireSession()
  const parsed = taskSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  let savedId = id
  if (id) {
    const previous = await db.query.tasks.findFirst({ where: eq(tasks.id, id) })
    if (!previous) return { ok: false, error: "La tarea no existe" }
    await db.update(tasks).set(parsed.data).where(eq(tasks.id, id))

    const current = imageKeys(parsed.data.description)
    await deleteImages([...imageKeys(previous.description)].filter((key) => !current.has(key)))
  } else {
    const [row] = await db.insert(tasks).values(parsed.data).returning({ id: tasks.id })
    savedId = row.id
  }

  revalidatePath("/", "layout")
  return { ok: true, id: savedId! }
}

export async function toggleTask(id: string, completed: boolean) {
  await requireSession()
  await db.update(tasks).set({ completed }).where(eq(tasks.id, id))
  revalidatePath("/", "layout")
}

/** Cambia solo la fecha de la tarea (arrastrar en el calendario); null la deja sin fecha. */
export async function scheduleTask(id: string, dueDate: string | null) {
  await requireSession()
  const parsed = taskSchema.shape.dueDate.parse(dueDate)
  await db.update(tasks).set({ dueDate: parsed }).where(eq(tasks.id, id))
  revalidatePath("/", "layout")
}

export async function deleteTask(id: string): Promise<ActionResult> {
  await requireSession()
  const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning()
  if (!row) return { ok: false, error: "La tarea no existe" }
  await deleteImages(imageKeys(row.description))

  revalidatePath("/", "layout")
  return { ok: true, id }
}

/**
 * Borra de R2 imágenes subidas en un formulario que se cerró sin guardar.
 * Solo elimina claves de tareas que ninguna tarea guardada referencia.
 */
export async function discardUploads(keys: string[]) {
  await requireSession()
  const valid = keys.filter((key) => /^tasks\/[\w-]+\.\w+$/.test(key)).slice(0, 100)

  const unused = []
  for (const key of valid) {
    const inUse = await db.query.tasks.findFirst({
      columns: { id: true },
      where: ilike(tasks.description, `%/api/files/${key}%`),
    })
    if (!inUse) unused.push(key)
  }
  await deleteImages(unused)
}
