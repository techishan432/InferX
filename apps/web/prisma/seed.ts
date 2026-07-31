import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role, TransactionStatus, HealthStatus } from '@prisma/client'

const adapter = new PrismaPg(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inferx')
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Seeding database...')

  const provider1User = await prisma.user.upsert({
    where: { walletAddress: 'GPROVIDER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
    update: {},
    create: {
      walletAddress: 'GPROVIDER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      displayName: 'AlphaAI Labs',
      email: 'alpha@inferx.dev',
      bio: 'Premium AI inference provider specializing in high-throughput LLM endpoints.',
      role: Role.PROVIDER,
      isProvider: true,
      isConsumer: false,
    },
  })

  const provider2User = await prisma.user.upsert({
    where: { walletAddress: 'GPROVIDER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' },
    update: {},
    create: {
      walletAddress: 'GPROVIDER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      displayName: 'NeuralForge',
      email: 'neural@inferx.dev',
      bio: 'Open-source model hosting with competitive pricing and low latency.',
      role: Role.PROVIDER,
      isProvider: true,
      isConsumer: false,
    },
  })

  const consumerUser = await prisma.user.upsert({
    where: { walletAddress: 'GCONSUMER1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' },
    update: {},
    create: {
      walletAddress: 'GCONSUMER1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      displayName: 'DevTester',
      email: 'dev@inferx.dev',
      bio: 'Test consumer account for development.',
      role: Role.CONSUMER,
      isProvider: false,
      isConsumer: true,
    },
  })

  const provider1 = await prisma.provider.upsert({
    where: { userId: provider1User.id },
    update: {},
    create: {
      userId: provider1User.id,
      name: 'AlphaAI Labs',
      description: 'Enterprise-grade AI inference provider with 99.9% uptime guarantee.',
      isActive: true,
      totalEndpoints: 3,
      totalEarnings: 1250.5,
      totalRequests: BigInt(45000),
      averageRating: 4.7,
      totalReviews: 23,
    },
  })

  const provider2 = await prisma.provider.upsert({
    where: { userId: provider2User.id },
    update: {},
    create: {
      userId: provider2User.id,
      name: 'NeuralForge',
      description: 'Community-driven model hosting platform with transparent pricing.',
      isActive: true,
      totalEndpoints: 2,
      totalEarnings: 830.25,
      totalRequests: BigInt(28000),
      averageRating: 4.5,
      totalReviews: 15,
    },
  })

  const endpoint1 = await prisma.endpoint.create({
    data: {
      providerId: provider1.id,
      modelName: 'gpt-4o',
      displayName: 'OpenAI GPT-4o',
      description: 'Most capable OpenAI model with vision support. Ideal for complex reasoning and creative tasks.',
      pricePerRequest: 0.005,
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      contextLength: 128000,
      supportsVision: true,
      supportsStreaming: true,
      isActive: true,
      rateLimit: 120,
      latencyMs: 450,
      location: 'us-east-1',
      healthStatus: HealthStatus.ONLINE,
      averageRating: 4.8,
      totalReviews: 12,
    },
  })

  const endpoint2 = await prisma.endpoint.create({
    data: {
      providerId: provider1.id,
      modelName: 'deepseek-v3',
      displayName: 'DeepSeek V3',
      description: 'High-performance open-source model with strong coding and reasoning capabilities.',
      pricePerRequest: 0.001,
      maxInputTokens: 64000,
      maxOutputTokens: 8192,
      contextLength: 64000,
      supportsVision: false,
      supportsStreaming: true,
      isActive: true,
      rateLimit: 200,
      latencyMs: 320,
      location: 'us-west-2',
      healthStatus: HealthStatus.ONLINE,
      averageRating: 4.6,
      totalReviews: 8,
    },
  })

  const endpoint3 = await prisma.endpoint.create({
    data: {
      providerId: provider1.id,
      modelName: 'qwen-2.5-72b',
      displayName: 'Qwen 2.5 72B',
      description: 'Alibaba\'s flagship model excelling in multilingual understanding and code generation.',
      pricePerRequest: 0.002,
      maxInputTokens: 32768,
      maxOutputTokens: 8192,
      contextLength: 32768,
      supportsVision: false,
      supportsStreaming: true,
      isActive: true,
      rateLimit: 150,
      latencyMs: 380,
      location: 'ap-southeast-1',
      healthStatus: HealthStatus.ONLINE,
      averageRating: 4.5,
      totalReviews: 6,
    },
  })

  const endpoint4 = await prisma.endpoint.create({
    data: {
      providerId: provider2.id,
      modelName: 'llama-3.1-405b',
      displayName: 'Llama 3.1 405B',
      description: 'Meta\'s largest open-source model. Best-in-class performance for complex tasks.',
      pricePerRequest: 0.003,
      maxInputTokens: 128000,
      maxOutputTokens: 4096,
      contextLength: 128000,
      supportsVision: false,
      supportsStreaming: true,
      isActive: true,
      rateLimit: 60,
      latencyMs: 680,
      location: 'eu-west-1',
      healthStatus: HealthStatus.ONLINE,
      averageRating: 4.4,
      totalReviews: 9,
    },
  })

  const endpoint5 = await prisma.endpoint.create({
    data: {
      providerId: provider2.id,
      modelName: 'mistral-large-2',
      displayName: 'Mistral Large 2',
      description: 'Mistral AI\'s flagship model with excellent multilingual and code capabilities.',
      pricePerRequest: 0.004,
      maxInputTokens: 128000,
      maxOutputTokens: 8192,
      contextLength: 128000,
      supportsVision: false,
      supportsStreaming: true,
      isActive: true,
      rateLimit: 90,
      latencyMs: 520,
      location: 'eu-central-1',
      healthStatus: HealthStatus.ONLINE,
      averageRating: 4.6,
      totalReviews: 7,
    },
  })

  const tx1 = await prisma.transaction.create({
    data: {
      consumerId: consumerUser.id,
      providerId: provider1.id,
      endpointId: endpoint1.id,
      amount: 0.05,
      platformFee: 0.005,
      providerPayment: 0.045,
      success: true,
      stellarTxHash: 'abc123def456789abcdef0123456789abcdef0123456789abcdef0123456789a',
      tokensUsed: 1250,
      latencyMs: 430,
      status: TransactionStatus.SUCCESS,
    },
  })

  const tx2 = await prisma.transaction.create({
    data: {
      consumerId: consumerUser.id,
      providerId: provider1.id,
      endpointId: endpoint2.id,
      amount: 0.01,
      platformFee: 0.001,
      providerPayment: 0.009,
      success: true,
      stellarTxHash: 'def456abc789012345678901234567890123456789012345678901234567890b',
      tokensUsed: 800,
      latencyMs: 310,
      status: TransactionStatus.SUCCESS,
    },
  })

  const tx3 = await prisma.transaction.create({
    data: {
      consumerId: consumerUser.id,
      providerId: provider2.id,
      endpointId: endpoint4.id,
      amount: 0.03,
      platformFee: 0.003,
      providerPayment: 0.027,
      success: true,
      stellarTxHash: '789012abc345678901234567890123456789012345678901234567890123456c',
      tokensUsed: 2100,
      latencyMs: 650,
      status: TransactionStatus.SUCCESS,
    },
  })

  await prisma.rating.createMany({
    data: [
      {
        reviewerId: consumerUser.id,
        endpointId: endpoint1.id,
        rating: 5,
        comment: 'Excellent quality and fast responses. GPT-4o through InferX is seamless.',
      },
      {
        reviewerId: consumerUser.id,
        endpointId: endpoint2.id,
        rating: 4,
        comment: 'Great value for money. DeepSeek V3 handles coding tasks well.',
      },
      {
        reviewerId: consumerUser.id,
        endpointId: endpoint4.id,
        rating: 4,
        comment: 'Llama 405B is powerful but slightly higher latency than expected.',
      },
    ],
  })

  console.log('Seed complete!')
  console.log(`  Users: ${provider1User.displayName}, ${provider2User.displayName}, ${consumerUser.displayName}`)
  console.log(`  Endpoints: ${endpoint1.displayName}, ${endpoint2.displayName}, ${endpoint3.displayName}, ${endpoint4.displayName}, ${endpoint5.displayName}`)
  console.log(`  Transactions: 3`)
  console.log(`  Ratings: 3`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
