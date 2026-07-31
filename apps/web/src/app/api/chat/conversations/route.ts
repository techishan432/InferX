import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function getOrCreateSessionUser(request: Request) {
  const session = await getSession(request)
  if (session) return session

  // Fallback for guest/demo mode
  let defaultUser = await prisma.user.findFirst()
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        walletAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335WF2CCAJ3FSTZAKZDXFYS6POV',
        displayName: 'Demo User',
        role: 'CONSUMER',
      },
    })
  }

  return { userId: defaultUser.id, walletAddress: defaultUser.walletAddress }
}

export async function GET(request: Request) {
  try {
    const session = await getOrCreateSessionUser(request)

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
    const session = await getOrCreateSessionUser(request)

    const body = await request.json().catch(() => ({}))
    const { title } = body
    let { endpointId } = body

    if (!endpointId) {
      const defaultEndpoint = await prisma.endpoint.findFirst({ where: { isActive: true } })
      if (defaultEndpoint) {
        endpointId = defaultEndpoint.id
      } else {
        return Response.json({ error: 'No active AI endpoints available' }, { status: 400 })
      }
    }

    let endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    })

    if (!endpoint || !endpoint.isActive) {
      const activeEndpoint = await prisma.endpoint.findFirst({ where: { isActive: true } })
      if (activeEndpoint) {
        endpoint = activeEndpoint
        endpointId = activeEndpoint.id
      } else {
        return Response.json({ error: 'Endpoint not found or inactive' }, { status: 404 })
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.userId,
        endpointId,
        title: title || `Chat with ${endpoint.displayName}`,
      },
      include: {
        endpoint: { select: { id: true, displayName: true, modelName: true } },
      },
    })

    return Response.json({
      id: conversation.id,
      title: conversation.title,
      endpointId: conversation.endpointId,
      endpoint: conversation.endpoint,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      conversation,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
