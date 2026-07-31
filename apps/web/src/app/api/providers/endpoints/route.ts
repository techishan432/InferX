import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: session.userId },
    })

    if (!provider) {
      return Response.json({ error: 'Not registered as a provider' }, { status: 403 })
    }

    const data = await request.json()

    const {
      modelName,
      displayName,
      pricePerRequest,
      maxInputTokens,
      maxOutputTokens,
      contextLength,
      supportsVision,
      supportsStreaming,
      apiKey,
      baseUrl,
      rateLimit,
      location,
      description,
    } = data

    if (!modelName || !displayName || !pricePerRequest || !apiKey || !baseUrl) {
      return Response.json(
        { error: 'modelName, displayName, pricePerRequest, apiKey, and baseUrl are required' },
        { status: 400 }
      )
    }

    const encryptedApiKey = await encrypt(apiKey)
    const encryptedBaseUrl = await encrypt(baseUrl)

    const endpoint = await prisma.$transaction(async (tx: any) => {
      const newEndpoint = await tx.endpoint.create({
        data: {
          providerId: provider.id,
          modelName,
          displayName,
          description,
          pricePerRequest,
          maxInputTokens: maxInputTokens ?? 4096,
          maxOutputTokens: maxOutputTokens ?? 4096,
          contextLength: contextLength ?? 8192,
          supportsVision: supportsVision ?? false,
          supportsStreaming: supportsStreaming ?? true,
          rateLimit: rateLimit ?? 60,
          location,
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

    return Response.json({ endpoint }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: session.userId },
    })

    if (!provider) {
      return Response.json({ error: 'Not registered as a provider' }, { status: 403 })
    }

    const endpoints = await prisma.endpoint.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true, ratings: true } },
      },
    })

    return Response.json({ endpoints })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
