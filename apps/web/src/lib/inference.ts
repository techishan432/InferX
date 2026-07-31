export interface ChatMessage {
  role: string
  content: string | Record<string, unknown> | Array<Record<string, unknown>>
}

export interface InferenceParams {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  maxTokens?: number
  images?: string[]
}

export async function inference(params: InferenceParams): Promise<Response> {
  const {
    baseUrl,
    apiKey,
    model,
    messages,
    stream = false,
    temperature = 0.7,
    maxTokens = 4096,
    images,
  } = params

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages: messages.map(msg => {
          if (msg.role === 'user' && images && images.length > 0) {
            const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: 'text', text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
            ]
            for (const image of images) {
              content.push({
                type: 'image_url',
                image_url: { url: image },
              })
            }
            return { role: msg.role, content }
          }
          return msg
        }),
        stream,
        temperature,
        max_tokens: maxTokens,
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} ${errorText}`)
      }

      return response
    } catch (error) {
      lastError = error as Error

      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
        throw new Error('Request timed out after 30 seconds')
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
    }
  }

  throw lastError ?? new Error('Inference request failed')
}

export async function countTokens(text: string): Promise<number> {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return Math.ceil(bytes.length / 4)
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPrice: number,
  outputPrice: number
): number {
  const inputCost = (inputTokens / 1_000_000) * inputPrice
  const outputCost = (outputTokens / 1_000_000) * outputPrice
  return inputCost + outputCost
}
