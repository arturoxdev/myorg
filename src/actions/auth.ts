"use server"

import { timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { encrypt, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session"

export type LoginState = { error?: string } | undefined

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")

  const validUser = safeEqual(username, process.env.AUTH_USERNAME ?? "")
  const validPass = safeEqual(password, process.env.AUTH_PASSWORD ?? "")
  if (!process.env.AUTH_USERNAME || !validUser || !validPass) {
    return { error: "Usuario o contraseña incorrectos" }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, await encrypt(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  redirect("/")
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/login")
}
