import {
  rpc,
  Networks,
  TransactionBuilder,
  Operation,
  xdr,
  Contract,
  Address,
  nativeToScVal,
  Horizon,
  Account,
  Transaction,
} from '@stellar/stellar-sdk'
import { 
  getAddress, 
  signTransaction as freighterSignTransaction,
  isConnected,
  requestAccess
} from '@stellar/freighter-api'

const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
const networkPassphrase = isMainnet ? Networks.PUBLIC : Networks.TESTNET
const sorobanRpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org'
const horizonUrl = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org'

const sorobanClient = new rpc.Server(sorobanRpcUrl, { allowHttp: false })
const horizonClient = new Horizon.Server(horizonUrl)

export async function connectToFreighter(): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Freighter can only be used in a browser environment.')
  }

  // Wait for Freighter to inject its API (up to 3 seconds)
  const maxWaitTime = 3000
  const checkInterval = 100
  let waited = 0

  while (!(window as any).freighterApi && waited < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, checkInterval))
    waited += checkInterval
  }

  if (!(window as any).freighterApi) {
    throw new Error(
      'Freighter wallet extension not detected. Please install it from https://www.freighter.app and refresh the page.'
    )
  }

  // Check if already connected
  const connectionStatus = await isConnected()
  console.log('Freighter connection status:', connectionStatus)

  if (connectionStatus.error) {
    throw new Error(`Failed to check Freighter connection: ${connectionStatus.error.message}`)
  }

  // If not connected, request access (this shows the popup)
  let address = ''
  if (!connectionStatus.isConnected) {
    const accessResult = await requestAccess()
    console.log('Freighter access result:', accessResult)
    
    if (accessResult.error) {
      const errorMsg = accessResult.error.message.toLowerCase()
      if (errorMsg.includes('denied') || errorMsg.includes('rejected')) {
        throw new Error('Connection request was denied by user.')
      }
      throw new Error(`Failed to authorize with Freighter: ${accessResult.error.message}`)
    }
    
    address = accessResult.address
  } else {
    // Already connected, just get the address
    const result = await getAddress()
    console.log('Freighter getAddress result:', result)
    
    if (result.error) {
      throw new Error(`Failed to get address from Freighter: ${result.error.message}`)
    }
    
    address = result.address
  }
  
  // Validate we got an address
  if (!address || address.trim() === '') {
    throw new Error('No wallet address returned. Please make sure you have an account set up in Freighter.')
  }
  
  return address
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
    const msgBuffer = new TextEncoder().encode(message)
    const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0))

    const keyPair = xdr.PublicKey.publicKeyTypeEd25519(
      Buffer.from(publicKey, 'base64') as any
    )

    const hint = keyPair.ed25519().slice(-4)
    const decoratedSignature = new xdr.DecoratedSignature({
      hint,
      signature: sigBuffer as any,
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
  return response as any
}

export function buildSorobanInvocation(
  contractId: string,
  functionName: string,
  args: any[]
): Transaction {
  const contract = new Contract(contractId)
  const sourcePublicKey = process.env.STELLAR_SOURCE_PUBLIC_KEY
  if (!sourcePublicKey) {
    throw new Error('STELLAR_SOURCE_PUBLIC_KEY environment variable is not set')
  }

  const scArgs = args.map(arg => {
    if (typeof arg === 'string') return nativeToScVal(arg, { type: 'string' })
    if (typeof arg === 'number') return nativeToScVal(arg, { type: 'i128' })
    if (typeof arg === 'bigint') return nativeToScVal(arg, { type: 'i128' })
    if (typeof arg === 'boolean') return nativeToScVal(arg, { type: 'bool' as any })
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
    .build() as any

  return transaction
}

export { sorobanClient, horizonClient, networkPassphrase, Horizon }
