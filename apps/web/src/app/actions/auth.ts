"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signJWT, verifyJWT } from '@/lib/auth'
import { verifySignature } from '@/lib/stellar'

const COOKIE_NAME = 'inferx-session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

async function getUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

export async function connectWallet(
  walletAddress: string,
  signedMessage: string,
  signature: string
) {
  if (!walletAddress || !signedMessage || !signature) {
    throw new Error('walletAddress, signedMessage, and signature are required')
  }

  const isValid = verifySignature(walletAddress, signedMessage, signature)
  if (!isValid) {
    throw new Error('Invalid signature')
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: {
      walletAddress,
      displayName: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4),
      role: 'USER',
    },
  })

  const token = await signJWT({ userId: user.id, walletAddress: user.walletAddress })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return {
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    role: user.role,
    isProvider: user.isProvider,
    isConsumer: user.isConsumer,
  }
}

export async function disconnectWallet() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return { success: true }
}

export async function registerAsProvider(name: string, description: string) {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) throw new Error('User not found')

  if (user.isProvider) {
    throw new Error('Already registered as a provider')
  }

  const [updatedUser, provider] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { isProvider: true, role: 'PROVIDER' },
    }),
    prisma.provider.create({
      data: {
        userId: session.userId,
        name,
        description,
      },
    }),
  ])

  return {
    user: {
      id: updatedUser.id,
      isProvider: updatedUser.isProvider,
      role: updatedUser.role,
    },
    provider,
  }
}

export async function registerAsConsumer() {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const updatedUser = await prisma.user.update({
    where: { id: session.userId },
    data: { isConsumer: true, role: 'CONSUMER' },
  })

  return {
    id: updatedUser.id,
    isConsumer: updatedUser.isConsumer,
    role: updatedUser.role,
  }
}

export async function getCurrentUser() {
  const session = await getUserSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { provider: true },
  })

  if (!user) return null

  return {
    id: user.id,
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isProvider: user.isProvider,
    isConsumer: user.isConsumer,
    provider: user.provider,
  }
}
