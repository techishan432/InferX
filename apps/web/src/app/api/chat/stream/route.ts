import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { countTokens } from '@/lib/inference'

async function getOrCreateSessionUser(request: Request) {
  const session = await getSession(request)
  if (session) return session

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

export async function POST(request: Request) {
  try {
    const session = await getOrCreateSessionUser(request)

    const { conversationId, content, images, endpointId } = await request.json()

    if (!content) {
      return Response.json({ error: 'content is required' }, { status: 400 })
    }

    if (conversationId) {
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

      if (!conversation) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (!conversation.endpoint.isActive) {
        return Response.json({ error: 'Endpoint is inactive' }, { status: 400 })
      }

      const previousMessages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      })

      await prisma.chatMessage.create({
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

      const secret = conversation.endpoint.providerSecret
      if (!secret) {
        return Response.json({ error: 'Endpoint is not configured' }, { status: 500 })
      }

      const apiKey = await decrypt(secret.encryptedApiKey, secret.encryptionIv)
      const baseUrl = await decrypt(secret.encryptedBaseUrl, secret.encryptionIv)

      const messages = [
        ...previousMessages.map((m: { role: string; content: string }) => ({
          role: m.role === 'USER' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content },
      ]

      const inferenceBody: Record<string, unknown> = {
        model: conversation.endpoint.modelName,
        messages: messages.map((msg: { role: string; content: unknown }) => {
          if (msg.role === 'user' && images && images.length > 0) {
            const msgContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: 'text', text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
            ]
            for (const image of images) {
              msgContent.push({ type: 'image_url', image_url: { url: image } })
            }
            return { role: msg.role, content: msgContent }
          }
          return msg
        }),
        stream: true,
        temperature: 0.7,
        max_tokens: conversation.endpoint.maxOutputTokens,
      }

      const providerResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(inferenceBody),
      })

      if (!providerResponse.ok) {
        const errorText = await providerResponse.text()
        return Response.json({ error: `Inference failed: ${errorText}` }, { status: 502 })
      }

      const providerBody = providerResponse.body
      if (!providerBody) {
        return Response.json({ error: 'No response body from provider' }, { status: 502 })
      }

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const reader = providerBody.getReader()

      let accumulatedContent = ''
      const userId = session.userId
      const convId = conversationId
      const epId = conversation.endpointId
      const endpointForBilling = conversation.endpoint

      const stream = new ReadableStream({
        async pull(controller) {
          try {
            const { done, value } = await reader.read()

            if (done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))

              const inputTokens = await countTokens(content)
              const outputTokens = await countTokens(accumulatedContent)
              const totalTokens = inputTokens + outputTokens

              const pricePerRequest = Number(endpointForBilling.pricePerRequest)
              const tokenCost = (totalTokens / 1_000_000) * 0.01
              const cost = Math.max(pricePerRequest, tokenCost)

              const platformFeeRate = 0.05
              const platformFee = cost * platformFeeRate
              const providerPayment = cost - platformFee

              await prisma.chatMessage.create({
                data: {
                  conversationId: convId,
                  userId,
                  endpointId: epId,
                  role: 'ASSISTANT',
                  content: accumulatedContent,
                  tokensUsed: totalTokens,
                  cost: cost.toFixed(7),
                },
              })

              await prisma.transaction.create({
                data: {
                  consumerId: userId,
                  providerId: endpointForBilling.providerId,
                  endpointId: epId,
                  amount: cost.toFixed(7),
                  platformFee: platformFee.toFixed(7),
                  providerPayment: providerPayment.toFixed(7),
                  success: true,
                  tokensUsed: totalTokens,
                  status: 'SUCCESS',
                },
              })

              await prisma.$transaction([
                prisma.endpoint.update({
                  where: { id: epId },
                  data: { totalRequests: { increment: 1 } },
                }),
                prisma.provider.update({
                  where: { id: endpointForBilling.providerId },
                  data: {
                    totalRequests: { increment: 1 },
                    totalEarnings: { increment: providerPayment },
                  },
                }),
              ])

              controller.close()
              return
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  continue
                }
                try {
                  const parsed = JSON.parse(data)
                  const deltaContent = parsed.choices?.[0]?.delta?.content ?? ''
                  if (deltaContent) {
                    accumulatedContent += deltaContent
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: deltaContent })}\n\n`)
                    )
                  }
                } catch {
                  // skip malformed chunks
                }
              }
            }
          } catch (error) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
            )
            controller.close()
          }
        },
        cancel() {
          reader.cancel()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    if (!endpointId) {
      return Response.json({ error: 'conversationId or endpointId is required' }, { status: 400 })
    }

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: {
        provider: true,
        providerSecret: true,
      },
    })

    if (!endpoint) {
      return Response.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    if (!endpoint.isActive) {
      return Response.json({ error: 'Endpoint is inactive' }, { status: 400 })
    }

    const secret = endpoint.providerSecret
    if (!secret) {
      return Response.json({ error: 'Endpoint is not configured' }, { status: 500 })
    }

    const apiKey = await decrypt(secret.encryptedApiKey, secret.encryptionIv)
    const baseUrl = await decrypt(secret.encryptedBaseUrl, secret.encryptionIv)

    const newConversation = await prisma.conversation.create({
      data: {
        userId: session.userId,
        endpointId,
        title: content.length > 50 ? content.slice(0, 50) + '...' : content,
      },
    })

    await prisma.chatMessage.create({
      data: {
        conversationId: newConversation.id,
        userId: session.userId,
        endpointId,
        role: 'USER',
        content,
      },
    })

    const inferenceBody: Record<string, unknown> = {
      model: endpoint.modelName,
      messages: [{ role: 'user', content }],
      stream: true,
      temperature: 0.7,
      max_tokens: endpoint.maxOutputTokens,
    }

    const providerResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(inferenceBody),
    })

    if (!providerResponse.ok) {
      const errorText = await providerResponse.text()
      return Response.json({ error: `Inference failed: ${errorText}` }, { status: 502 })
    }

    const providerBody = providerResponse.body
    if (!providerBody) {
      return Response.json({ error: 'No response body from provider' }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const reader = providerBody.getReader()
    let accumulatedContent2 = ''
    const userId2 = session.userId
    const convId2 = newConversation.id
    const epId2 = endpointId
    const endpointForBilling2 = endpoint

    const stream2 = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()

          if (done) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', conversationId: convId2 })}\n\n`))

            const inputTokens = await countTokens(content)
            const outputTokens = await countTokens(accumulatedContent2)
            const totalTokens = inputTokens + outputTokens

            const pricePerRequest = Number(endpointForBilling2.pricePerRequest)
            const tokenCost = (totalTokens / 1_000_000) * 0.01
            const cost = Math.max(pricePerRequest, tokenCost)

            const platformFeeRate = 0.05
            const platformFee = cost * platformFeeRate
            const providerPayment = cost - platformFee

            await prisma.chatMessage.create({
              data: {
                conversationId: convId2,
                userId: userId2,
                endpointId: epId2,
                role: 'ASSISTANT',
                content: accumulatedContent2,
                tokensUsed: totalTokens,
                cost: cost.toFixed(7),
              },
            })

            await prisma.transaction.create({
              data: {
                consumerId: userId2,
                providerId: endpointForBilling2.providerId,
                endpointId: epId2,
                amount: cost.toFixed(7),
                platformFee: platformFee.toFixed(7),
                providerPayment: providerPayment.toFixed(7),
                success: true,
                tokensUsed: totalTokens,
                status: 'SUCCESS',
              },
            })

            await prisma.$transaction([
              prisma.endpoint.update({
                where: { id: epId2 },
                data: { totalRequests: { increment: 1 } },
              }),
              prisma.provider.update({
                where: { id: endpointForBilling2.providerId },
                data: {
                  totalRequests: { increment: 1 },
                  totalEarnings: { increment: providerPayment },
                },
              }),
            ])

            controller.close()
            return
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                continue
              }
              try {
                const parsed = JSON.parse(data)
                const deltaContent = parsed.choices?.[0]?.delta?.content ?? ''
                if (deltaContent) {
                  accumulatedContent2 += deltaContent
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: deltaContent })}\n\n`)
                  )
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
          )
          controller.close()
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream2, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
