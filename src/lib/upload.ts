export type UploadFolder = "tasks" | "categories"

/** Sube una imagen a R2 a través de /api/upload. */
export async function uploadImage(file: File, folder: UploadFolder) {
  const body = new FormData()
  body.append("file", file)
  body.append("folder", folder)

  const res = await fetch("/api/upload", { method: "POST", body })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen")
  return data as { key: string; url: string }
}
