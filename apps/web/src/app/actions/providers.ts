"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { verifyJWT } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

const COOKIE_NAME = 'inferx-session'

async function getUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

export async function createEndpoint(data: {
  modelName: string
  displayName: string
  pricePerRequest: string
  maxInputTokens: number
  maxOutputTokens: number
  contextLength: number
  supportsVision: boolean
  supportsStreaming: boolean
  apiKey: string
  baseUrl: string
  rateLimit: number
  location: string
  description?: string
}) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const provider = await prisma.provider.findUnique({
    where: { userId: session.userId },
  })

  if (!provider) throw new Error('Not registered as a provider')

  const encryptedApiKey = await encrypt(data.apiKey)
  const encryptedBaseUrl = await encrypt(data.baseUrl)

  const endpoint = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newEndpoint = await tx.endpoint.create({
      data: {
        providerId: provider.id,
        modelName: data.modelName,
        displayName: data.displayName,
        description: data.description,
        pricePerRequest: data.pricePerRequest,
        maxInputTokens: data.maxInputTokens,
        maxOutputTokens: data.maxOutputTokens,
        contextLength: data.contextLength,
        supportsVision: data.supportsVision,
        supportsStreaming: data.supportsStreaming,
        rateLimit: data.rateLimit,
        location: data.location,
      },
    })

    await tx.providerSecret.create({
      data: {
        endpointId: newEndpoint.id,
        encryptedApiKey: encryptedApiKey.encrypted,
        encryptedBaseUrl: encryptedBaseUrl.encrypted,
        encryptionIv: encryptedApiKey.iv,
      },
    })

    await tx.provider.update({
      where: { id: provider.id },
      data: { totalEndpoints: { increment: 1 } },
    })

    return newEndpoint
  })

  return endpoint
}

export async function updateEndpoint(
  id: string,
  data: Partial<{
    modelName: string
    displayName: string
    pricePerRequest: string
    maxInputTokens: number
    maxOutputTokens: number
    contextLength: number
    supportsVision: boolean
    supportsStreaming: boolean
    rateLimit: number
    location: string
    description: string
    apiKey: string
    baseUrl: string
  }>
) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const endpoint = await prisma.endpoint.findFirst({
    where: {
      id,
      provider: { userId: session.userId },
    },
  })

  if (!endpoint) throw new Error('Endpoint not found or not owned by you')

  const { apiKey, baseUrl, ...updateData } = data

  if (apiKey || baseUrl) {
    const secretUpdates: Partial<{
      encryptedApiKey: string
      encryptedBaseUrl: string
      encryptionIv: string
    }> = {}

    if (apiKey) {
      const encrypted = await encrypt(apiKey)
      secretUpdates.encryptedApiKey = encrypted.encrypted
      secretUpdates.encryptionIv = encrypted.iv
    }

    if (baseUrl) {
      const encrypted = await encrypt(baseUrl)
      secretUpdates.encryptedBaseUrl = encrypted.encrypted
    }

    await prisma.providerSecret.update({
      where: { endpointId: id },
      data: secretUpdates,
    })
  }

  const updated = await prisma.endpoint.update({
    where: { id },
    data: updateData,
  })

  return updated
}

export async function deleteEndpoint(id: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const endpoint = await prisma.endpoint.findFirst({
    where: {
      id,
      provider: { userId: session.userId },
    },
    include: { provider: true },
  })

  if (!endpoint) throw new Error('Endpoint not found or not owned by you')

  await prisma.$transaction([
    prisma.providerSecret.delete({ where: { endpointId: id } }),
    prisma.endpoint.delete({ where: { id } }),
    prisma.provider.update({
      where: { id: endpoint.providerId },
      data: { totalEndpoints: { decrement: 1 } },
    }),
  ])

  return { success: true }
}

export async function toggleEndpoint(id: string, active: boolean) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const endpoint = await prisma.endpoint.findFirst({
    where: {
      id,
      provider: { userId: session.userId },
    },
  })

  if (!endpoint) throw new Error('Endpoint not found or not owned by you')

  const updated = await prisma.endpoint.update({
    where: { id },
    data: { isActive: active },
  })

  return updated
}

export async function getProviderDashboard() {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const provider = await prisma.provider.findUnique({
    where: { userId: session.userId },
  })

  if (!provider) throw new Error('Not registered as a provider')

  const [endpoints, recentTransactions, totalStats] = await Promise.all([
    prisma.endpoint.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true, ratings: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        consumer: { select: { displayName: true, walletAddress: true } },
        endpoint: { select: { displayName: true, modelName: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: { providerId: provider.id, success: true },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    provider: {
      totalEarnings: provider.totalEarnings,
      totalRequests: provider.totalRequests.toString(),
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
    },
    endpoints,
    recentTransactions,
    stats: {
      totalRevenue: totalStats._sum.amount ?? '0',
      totalTransactions: totalStats._count,
    },
  }
}

export async function getProviderEndpoints() {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const provider = await prisma.provider.findUnique({
    where: { userId: session.userId },
  })

  if (!provider) throw new Error('Not registered as a provider')

  const endpoints = await prisma.endpoint.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { transactions: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
  })

  return endpoints
}
