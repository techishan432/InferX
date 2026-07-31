"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { getBalance } from '@/lib/stellar'

const COOKIE_NAME = 'inferx-session'

async function getUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

export async function getWalletBalance(publicKey: string) {
  if (!publicKey) throw new Error('Public key is required')
  const balance = await getBalance(publicKey)
  return { publicKey, balance }
}

export async function getPaymentHistory() {
  const session = await getUserSession()
  if (!session) throw new Error('Unauthorized')

  const payments = await prisma.payment.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return payments
}
