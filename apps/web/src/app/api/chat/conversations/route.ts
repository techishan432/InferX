import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        endpoint: {
          select: { displayName: true, modelName: true, isActive: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })

    return Response.json({
      conversations: conversations.map((conv: typeof conversations[number]) => ({
        id: conv.id,
        title: conv.title,
        endpoint: conv.endpoint,
        lastMessage: conv.messages[0] ?? null,
        messageCount: conv._count.messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
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

    const { endpointId, title } = await request.json()

    if (!endpointId) {
      return Response.json({ error: 'endpointId is required' }, { status: 400 })
    }

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    })

    if (!endpoint || !endpoint.isActive) {
      return Response.json({ error: 'Endpoint not found or inactive' }, { status: 404 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.userId,
        endpointId,
        title: title ?? `Chat with ${endpoint.displayName}`,
      },
      include: {
        endpoint: { select: { displayName: true, modelName: true } },
      },
    })

    return Response.json({ conversation }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
