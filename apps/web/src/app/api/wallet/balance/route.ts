import { getSession } from '@/lib/auth'
import { getBalance } from '@/lib/stellar'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await getBalance(session.walletAddress)

    return Response.json({
      walletAddress: session.walletAddress,
      balance,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
