import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('search') ?? ''
    const model = searchParams.get('model') ?? ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sortBy') ?? searchParams.get('sort') ?? 'createdAt'
    const order = searchParams.get('sortOrder') ?? searchParams.get('order') ?? 'desc'
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20')
    const active = searchParams.get('active')

    const where: Prisma.EndpointWhereInput = {}

    if (active === 'true') {
      where.isActive = true
    } else if (active === null || active === undefined) {
      where.isActive = true
    }

    if (model) {
      where.modelName = { contains: model, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { modelName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    }

    const supportsVision = searchParams.get('supportsVision')
    const supportsStreaming = searchParams.get('supportsStreaming')
    if (supportsVision === 'true') where.supportsVision = true
    if (supportsStreaming === 'true') where.supportsStreaming = true

    if (minPrice || maxPrice) {
      where.pricePerRequest = {}
      if (minPrice) where.pricePerRequest.gte = parseFloat(minPrice)
      if (maxPrice) where.pricePerRequest.lte = parseFloat(maxPrice)
    }

    const orderBy: Record<string, string> = {}
    const validSortFields = ['createdAt', 'popularity', 'pricePerRequest', 'price', 'averageRating', 'rating', 'latency', 'totalRequests', 'modelName']
    const sortField = sort === 'popularity' ? 'totalRequests' : sort === 'price' ? 'pricePerRequest' : sort === 'rating' ? 'averageRating' : sort
    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = order
    } else {
      orderBy.createdAt = 'desc'
    }

    const skip = (page - 1) * pageSize

    const [endpoints, total] = await Promise.all([
      prisma.endpoint.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              averageRating: true,
              totalReviews: true,
            },
          },
          _count: {
            select: {
              transactions: true,
              ratings: true,
            },
          },
        },
      }),
      prisma.endpoint.count({ where }),
    ])

    return Response.json({
      data: endpoints.map((ep: typeof endpoints[number]) => ({
        id: ep.id,
        providerId: ep.providerId,
        modelName: ep.modelName,
        displayName: ep.displayName,
        description: ep.description,
        pricePerRequest: ep.pricePerRequest,
        maxInputTokens: ep.maxInputTokens,
        maxOutputTokens: ep.maxOutputTokens,
        contextLength: ep.contextLength,
        supportsVision: ep.supportsVision,
        supportsStreaming: ep.supportsStreaming,
        isActive: ep.isActive,
        rateLimit: ep.rateLimit,
        location: ep.location,
        totalRequests: ep.totalRequests.toString(),
        healthStatus: ep.healthStatus,
        averageRating: ep.averageRating,
        totalReviews: ep.totalReviews,
        latencyMs: ep.latencyMs,
        createdAt: ep.createdAt,
        provider: ep.provider,
        transactionCount: ep._count.transactions,
        ratingCount: ep._count.ratings,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
