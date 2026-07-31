import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalUsers,
      totalProviders,
      totalEndpoints,
      activeEndpoints,
      totalTransactions,
      successfulTransactions,
      aggVolume,
      aggTokens,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.provider.count(),
      prisma.endpoint.count(),
      prisma.endpoint.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { success: true } }),
      prisma.transaction.aggregate({
        where: { success: true },
        _sum: { amount: true, platformFee: true, providerPayment: true },
      }),
      prisma.transaction.aggregate({
        where: { success: true },
        _sum: { tokensUsed: true },
      }),
    ])

    const totalVolume = (aggVolume._sum.amount ?? 0).toString()

    const recentTransactions = await prisma.transaction.findMany({
      where: { success: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        endpoint: { select: { displayName: true, modelName: true } },
        provider: { select: { name: true } },
      },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const dailyTxs = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { success: true, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    })

    const volumeByDay = new Map<string, { volume: number; transactions: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      volumeByDay.set(key, { volume: 0, transactions: 0 })
    }
    for (const row of dailyTxs) {
      const key = new Date(row.createdAt).toISOString().slice(0, 10)
      const existing = volumeByDay.get(key)
      if (existing) {
        existing.volume += Number(row._sum.amount ?? 0)
        existing.transactions += row._count
      }
    }
    const volumeOverTime = Array.from(volumeByDay.entries()).map(([date, v]) => ({
      date,
      volume: v.volume,
      transactions: v.transactions,
    }))

    const topModels = await prisma.endpoint.findMany({
      where: { isActive: true },
      orderBy: { totalRequests: 'desc' },
      take: 10,
      select: {
        modelName: true,
        totalRequests: true,
        id: true,
      },
    })

    const modelRevenue = await prisma.transaction.groupBy({
      by: ['endpointId'],
      where: { success: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    })

    const revenueByEndpoint = new Map(modelRevenue.map((r) => [r.endpointId, Number(r._sum.amount ?? 0)]))
    const topModelsFormatted = topModels.map((m) => ({
      model: m.modelName,
      displayName: m.modelName,
      requests: Number(m.totalRequests),
      revenue: (revenueByEndpoint.get(m.id) ?? 0).toFixed(7),
    }))

    const topProviders = await prisma.provider.findMany({
      orderBy: { totalEarnings: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        totalEarnings: true,
        endpoints: { where: { isActive: true } },
        _count: { select: { endpoints: { where: { isActive: true } } } },
      },
    })

    const topProvidersFormatted = topProviders.map((p) => ({
      id: p.id,
      name: p.name,
      revenue: p.totalEarnings.toString(),
      endpoints: p._count.endpoints,
    }))

    const onlineCount = await prisma.endpoint.count({ where: { healthStatus: 'ONLINE', isActive: true } })
    const offlineCount = await prisma.endpoint.count({ where: { healthStatus: { in: ['OFFLINE', 'DEGRADED'] }, isActive: true } })
    const unknownCount = activeEndpoints - onlineCount - offlineCount

    const endpointDistribution = [
      { status: 'Online', count: onlineCount },
      ...(offlineCount > 0 ? [{ status: 'Offline', count: offlineCount }] : []),
      ...(unknownCount > 0 ? [{ status: 'Unknown', count: unknownCount }] : []),
    ]

    return Response.json({
      totalUsers,
      totalProviders,
      totalEndpoints,
      activeEndpoints,
      totalTransactions,
      successfulTransactions,
      totalVolume,
      activeUsers: totalUsers,
      totalTokensUsed: aggTokens._sum.tokensUsed ?? 0,
      transactionVolume: {
        total: aggVolume._sum.amount ?? '0',
        platformFees: aggVolume._sum.platformFee ?? '0',
        providerPayments: aggVolume._sum.providerPayment ?? '0',
      },
      recentTransactions,
      volumeOverTime,
      topModels: topModelsFormatted,
      topProviders: topProvidersFormatted,
      endpointDistribution,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
