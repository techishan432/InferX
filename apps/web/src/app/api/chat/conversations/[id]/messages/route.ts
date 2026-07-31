import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { inference, countTokens } from '@/lib/inference'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.userId },
    })

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    })

    return Response.json({ messages })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content, images } = await request.json()

    if (!content) {
      return Response.json({ error: 'content is required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.userId },
      include: {
        endpoint: {
          include: {
            provider: true,
            providerSecret: true,
          },
        },
      },
    })

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (!conversation.endpoint.isActive) {
      return Response.json({ error: 'Endpoint is inactive' }, { status: 400 })
    }

    const secret = conversation.endpoint.providerSecret
    if (!secret) {
      return Response.json({ error: 'Endpoint is not configured' }, { status: 500 })
    }

    const apiKey = await decrypt(secret.encryptedApiKey, secret.encryptionIv)
    const baseUrl = await decrypt(secret.encryptedBaseUrl, secret.encryptionIv)

    const previousMessages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    })

    await prisma.chatMessage.create({
      data: {
        conversationId: id,
        userId: session.userId,
        endpointId: conversation.endpointId,
        role: 'USER',
        content,
      },
    })

    const messages = [
      ...previousMessages.map((m: { role: string; content: string }) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content },
    ]

    const startTime = Date.now()

    const response = await inference({
      baseUrl,
      apiKey,
      model: conversation.endpoint.modelName,
      messages,
      stream: false,
      images,
      maxTokens: conversation.endpoint.maxOutputTokens,
    })

    const latencyMs = Date.now() - startTime
    const data = await response.json()
    const assistantContent: string = data.choices?.[0]?.message?.content ?? ''

    const inputTokens = await countTokens(content)
    const outputTokens = await countTokens(assistantContent)
    const totalTokens = inputTokens + outputTokens

    const pricePerRequest = Number(conversation.endpoint.pricePerRequest)
    const tokenCost = (totalTokens / 1_000_000) * 0.01
    const cost = Math.max(pricePerRequest, tokenCost)

    const platformFeeRate = 0.05
    const platformFee = cost * platformFeeRate
    const providerPayment = cost - platformFee

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        userId: session.userId,
        endpointId: conversation.endpointId,
        role: 'ASSISTANT',
        content: assistantContent,
        tokensUsed: totalTokens,
        cost: cost.toFixed(7),
      },
    })

    await prisma.transaction.create({
      data: {
        consumerId: session.userId,
        providerId: conversation.endpoint.providerId,
        endpointId: conversation.endpointId,
        amount: cost.toFixed(7),
        platformFee: platformFee.toFixed(7),
        providerPayment: providerPayment.toFixed(7),
        success: true,
        tokensUsed: totalTokens,
        latencyMs,
        status: 'SUCCESS',
      },
    })

    await prisma.$transaction([
      prisma.endpoint.update({
        where: { id: conversation.endpointId },
        data: { totalRequests: { increment: 1 } },
      }),
      prisma.provider.update({
        where: { id: conversation.endpoint.providerId },
        data: {
          totalRequests: { increment: 1 },
          totalEarnings: { increment: providerPayment },
        },
      }),
    ])

    return Response.json({
      message: assistantMessage,
      usage: { inputTokens, outputTokens, totalTokens },
      cost,
      latencyMs,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
