export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export async function checkEndpointHealth(
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ status: HealthStatus; latencyMs: number; error?: string }> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        temperature: 0,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      return {
        status: response.status >= 500 ? 'unhealthy' : 'degraded',
        latencyMs,
        error: `HTTP ${response.status}`,
      }
    }

    if (latencyMs > 5000) {
      return { status: 'degraded', latencyMs }
    }

    return { status: 'healthy', latencyMs }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    return {
      status: 'unhealthy',
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
