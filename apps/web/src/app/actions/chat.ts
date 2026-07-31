"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { inference, countTokens } from '@/lib/inference'

const COOKIE_NAME = 'inferx-session'

async function getUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

export async function createConversation(endpointId: string, title?: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const endpoint = await prisma.endpoint.findUnique({
    where: { id: endpointId },
  })

  if (!endpoint || !endpoint.isActive) {
    throw new Error('Endpoint not found or inactive')
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

  return conversation
}

export async function sendMessage(
  conversationId: string,
  content: string,
  images?: string[]
) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.userId },
    include: {
      endpoint: {
        include: {
          provider: true,
          providerSecret: true,
        },
      },
    },
  })

  if (!conversation) throw new Error('Conversation not found')
  if (!conversation.endpoint.isActive) throw new Error('Endpoint is inactive')

  const secret = conversation.endpoint.providerSecret
  if (!secret) throw new Error('Endpoint is not configured')

  const apiKey = await decrypt(secret.encryptedApiKey, secret.encryptionIv)
  const baseUrl = await decrypt(secret.encryptedBaseUrl, secret.encryptionIv)

  const previousMessages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  })

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      userId: session.userId,
      endpointId: conversation.endpointId,
      role: 'USER',
      content,
    },
  })

  if (conversation.title === `Chat with ${conversation.endpoint.displayName}` && previousMessages.length === 0) {
    const truncatedTitle = content.length > 50 ? content.slice(0, 50) + '...' : content
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: truncatedTitle },
    })
  }

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
      conversationId,
      userId: session.userId,
      endpointId: conversation.endpointId,
      role: 'ASSISTANT',
      content: assistantContent,
      tokensUsed: totalTokens,
      cost: cost.toFixed(7),
    },
  })

  const transaction = await prisma.transaction.create({
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

  return {
    userMessage,
    assistantMessage,
    transaction,
    usage: { inputTokens, outputTokens, totalTokens },
    cost,
    latencyMs,
  }
}

export async function getConversations() {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      endpoint: { select: { displayName: true, modelName: true, isActive: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
  })

  return conversations.map((conv: typeof conversations[number]) => ({
    id: conv.id,
    title: conv.title,
    endpoint: conv.endpoint,
    lastMessage: conv.messages[0] ?? null,
    messageCount: conv._count.messages,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }))
}

export async function getConversationMessages(conversationId: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.userId },
  })

  if (!conversation) throw new Error('Conversation not found')

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })

  return messages
}

export async function deleteConversation(id: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.userId },
  })

  if (!conversation) throw new Error('Conversation not found')

  await prisma.conversation.delete({ where: { id } })

  return { success: true }
}

export async function rateEndpoint(endpointId: string, rating: number, comment?: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')

  const endpoint = await prisma.endpoint.findUnique({
    where: { id: endpointId },
  })

  if (!endpoint) throw new Error('Endpoint not found')

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

  return newRating
}
