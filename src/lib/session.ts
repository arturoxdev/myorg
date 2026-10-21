import { jwtVerify, SignJWT } from "jose"

export const SESSION_COOKIE = "session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

function getKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET no está definido")
  return new TextEncoder().encode(secret)
}

export async function encrypt(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getKey())
}

export async function decrypt(token: string | undefined) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify<{ username: string }>(token, getKey(), {
      algorithms: ["HS256"],
    })
    return payload
  } catch {
    return null
  }
}
