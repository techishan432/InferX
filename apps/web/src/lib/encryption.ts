async function getKey(key?: string): Promise<CryptoKey> {
  const rawKey = key ?? process.env.ENCRYPTION_KEY
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  const keyBuffer = Uint8Array.from(atob(rawKey), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encrypt(text: string, key?: string): Promise<{ encrypted: string; iv: string }> {
  const cryptoKey = await getKey(key)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const encoded = encoder.encode(text)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  )

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

export async function decrypt(encrypted: string, iv: string, key?: string): Promise<string> {
  const cryptoKey = await getKey(key)
  const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0))

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    cryptoKey,
    encryptedBuffer
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}
