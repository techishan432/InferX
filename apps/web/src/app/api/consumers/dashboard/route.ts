import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalSpent, totalRequested] = await Promise.all([
      prisma.transaction.aggregate({
        where: { consumerId: session.userId, success: true },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: { consumerId: session.userId, success: true },
      }),
    ])

    const activeConversations = await prisma.conversation.count({
      where: { userId: session.userId },
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const last7dSpent = await prisma.transaction.aggregate({
      where: { consumerId: session.userId, success: true, createdAt: { gte: sevenDaysAgo } },
      _sum: { amount: true },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailySpending = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { consumerId: session.userId, success: true, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    })

    const byDay = new Map<string, { amount: number; requests: number }>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      byDay.set(d.toISOString().slice(0, 10), { amount: 0, requests: 0 })
    }
    for (const row of dailySpending) {
      const key = new Date(row.createdAt).toISOString().slice(0, 10)
      const existing = byDay.get(key)
      if (existing) {
        existing.amount += Number(row._sum.amount ?? 0)
        existing.requests += row._count
      }
    }
    const spendingOverTime = Array.from(byDay.entries()).map(([date, v]) => ({
      date,
      amount: v.amount,
      requests: v.requests,
    }))

    const recentConversations = await prisma.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        endpoint: { select: { displayName: true } },
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } },
      },
    })

    const recentConversationsFormatted = recentConversations.map((c) => ({
      id: c.id,
      endpointName: c.endpoint.displayName,
      lastMessage: c.messages[0]?.content ?? '',
      messageCount: c._count.messages,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    const userTransactions = await prisma.transaction.findMany({
      where: { consumerId: session.userId, success: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        endpoint: { select: { id: true, modelName: true, displayName: true } },
      },
    })

    const modelCounts = new Map<string, { modelName: string; endpointName: string; endpointId: string; count: number }>()
    for (const tx of userTransactions) {
      const existing = modelCounts.get(tx.endpointId)
      if (existing) {
        existing.count++
      } else {
        modelCounts.set(tx.endpointId, {
          modelName: tx.endpoint.modelName,
          endpointName: tx.endpoint.displayName,
          endpointId: tx.endpointId,
          count: 1,
        })
      }
    }
    const favoriteModels = Array.from(modelCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return Response.json({
      totalSpent: (totalSpent._sum.amount ?? 0).toString(),
      last24hSpent: '0',
      last7dSpent: (last7dSpent._sum.amount ?? 0).toString(),
      last30dSpent: (totalSpent._sum.amount ?? 0).toString(),
      totalRequests: totalRequested,
      activeConversations,
      spendingOverTime,
      recentConversations: recentConversationsFormatted,
      favoriteModels,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
