import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { decrypt, SESSION_COOKIE } from "@/lib/session"

export const getSession = cache(async () => {
  const store = await cookies()
  return decrypt(store.get(SESSION_COOKIE)?.value)
})

/** Verifica la sesión en el servidor; el proxy solo hace una comprobación optimista. */
export async function requireSession() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}
