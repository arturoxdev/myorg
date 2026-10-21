import { randomUUID } from "node:crypto"

import { requireSession } from "@/lib/auth"
import { fileUrl, putObject } from "@/lib/r2"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}
const FOLDERS = new Set(["tasks", "categories"])

export async function POST(request: Request) {
  await requireSession()

  const formData = await request.formData()
  const file = formData.get("file")
  const folder = String(formData.get("folder") ?? "tasks")

  if (!(file instanceof File)) {
    return Response.json({ error: "No se recibió ningún archivo" }, { status: 400 })
  }
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return Response.json({ error: "Formato de imagen no soportado" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "La imagen supera los 10 MB" }, { status: 400 })
  }
  if (!FOLDERS.has(folder)) {
    return Response.json({ error: "Destino inválido" }, { status: 400 })
  }

  const key = `${folder}/${randomUUID()}.${ext}`
  try {
    await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type)
  } catch (error) {
    console.error("Error subiendo a R2", error)
    return Response.json({ error: "No se pudo guardar la imagen en el almacenamiento" }, { status: 502 })
  }

  return Response.json({ key, url: fileUrl(key) })
}
