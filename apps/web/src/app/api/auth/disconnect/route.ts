const COOKIE_NAME = 'inferx-session'

export async function POST() {
  const response = Response.json({ success: true })

  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  )

  return response
}
