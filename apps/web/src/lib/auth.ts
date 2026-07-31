import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.SECRET_KEY ?? 'default-dev-secret-change-in-production')
const COOKIE_NAME = 'inferx-session'
const EXPIRES_IN = '7d'

export async function signJWT(payload: { userId: string; walletAddress: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET)
}

export async function verifyJWT(token: string): Promise<{ userId: string; walletAddress: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return {
      userId: payload.userId as string,
      walletAddress: payload.walletAddress as string,
    }
  } catch {
    return null
  }
}

export async function getSession(request: Request): Promise<{ userId: string; walletAddress: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return verifyJWT(token)
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)
  if (!sessionCookie?.value) {
    return null
  }

  return verifyJWT(sessionCookie.value)
}

export function createSession(token: string): Response {
  const response = new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })

  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
  )

  return response
}

export function clearSession(): Response {
  const response = new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })

  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  )

  return response
}
