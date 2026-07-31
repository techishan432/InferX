import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: session.userId },
    })

    if (!provider) {
      return Response.json({ error: 'Not registered as a provider' }, { status: 403 })
    }

    const searchParams = new URL(request.url).searchParams
    const days = parseInt(searchParams.get('days') ?? '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [revenue, requests, ratings, endpoints, dailyStats] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          providerId: provider.id,
          success: true,
          createdAt: { gte: startDate },
        },
        _sum: { amount: true, providerPayment: true, platformFee: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        where: {
          providerId: provider.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.rating.findMany({
        where: {
          endpoint: { providerId: provider.id },
          createdAt: { gte: startDate },
        },
        include: {
          reviewer: { select: { displayName: true, walletAddress: true } },
          endpoint: { select: { displayName: true, modelName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.endpoint.findMany({
        where: { providerId: provider.id },
        select: {
          id: true,
          displayName: true,
          modelName: true,
          isActive: true,
          totalRequests: true,
          averageRating: true,
          pricePerRequest: true,
          _count: { select: { transactions: true, ratings: true } },
        },
        orderBy: { totalRequests: 'desc' },
      }),
      prisma.transaction.findMany({
        where: {
          providerId: provider.id,
          success: true,
          createdAt: { gte: startDate },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const revenueByDay: Record<string, number> = {}
    for (const tx of dailyStats) {
      const day = tx.createdAt.toISOString().split('T')[0]
      revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(tx.amount)
    }

    return Response.json({
      revenue: {
        total: revenue._sum.amount ?? '0',
        providerEarnings: revenue._sum.providerPayment ?? '0',
        platformFees: revenue._sum.platformFee ?? '0',
        transactionCount: revenue._count,
      },
      requests: {
        byStatus: requests.reduce((acc: Record<string, number>, r: { status: string; _count: number }) => {
          acc[r.status] = r._count
          return acc
        }, {} as Record<string, number>),
      },
      ratings,
      endpoints,
      revenueByDay,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
