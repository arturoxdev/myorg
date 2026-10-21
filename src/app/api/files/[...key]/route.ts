import { requireSession } from "@/lib/auth"
import { getObject } from "@/lib/r2"

export async function GET(_: Request, ctx: RouteContext<"/api/files/[...key]">) {
  await requireSession()
  const { key } = await ctx.params

  try {
    const object = await getObject(key.join("/"))
    if (!object.Body) return new Response("No encontrado", { status: 404 })

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        // Las claves son UUID inmutables, se pueden cachear indefinidamente.
        "Cache-Control": "private, max-age=31536000, immutable",
        // Evita que un SVG subido ejecute scripts al abrirse directamente.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("No encontrado", { status: 404 })
  }
}
