import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            description: true,
            averageRating: true,
            totalReviews: true,
            totalEndpoints: true,
            totalEarnings: true,
            totalRequests: true,
          },
        },
        ratings: {
          include: {
            reviewer: {
              select: { id: true, displayName: true, walletAddress: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!endpoint) {
      return Response.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const totalRatings = await prisma.rating.count({ where: { endpointId: id } })

    return Response.json({
      id: endpoint.id,
      providerId: endpoint.providerId,
      modelName: endpoint.modelName,
      displayName: endpoint.displayName,
      description: endpoint.description,
      pricePerRequest: endpoint.pricePerRequest.toString(),
      maxInputTokens: endpoint.maxInputTokens,
      maxOutputTokens: endpoint.maxOutputTokens,
      contextLength: endpoint.contextLength,
      supportsVision: endpoint.supportsVision,
      supportsStreaming: endpoint.supportsStreaming,
      isActive: endpoint.isActive,
      rateLimit: endpoint.rateLimit,
      location: endpoint.location,
      totalRequests: endpoint.totalRequests.toString(),
      healthStatus: endpoint.healthStatus,
      lastHealthCheck: endpoint.lastHealthCheck,
      averageRating: endpoint.averageRating,
      totalReviews: endpoint.totalReviews,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
      provider: endpoint.provider ? {
        id: endpoint.provider.id,
        name: endpoint.provider.name,
        description: endpoint.provider.description,
        averageRating: endpoint.provider.averageRating,
        totalReviews: endpoint.provider.totalReviews,
        totalEndpoints: endpoint.provider.totalEndpoints,
        totalEarnings: endpoint.provider.totalEarnings.toString(),
        totalRequests: endpoint.provider.totalRequests.toString(),
      } : null,
      ratings: endpoint.ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: r.reviewer ? {
          id: r.reviewer.id,
          displayName: r.reviewer.displayName,
          walletAddress: r.reviewer.walletAddress,
        } : null,
      })),
      recentHealthChecks: endpoint.healthChecks,
      totalRatings,
    })
  } catch (error) {
    console.error('Endpoint API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
