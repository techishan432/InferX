import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { verifySignature } from '@/lib/stellar'

const COOKIE_NAME = 'inferx-session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

export async function POST(request: Request) {
  try {
    const { walletAddress, signedMessage, signature } = await request.json()

    if (!walletAddress || !signedMessage || !signature) {
      return Response.json(
        { error: 'walletAddress, signedMessage, and signature are required' },
        { status: 400 }
      )
    }

    const isValid = verifySignature(walletAddress, signedMessage, signature)
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: {
        walletAddress,
        displayName: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4),
        role: 'USER',
      },
    })

    const token = await signJWT({ userId: user.id, walletAddress: user.walletAddress })

    const response = Response.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        role: user.role,
        isProvider: user.isProvider,
        isConsumer: user.isConsumer,
      },
    })

    response.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`
    )

    return response
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
