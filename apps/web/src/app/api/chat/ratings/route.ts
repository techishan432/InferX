import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpointId, rating, comment } = await request.json()

    if (!endpointId || !rating) {
      return Response.json({ error: 'endpointId and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return Response.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    })

    if (!endpoint) {
      return Response.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const existing = await prisma.rating.findUnique({
      where: { reviewerId_endpointId: { reviewerId: session.userId, endpointId } },
    })

    let newRating
    if (existing) {
      newRating = await prisma.rating.update({
        where: { id: existing.id },
        data: { rating, comment },
      })
    } else {
      newRating = await prisma.rating.create({
        data: {
          reviewerId: session.userId,
          endpointId,
          rating,
          comment,
        },
      })
    }

    const ratings = await prisma.rating.findMany({
      where: { endpointId },
      select: { rating: true },
    })

    const avgRating = ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length

    await prisma.endpoint.update({
      where: { id: endpointId },
      data: { averageRating: avgRating, totalReviews: ratings.length },
    })

    return Response.json({ rating: newRating }, { status: existing ? 200 : 201 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
