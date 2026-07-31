import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') ?? 'consumer'
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

    const where: Record<string, unknown> = {}

    if (type === 'consumer') {
      where.consumerId = session.userId
    } else if (type === 'provider') {
      const provider = await prisma.provider.findUnique({
        where: { userId: session.userId },
      })
      if (provider) {
        where.providerId = provider.id
      } else {
        return Response.json({ transactions: [], pagination: { page, pageSize, total: 0, totalPages: 0 } })
      }
    }

    if (status) {
      where.status = status
    }

    const skip = (page - 1) * pageSize

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          consumer: { select: { displayName: true, walletAddress: true } },
          provider: { select: { name: true, id: true } },
          endpoint: { select: { displayName: true, modelName: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return Response.json({
      transactions: transactions.map((tx: typeof transactions[number]) => ({
        id: tx.id,
        amount: tx.amount,
        platformFee: tx.platformFee,
        providerPayment: tx.providerPayment,
        success: tx.success,
        status: tx.status,
        tokensUsed: tx.tokensUsed,
        latencyMs: tx.latencyMs,
        stellarTxHash: tx.stellarTxHash,
        errorMessage: tx.errorMessage,
        createdAt: tx.createdAt,
        consumer: tx.consumer,
        provider: tx.provider,
        endpoint: tx.endpoint,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
