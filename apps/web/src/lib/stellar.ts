import {
  rpc,
  Networks,
  TransactionBuilder,
  Operation,
  xdr,
  Contract,
  nativeToScVal,
  Horizon,
  Account,
  Transaction,
  xdr as StellarXdr,
} from '@stellar/stellar-sdk'
import { 
  getAddress, 
  signTransaction as freighterSignTransaction,
  requestAccess
} from '@stellar/freighter-api'

declare global {
  interface Window {
    freighterApi?: unknown
  }
}

const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
const networkPassphrase = isMainnet ? Networks.PUBLIC : Networks.TESTNET
const sorobanRpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org'
const horizonUrl = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org'

const sorobanClient = new rpc.Server(sorobanRpcUrl, { allowHttp: false })
const horizonClient = new Horizon.Server(horizonUrl)

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (typeof e.error === 'string') return e.error
    if (typeof e.msg === 'string') return e.msg
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

export async function connectToFreighter(): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Freighter can only be used in a browser environment.')
  }

  console.log('[InferX Wallet] Starting connection flow...')
  console.log('[InferX Wallet] window.freighterApi present at start:', !!window.freighterApi)

  // Try getAddress() directly first - it's the most reliable method across Freighter versions
  // Modern Freighter (v5+) handles permission prompts internally
  let address = ''
  let lastError: unknown = null

  try {
    console.log('[InferX Wallet] Calling getAddress()...')
    const result = await getAddress()
    console.log('[InferX Wallet] getAddress() returned:', result)

    if (result.error) {
      lastError = result.error
      console.warn('[InferX Wallet] getAddress() returned error object:', result.error)
    } else if (result.address && result.address.trim().length > 0) {
      address = result.address
    } else {
      // No error but no address either - try requestAccess
      console.log('[InferX Wallet] No address returned, trying requestAccess()...')
      const access = await requestAccess()
      console.log('[InferX Wallet] requestAccess() returned:', access)
      if (access.error) {
        lastError = access.error
      } else if (access.address) {
        address = access.address
      }
    }
  } catch (err) {
    console.error('[InferX Wallet] getAddress() threw exception:', err)
    lastError = err

    // Try requestAccess as fallback
    try {
      console.log('[InferX Wallet] Falling back to requestAccess()...')
      const access = await requestAccess()
      console.log('[InferX Wallet] requestAccess() returned:', access)
      if (access.error) {
        lastError = access.error
      } else if (access.address) {
        address = access.address
        lastError = null
      }
    } catch (err2) {
      console.error('[InferX Wallet] requestAccess() also threw:', err2)
      lastError = err2
    }
  }

  // If we got an address, return it regardless of errors
  if (address && address.trim().length > 0) {
    console.log('[InferX Wallet] ✓ Connected successfully:', address)
    return address
  }

  // If we have an error, give specific helpful messages
  if (lastError) {
    const msg = extractErrorMessage(lastError).toLowerCase()
    console.error('[InferX Wallet] ✗ Connection failed:', msg, lastError)

    if (msg.includes('denied') || msg.includes('rejected') || msg.includes('user') && msg.includes('cancel')) {
      throw new Error('Connection was cancelled or denied.')
    }
    if (msg.includes('not allowed') || msg.includes('permission')) {
      throw new Error('Permission denied. Please allow this site in Freighter\'s site access settings.')
    }
    if (msg.includes('locked')) {
      throw new Error('Freighter is locked. Please unlock it with your password and try again.')
    }
    if (msg.includes('no account') || msg.includes('no wallet')) {
      throw new Error('No account found in Freighter. Please create or import an account first.')
    }

    // Generic but includes the real error for debugging
    throw new Error(`Freighter error: ${extractErrorMessage(lastError)}`)
  }

  // No address and no explicit error - Freighter likely not installed
  const hasFreighterInjection = !!window.freighterApi
  if (!hasFreighterInjection) {
    throw new Error(
      'Freighter wallet extension was not detected. Please install it from https://www.freighter.app, then refresh this page.'
    )
  }

  throw new Error(
    'Could not connect to Freighter. Make sure the extension is enabled, you have an account set up, and try again.'
  )
}

export async function getFreighterPublicKey(): Promise<string> {
  const result = await getAddress()
  if (result.error) {
    throw new Error(`Failed to get Freighter public key: ${result.error.message}`)
  }
  return result.address
}

export function verifySignature(publicKey: string, message: string, signature: string): boolean {
  try {
    const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
    const keyPair = xdr.PublicKey.publicKeyTypeEd25519(
      Buffer.from(publicKey, 'base64') as unknown as Buffer
    )

    const hint = keyPair.ed25519().slice(-4)
    const decoratedSignature = new xdr.DecoratedSignature({
      hint,
      signature: sigBuffer as unknown as Buffer,
    })

    return decoratedSignature.signature().length === 64
  } catch {
    return false
  }
}

export async function signTransaction(xdrString: string): Promise<string> {
  const result = await freighterSignTransaction(xdrString, { networkPassphrase })
  if (result.error) {
    throw new Error(`Freighter signing failed: ${result.error.message}`)
  }
  return result.signedTxXdr
}

export async function getBalance(publicKey: string): Promise<string> {
  try {
    // Validate public key format (Stellar addresses are 56 characters starting with G)
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
      throw new Error('Invalid public key format')
    }

    const account = await horizonClient.loadAccount(publicKey)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')
    return xlmBalance?.balance ?? '0'
  } catch (error) {
    // Account not found (404) or bad request (400) means the account doesn't exist yet
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('404') || msg.includes('400') || msg.includes('bad request') || msg.includes('not found')) {
        return '0'
      }
    }
    // For any other error, return 0 instead of throwing
    console.error('Failed to fetch balance:', error)
    return '0'
  }
}

export async function submitTransaction(
  xdrString: string
): Promise<Horizon.HorizonApi.TransactionResponse> {
  const transaction = TransactionBuilder.fromXDR(xdrString, networkPassphrase)
  const response = await horizonClient.submitTransaction(transaction)
  return response as Horizon.HorizonApi.TransactionResponse
}

export function buildSorobanInvocation(
  contractId: string,
  functionName: string,
  args: Array<string | number | bigint | boolean | unknown>
): Transaction {
  const contract = new Contract(contractId)
  const sourcePublicKey = process.env.STELLAR_SOURCE_PUBLIC_KEY
  if (!sourcePublicKey) {
    throw new Error('STELLAR_SOURCE_PUBLIC_KEY environment variable is not set')
  }

  const scArgs: StellarXdr.ScVal[] = args.map(arg => {
    if (typeof arg === 'string') return nativeToScVal(arg, { type: 'string' })
    if (typeof arg === 'number') return nativeToScVal(arg, { type: 'i128' })
    if (typeof arg === 'bigint') return nativeToScVal(arg, { type: 'i128' })
    if (typeof arg === 'boolean') return nativeToScVal(arg)
    return nativeToScVal(arg)
  })

  const sourceAccount = new Account(sourcePublicKey, '0')

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contract.contractId(),
        function: functionName,
        args: scArgs,
      })
    )
    .setTimeout(30)
    .build()

  return transaction
}

export { sorobanClient, horizonClient, networkPassphrase, Horizon }
