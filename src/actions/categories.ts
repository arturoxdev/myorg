"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/db"
import { categories } from "@/db/schema"
import { requireSession } from "@/lib/auth"
import { deleteObject } from "@/lib/r2"

const categorySchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
    emoji: z.string().trim().max(16).nullable(),
    iconKey: z
      .string()
      .regex(/^categories\/[\w-]+\.\w+$/)
      .nullable(),
  })
  .refine((v) => v.emoji || v.iconKey, {
    message: "Elige un emoji o sube un logo",
    path: ["emoji"],
  })

export type CategoryInput = z.input<typeof categorySchema>
export type ActionResult = { ok: true; id: string } | { ok: false; error: string }

export async function saveCategory(id: string | null, input: CategoryInput): Promise<ActionResult> {
  await requireSession()
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  // Solo se guarda una representación: el logo tiene prioridad sobre el emoji.
  const values = {
    name: parsed.data.name,
    iconKey: parsed.data.iconKey,
    emoji: parsed.data.iconKey ? null : parsed.data.emoji,
  }

  let savedId = id
  if (id) {
    const previous = await db.query.categories.findFirst({ where: eq(categories.id, id) })
    if (!previous) return { ok: false, error: "La categoría no existe" }
    await db.update(categories).set(values).where(eq(categories.id, id))
    if (previous.iconKey && previous.iconKey !== values.iconKey) {
      await deleteObject(previous.iconKey).catch(() => {})
    }
  } else {
    const [row] = await db.insert(categories).values(values).returning({ id: categories.id })
    savedId = row.id
  }

  revalidatePath("/", "layout")
  return { ok: true, id: savedId! }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireSession()
  const [row] = await db.delete(categories).where(eq(categories.id, id)).returning()
  if (!row) return { ok: false, error: "La categoría no existe" }
  if (row.iconKey) await deleteObject(row.iconKey).catch(() => {})

  revalidatePath("/", "layout")
  return { ok: true, id }
}
