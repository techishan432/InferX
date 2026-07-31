import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      orderBy: { totalEarnings: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        _count: {
          select: { endpoints: true },
        },
      },
    })

    return Response.json({
      providers: providers.map((p: typeof providers[number]) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        isActive: p.isActive,
        registeredAt: p.registeredAt,
        totalEndpoints: p.totalEndpoints,
        activeEndpoints: p._count.endpoints,
        totalEarnings: p.totalEarnings,
        totalRequests: p.totalRequests.toString(),
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        user: p.user,
      })),
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return Response.json({ error: 'Provider name is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isProvider) {
      return Response.json({ error: 'Already registered as a provider' }, { status: 400 })
    }

    const [updatedUser, provider] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { isProvider: true, role: 'PROVIDER' },
      }),
      prisma.provider.create({
        data: {
          userId: session.userId,
          name,
          description,
        },
      }),
    ])

    return Response.json({
      user: {
        id: updatedUser.id,
        isProvider: updatedUser.isProvider,
        role: updatedUser.role,
      },
      provider,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
