import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import SymbiosisProtocol, {
  SymbiosisProtocol as NamedSymbiosisProtocol,
  ISwidgeProtocol,
  SymbiosisError,
  ConfigurationError,
  ValidationError,
  ExactOutNotSupportedError,
  UnsupportedChainError,
  UnsupportedTokenError,
  ReadOnlyAccountError,
  UnsupportedRouteError,
  FeeLimitExceededError,
  TransactionError,
  ApiError
} from '../index.js'

const API_URL = 'https://api.symbiosis.finance/crosschain'

const USDT_ETH = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ARB = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const USDT_ARB = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
const TON_USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'
const SENDER = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'

const DUMMY_META_ROUTER = '0xb80fdacfbedc1b8e02f0c5d6e6e7e9e0f1a2b3c4'
const DUMMY_APPROVE_GATEWAY = '0xa2c1e4f6b8d0a2c4e6f8b0d2a4c6e8f0b2d4a6c8'
const DUMMY_CALLDATA = '0x415565b0000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7'
const DUMMY_SOURCE_TX_HASH = '0x9e1c0b6f3a2d4e5f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f'
const DUMMY_APPROVE_TX_HASH = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
const DUMMY_DEST_TX_HASH = '0x7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d'
const DUMMY_REFUND_TX_HASH = '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
const DUMMY_PENDING_TX_HASH = '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d'
const DUMMY_BTC_DEPOSIT_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const DUMMY_BTC_REFUND_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
const DUMMY_TON_ROUTER_ADDRESS = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y'
const DUMMY_TON_PAYLOAD = 'te6cckEBAQEAAgAAAEysuc0='
const DUMMY_TON_MESSAGE_AMOUNT = '300000000'

const DUMMY_CHAINS = [
  { id: 1, name: 'Ethereum', explorer: 'https://etherscan.io', icon: '', hasDepository: true },
  { id: 42161, name: 'Arbitrum One', explorer: 'https://arbiscan.io', icon: '', hasDepository: true },
  { id: 3652501241, name: 'Bitcoin', explorer: 'https://mempool.space', icon: '', hasDepository: false },
  { id: 85918, name: 'TON', explorer: 'https://tonviewer.com', icon: '', hasDepository: false },
  { id: 728126428, name: 'Tron', explorer: 'https://tronscan.org', icon: '', hasDepository: false }
]

const DUMMY_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '', chainId: 1, decimals: 18, priceUsd: 2000 },
  { symbol: 'USDT', name: 'Tether USD', address: USDT_ETH, chainId: 1, decimals: 6, priceUsd: 1 },
  { symbol: 'USDC', name: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6, priceUsd: 1 },
  { symbol: 'USDT', name: 'Tether USD', address: USDT_ARB, chainId: 42161, decimals: 6, priceUsd: 1 },
  { symbol: 'BTC', name: 'BTC', address: '', chainId: 3652501241, decimals: 8, priceUsd: 100000 },
  { symbol: 'TON', name: 'Toncoin', address: '', chainId: 85918, decimals: 9, priceUsd: 5 },
  {
    symbol: 'USDT',
    name: 'USDt',
    address: '0x9328Eb759596C38a25f59028B146Fecdc3621Dfe',
    chainId: 85918,
    decimals: 6,
    priceUsd: 1,
    attributes: { ton: TON_USDT_ADDRESS }
  }
]

const DUMMY_EVM_SWAP_RESPONSE = {
  type: 'evm',
  kind: 'crosschain-swap',
  tx: { chainId: 1, to: DUMMY_META_ROUTER, data: DUMMY_CALLDATA, value: '0' },
  approveTo: DUMMY_APPROVE_GATEWAY,
  fees: [
    {
      provider: 'symbiosis',
      description: 'Cross-chain fee',
      value: { symbol: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6, amount: '250000', priceUsd: 1 }
    }
  ],
  route: [],
  routes: [],
  priceImpact: '-0.13',
  tokenAmountOut: { symbol: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6, amount: '99263949' },
  tokenAmountOutMin: { symbol: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6, amount: '97269184' },
  rewards: [],
  inTradeType: 'dex',
  outTradeType: 'dex',
  estimatedTime: 43,
  labels: []
}

const DUMMY_MAPPED_FEES = [{
  type: 'protocol',
  amount: 250000n,
  token: USDC_ARB,
  chain: 42161,
  included: true,
  description: 'Cross-chain fee'
}]

function mockFetch (routes) {
  return jest.fn(async (url, init = {}) => {
    const path = url.replace(API_URL, '')
    for (const [match, handler] of Object.entries(routes)) {
      if (path.startsWith(match)) {
        const result = typeof handler === 'function' ? handler(init) : handler
        const { status = 200, body = result, text } = result?.__http ? result : {}
        return {
          ok: status >= 200 && status < 300,
          status,
          statusText: String(status),
          text: async () => text !== undefined ? text : JSON.stringify(body)
        }
      }
    }
    throw new Error(`Unexpected request: ${path}`)
  })
}

describe('@symbiosis-finance/wdk-protocol-swidge-symbiosis', () => {
  let account,
      protocol

  beforeEach(() => {
    account = {
      getAddress: jest.fn(async () => SENDER),
      sendTransaction: jest.fn(async () => ({ hash: DUMMY_SOURCE_TX_HASH, fee: 1n })),
      approve: jest.fn(async () => ({ hash: DUMMY_APPROVE_TX_HASH, fee: 1n }))
    }

    global.fetch = mockFetch({
      '/v1/chains': DUMMY_CHAINS,
      '/v2/tokens': DUMMY_TOKENS,
      '/v2/quote': DUMMY_EVM_SWAP_RESPONSE,
      '/v2/swap': DUMMY_EVM_SWAP_RESPONSE
    })

    protocol = new SymbiosisProtocol(account, { chain: 'Ethereum' })
  })

  describe('quoteSwidge', () => {
    test('should successfully quote a swidge operation (exact-in)', async () => {
      const quote = await protocol.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n,
        slippage: 0.02
      })

      expect(quote).toEqual({
        fromTokenAmount: 100000000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        fees: DUMMY_MAPPED_FEES,
        estimatedDuration: 43,
        priceImpact: -0.0013
      })

      const quoteCall = global.fetch.mock.calls.find(([url]) => url.endsWith('/v2/quote'))
      const body = JSON.parse(quoteCall[1].body)
      expect(body).toMatchObject({
        tokenAmountIn: { address: USDT_ETH, chainId: 1, decimals: 6, amount: '100000000' },
        tokenOut: { address: USDC_ARB, chainId: 42161, decimals: 6 },
        from: SENDER,
        to: SENDER,
        slippage: 200
      })
    })

    test('should resolve native tokens and token symbols', async () => {
      await protocol.quoteSwidge({
        fromToken: 'native',
        toToken: 'USDC',
        toChain: 'Arbitrum One',
        fromTokenAmount: 10n ** 18n
      })

      const quoteCall = global.fetch.mock.calls.find(([url]) => url.endsWith('/v2/quote'))
      const body = JSON.parse(quoteCall[1].body)
      expect(body.tokenAmountIn).toMatchObject({ address: '', chainId: 1, decimals: 18 })
      expect(body.tokenOut).toMatchObject({ address: USDC_ARB, chainId: 42161 })
    })

    test('should throw on an exact-out swidge operation', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        toTokenAmount: 100000000n
      })).rejects.toThrow(ExactOutNotSupportedError)
    })

    test('should throw if the source chain is not configured', async () => {
      const unconfigured = new SymbiosisProtocol(account)

      await expect(unconfigured.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        fromTokenAmount: 1n
      })).rejects.toThrow(ConfigurationError)
    })

    test('should throw if the token is unknown', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: '0x0000000000000000000000000000000000000bad',
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow(UnsupportedTokenError)
    })

    test('should throw if the fromTokenAmount option is missing', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161
      })).rejects.toThrow(ValidationError)
    })

    test('should throw if a token identifier is not a string', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: 42,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow(ValidationError)
    })

    test('should throw UnsupportedChainError for an unknown destination chain', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 'Nonexistent Chain',
        fromTokenAmount: 1n
      })).rejects.toThrow(UnsupportedChainError)
    })

    test('should rethrow when the destination token is unknown and no legacy fallback applies', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: '0x0000000000000000000000000000000000000bad',
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow(UnsupportedTokenError)
    })

    test('should throw if the sender cannot be resolved in quote-only mode', async () => {
      const quoteOnly = new SymbiosisProtocol(undefined, { chain: 'Ethereum' })

      await expect(quoteOnly.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow(ValidationError)
    })
  })

  describe('swidge', () => {
    test('should successfully perform an EVM swidge operation with approval', async () => {
      const result = await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })

      expect(account.approve).toHaveBeenCalledWith({
        token: USDT_ETH,
        spender: DUMMY_APPROVE_GATEWAY,
        amount: 100000000n
      })
      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: DUMMY_META_ROUTER,
        value: 0n,
        data: DUMMY_CALLDATA
      })
      expect(result).toEqual({
        id: `1:${DUMMY_SOURCE_TX_HASH}`,
        hash: DUMMY_SOURCE_TX_HASH,
        fees: DUMMY_MAPPED_FEES,
        fromTokenAmount: 100000000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        transactions: [
          { hash: DUMMY_APPROVE_TX_HASH, chain: 1, type: 'approval' },
          { hash: DUMMY_SOURCE_TX_HASH, chain: 1, type: 'source' }
        ]
      })
    })

    test('should skip approval when the existing allowance already covers the amount', async () => {
      account.getAllowance = jest.fn(async () => 100000000n)

      await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })

      expect(account.getAllowance).toHaveBeenCalledWith(USDT_ETH, DUMMY_APPROVE_GATEWAY)
      expect(account.approve).not.toHaveBeenCalled()
    })

    test('should approve when the existing allowance is insufficient', async () => {
      account.getAllowance = jest.fn(async () => 1n)

      await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })

      expect(account.approve).toHaveBeenCalledWith({
        token: USDT_ETH,
        spender: DUMMY_APPROVE_GATEWAY,
        amount: 100000000n
      })
    })

    test('should approve when the allowance cannot be read', async () => {
      account.getAllowance = jest.fn(async () => { throw new Error('no provider') })

      await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })

      expect(account.approve).toHaveBeenCalledWith({
        token: USDT_ETH,
        spender: DUMMY_APPROVE_GATEWAY,
        amount: 100000000n
      })
    })

    test('should wait for the approval receipt before sending the swap transaction', async () => {
      const order = []
      account.approve = jest.fn(async () => { order.push('approve'); return { hash: DUMMY_APPROVE_TX_HASH } })
      account.getTransactionReceipt = jest.fn(async () => { order.push('receipt'); return { status: 1 } })
      account.sendTransaction = jest.fn(async () => { order.push('send'); return { hash: DUMMY_SOURCE_TX_HASH } })

      await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })

      expect(account.getTransactionReceipt).toHaveBeenCalledWith(DUMMY_APPROVE_TX_HASH)
      expect(order).toEqual(['approve', 'receipt', 'send'])
    })

    test('should throw if the approval transaction reverts', async () => {
      account.getTransactionReceipt = jest.fn(async () => ({ status: 0 }))

      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })).rejects.toThrow('reverted')

      expect(account.sendTransaction).not.toHaveBeenCalled()
    })

    test('should not approve when the input token is native', async () => {
      await protocol.swidge({
        fromToken: '',
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 10n ** 18n
      })

      expect(account.approve).not.toHaveBeenCalled()
    })

    test('should perform a BTC deposit-address swidge operation', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        '/v2/swap': {
          ...DUMMY_EVM_SWAP_RESPONSE,
          type: 'btc',
          tx: { depositAddress: DUMMY_BTC_DEPOSIT_ADDRESS, expiresAt: '2026-06-12T00:00:00Z' }
        }
      })
      const btcProtocol = new SymbiosisProtocol(account, {
        chain: 'Bitcoin',
        refundAddress: DUMMY_BTC_REFUND_ADDRESS
      })

      const result = await btcProtocol.swidge({
        fromToken: 'BTC',
        toToken: USDC_ARB,
        toChain: 42161,
        recipient: SENDER,
        fromTokenAmount: 50000n
      })

      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: DUMMY_BTC_DEPOSIT_ADDRESS,
        value: 50000n
      })
      expect(result).toEqual({
        id: `3652501241:${DUMMY_SOURCE_TX_HASH}`,
        hash: DUMMY_SOURCE_TX_HASH,
        fees: DUMMY_MAPPED_FEES,
        fromTokenAmount: 50000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        transactions: [
          { hash: DUMMY_SOURCE_TX_HASH, chain: 3652501241, type: 'source' }
        ]
      })
    })

    test('should perform a TON swidge operation by sending route messages', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        '/v2/swap': {
          ...DUMMY_EVM_SWAP_RESPONSE,
          type: 'ton',
          tx: {
            validUntil: 1780000000,
            messages: [{ address: DUMMY_TON_ROUTER_ADDRESS, amount: DUMMY_TON_MESSAGE_AMOUNT, payload: DUMMY_TON_PAYLOAD }]
          }
        }
      })
      const tonProtocol = new SymbiosisProtocol(account, { chain: 'TON' })

      const result = await tonProtocol.swidge({
        fromToken: TON_USDT_ADDRESS,
        toToken: USDC_ARB,
        toChain: 42161,
        recipient: SENDER,
        fromTokenAmount: 1000000n
      })

      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: DUMMY_TON_ROUTER_ADDRESS,
        value: 300000000,
        body: DUMMY_TON_PAYLOAD
      })
      expect(result).toEqual({
        id: `85918:${DUMMY_SOURCE_TX_HASH}`,
        hash: DUMMY_SOURCE_TX_HASH,
        fees: DUMMY_MAPPED_FEES,
        fromTokenAmount: 1000000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        transactions: [
          { hash: DUMMY_SOURCE_TX_HASH, chain: 85918, type: 'source' }
        ]
      })
    })

    test('should throw on a Tron source route not executable through WDK accounts', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        '/v2/swap': { ...DUMMY_EVM_SWAP_RESPONSE, type: 'tron' }
      })

      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })).rejects.toThrow(UnsupportedRouteError)
    })

    test('should throw ReadOnlyAccountError when the account cannot approve an EVM route', async () => {
      const noApprove = new SymbiosisProtocol({
        getAddress: jest.fn(async () => SENDER),
        sendTransaction: jest.fn(async () => ({ hash: DUMMY_SOURCE_TX_HASH }))
      }, { chain: 'Ethereum' })

      await expect(noApprove.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })).rejects.toThrow(ReadOnlyAccountError)
    })

    test('should evaluate maxNetworkFeeBps in isolation without flagging protocol fees', async () => {
      // The Symbiosis fees map to the 'protocol'/'affiliate' categories, never 'network',
      // so a maxNetworkFeeBps cap alone must never be tripped by a (large) protocol fee.
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        '/v2/swap': {
          ...DUMMY_EVM_SWAP_RESPONSE,
          fees: [{
            provider: 'symbiosis',
            description: 'Cross-chain fee',
            value: { symbol: 'USDT', address: USDT_ETH, chainId: 1, decimals: 6, amount: '5000000', priceUsd: 1 }
          }]
        }
      })

      const result = await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxNetworkFeeBps: 1 })

      expect(result.id).toBe(`1:${DUMMY_SOURCE_TX_HASH}`)
    })

    test('should throw on a Solana source route not executable through WDK accounts', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        '/v2/swap': { ...DUMMY_EVM_SWAP_RESPONSE, type: 'solana' }
      })

      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })).rejects.toThrow(UnsupportedRouteError)
    })

    test('should throw if the swidge fees exceed the max protocol fee configuration', async () => {
      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxProtocolFeeBps: 10 })).rejects.toThrow(FeeLimitExceededError)
    })

    test('should pass when the swidge fees are below the fee caps', async () => {
      const result = await protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxProtocolFeeBps: 50, maxNetworkFeeBps: 50 })

      expect(result).toEqual({
        id: `1:${DUMMY_SOURCE_TX_HASH}`,
        hash: DUMMY_SOURCE_TX_HASH,
        fees: DUMMY_MAPPED_FEES,
        fromTokenAmount: 100000000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        transactions: [
          { hash: DUMMY_APPROVE_TX_HASH, chain: 1, type: 'approval' },
          { hash: DUMMY_SOURCE_TX_HASH, chain: 1, type: 'source' }
        ]
      })
    })

    test('should compare fees by normalized amount when USD prices are unavailable', async () => {
      // No priceUsd on the fee or the input token: the cap check falls back to
      // comparing decimal-normalized amounts directly.
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': [
          { symbol: 'USDT', name: 'Tether USD', address: USDT_ETH, chainId: 1, decimals: 6 },
          { symbol: 'USDC', name: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6 }
        ],
        '/v2/swap': {
          ...DUMMY_EVM_SWAP_RESPONSE,
          fees: [{
            provider: 'symbiosis',
            description: 'Cross-chain fee',
            value: { symbol: 'USDC', address: USDC_ARB, chainId: 42161, decimals: 6, amount: '250000' }
          }]
        }
      })

      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxProtocolFeeBps: 10 })).rejects.toThrow(FeeLimitExceededError)
    })

    test('should throw if the account is read-only', async () => {
      const readOnly = new SymbiosisProtocol({ getAddress: async () => SENDER }, { chain: 1 })

      await expect(readOnly.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow(ReadOnlyAccountError)
    })

    test('should throw a TransactionError when the receipt does not appear before the timeout', async () => {
      account.getTransactionReceipt = jest.fn(async () => null)

      await expect(
        protocol._waitForReceipt(account, DUMMY_APPROVE_TX_HASH, { intervalMs: 1, timeoutMs: 5 })
      ).rejects.toThrow(TransactionError)
    })
  })

  describe('getSwidgeStatus', () => {
    test('should successfully return the status of a completed operation', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: {
          status: { code: 0, text: 'Success' },
          txIn: { hash: DUMMY_SOURCE_TX_HASH, chainId: 1 },
          tx: { hash: DUMMY_DEST_TX_HASH, chainId: 42161 }
        }
      })

      const status = await protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`)

      expect(status).toEqual({
        status: 'completed',
        transactions: [
          { hash: DUMMY_SOURCE_TX_HASH, chain: 1, type: 'source' },
          { hash: DUMMY_DEST_TX_HASH, chain: 42161, type: 'destination' }
        ]
      })
    })

    test('should map reverted operations to the refunded status', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: {
          status: { code: 3, text: 'Reverted' },
          txIn: { hash: DUMMY_SOURCE_TX_HASH, chainId: 1 },
          tx: { hash: DUMMY_REFUND_TX_HASH, chainId: 1 }
        }
      })

      const status = await protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`)

      expect(status).toEqual({
        status: 'refunded',
        transactions: [
          { hash: DUMMY_SOURCE_TX_HASH, chain: 1, type: 'source' },
          { hash: DUMMY_REFUND_TX_HASH, chain: 1, type: 'refund' }
        ]
      })
    })

    test('should resolve the source chain from status options when the id is a bare hash', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/42161/${DUMMY_SOURCE_TX_HASH}`]: { status: { code: 1, text: 'Pending' } }
      })

      const status = await protocol.getSwidgeStatus(DUMMY_SOURCE_TX_HASH, { fromChain: 'Arbitrum One' })

      expect(status).toEqual({ status: 'pending', transactions: [] })
    })

    test('should treat a 404 as pending while the source transaction is not yet indexed', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_PENDING_TX_HASH}`]: { __http: true, status: 404, body: {} }
      })

      const status = await protocol.getSwidgeStatus(`1:${DUMMY_PENDING_TX_HASH}`)

      expect(status).toEqual({
        status: 'pending',
        transactions: [{ hash: DUMMY_PENDING_TX_HASH, chain: 1, type: 'source' }]
      })
    })

    test('should map the stuck status code to pending (non-terminal, self-resolving)', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: {
          status: { code: 2, text: 'Stuck' },
          txIn: { hash: DUMMY_SOURCE_TX_HASH, chainId: 1 }
        }
      })

      const status = await protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`)

      expect(status).toEqual({
        status: 'pending',
        transactions: [{ hash: DUMMY_SOURCE_TX_HASH, chain: 1, type: 'source' }]
      })
    })

    test('should default to pending for an unknown status code', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: { status: { code: 99 } }
      })

      const status = await protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`)

      expect(status).toEqual({ status: 'pending', transactions: [] })
    })

    test('should throw a ValidationError for a malformed (empty) swidge id', async () => {
      await expect(protocol.getSwidgeStatus('')).rejects.toThrow(ValidationError)
    })

    test('should throw a ValidationError for a non-string swidge id', async () => {
      await expect(protocol.getSwidgeStatus(null)).rejects.toThrow(ValidationError)
    })

    test('should throw a ValidationError when the source chain of a bare hash cannot be resolved', async () => {
      const unconfigured = new SymbiosisProtocol(account)

      await expect(unconfigured.getSwidgeStatus(DUMMY_SOURCE_TX_HASH)).rejects.toThrow(ValidationError)
    })

    test('should rethrow a non-404 API error as an ApiError', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: { __http: true, status: 500, body: { message: 'boom' } }
      })

      await expect(protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`)).rejects.toThrow(ApiError)
    })

    test('should build the ApiError message from an errors array', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: {
          __http: true,
          status: 400,
          body: { errors: [{ message: 'bad hash' }, 'also bad'] }
        }
      })

      await expect(protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`))
        .rejects.toThrow('bad hash; also bad')
    })

    test('should fall back to the response text when the error body is not JSON', async () => {
      global.fetch = mockFetch({
        '/v1/chains': DUMMY_CHAINS,
        '/v2/tokens': DUMMY_TOKENS,
        [`/v2/tx/1/${DUMMY_SOURCE_TX_HASH}`]: { __http: true, status: 502, text: 'Bad Gateway' }
      })

      await expect(protocol.getSwidgeStatus(`1:${DUMMY_SOURCE_TX_HASH}`))
        .rejects.toThrow('Bad Gateway')
    })
  })

  describe('discovery caching', () => {
    test('should not cache a failed discovery response and surface it as an ApiError', async () => {
      let calls = 0
      global.fetch = mockFetch({
        '/v2/tokens': () => {
          calls++
          return { __http: true, status: 503, body: { message: 'unavailable' } }
        }
      })

      await expect(protocol.getSupportedTokens()).rejects.toThrow(ApiError)
      // The rejected discovery must not be cached: a second call retries the fetch.
      await expect(protocol.getSupportedTokens()).rejects.toThrow(ApiError)
      expect(calls).toBe(2)
    })
  })

  describe('getSupportedChains', () => {
    test('should successfully return supported chains with types and native tokens', async () => {
      const chains = await protocol.getSupportedChains()

      expect(chains).toEqual([
        { id: 1, name: 'Ethereum', type: 'evm', nativeToken: 'ETH' },
        { id: 42161, name: 'Arbitrum One', type: 'evm', nativeToken: '' },
        { id: 3652501241, name: 'Bitcoin', type: 'utxo', nativeToken: 'BTC' },
        { id: 85918, name: 'TON', type: 'tvm', nativeToken: 'TON' },
        { id: 728126428, name: 'Tron', type: 'tron', nativeToken: '' }
      ])
    })
  })

  describe('getSupportedTokens', () => {
    test('should successfully return supported tokens', async () => {
      const tokens = await protocol.getSupportedTokens()

      expect(tokens).toHaveLength(DUMMY_TOKENS.length)
      expect(tokens.find(t => t.symbol === 'USDT' && t.chain === 1)).toEqual({
        token: USDT_ETH,
        chain: 1,
        symbol: 'USDT',
        decimals: 6,
        address: USDT_ETH,
        name: 'Tether USD'
      })
    })

    test('should filter tokens by chain when options are provided', async () => {
      const tokens = await protocol.getSupportedTokens({ fromChain: 'TON' })

      expect(tokens).toEqual([
        { token: 'TON', chain: 85918, symbol: 'TON', decimals: 9, address: undefined, name: 'Toncoin' },
        {
          token: TON_USDT_ADDRESS,
          chain: 85918,
          symbol: 'USDT',
          decimals: 6,
          address: TON_USDT_ADDRESS,
          name: 'USDt'
        }
      ])
    })

    test('should prefer the toChain filter for route-scoped discovery', async () => {
      const tokens = await protocol.getSupportedTokens({ fromChain: 'Ethereum', toChain: 42161 })

      expect(tokens).toEqual([
        { token: USDC_ARB, chain: 42161, symbol: 'USDC', decimals: 6, address: USDC_ARB, name: 'USDC' },
        { token: USDT_ARB, chain: 42161, symbol: 'USDT', decimals: 6, address: USDT_ARB, name: 'Tether USD' }
      ])
    })
  })

  describe('legacy interfaces (derived from swidge)', () => {
    test('swap should delegate to swidge and aggregate all fees into the legacy fee', async () => {
      const result = await protocol.swap({
        tokenIn: USDT_ETH,
        tokenOut: 'ETH',
        to: SENDER,
        tokenInAmount: 100000000n
      })

      expect(result).toEqual({
        hash: `1:${DUMMY_SOURCE_TX_HASH}`,
        fee: 250000n,
        tokenInAmount: 100000000n,
        tokenOutAmount: 99263949n
      })
    })

    test('quoteSwap should delegate to quoteSwidge and aggregate all fees', async () => {
      const quote = await protocol.quoteSwap({
        tokenIn: USDT_ETH,
        tokenOut: 'ETH',
        to: SENDER,
        tokenInAmount: 100000000n
      })

      expect(quote).toEqual({
        fee: 250000n,
        tokenInAmount: 100000000n,
        tokenOutAmount: 99263949n
      })
    })

    test('bridge should delegate to swidge, resolving the destination token by symbol', async () => {
      const result = await protocol.bridge({
        targetChain: 42161,
        token: USDT_ETH,
        amount: 100000000n,
        recipient: SENDER
      })

      // No network-type fees are emitted, so the legacy fee is 0n and the
      // Symbiosis protocol fee surfaces as bridgeFee.
      expect(result).toEqual({
        hash: `1:${DUMMY_SOURCE_TX_HASH}`,
        fee: 0n,
        bridgeFee: 250000n
      })
    })

    test('quoteBridge should delegate to quoteSwidge', async () => {
      const quote = await protocol.quoteBridge({
        targetChain: 42161,
        token: USDT_ETH,
        amount: 100000000n,
        recipient: SENDER
      })

      expect(quote).toEqual({ fee: 0n, bridgeFee: 250000n })
    })
  })

  describe('module exports (index.js)', () => {
    test('should expose the default and named SymbiosisProtocol export as the same class', () => {
      expect(NamedSymbiosisProtocol).toBe(SymbiosisProtocol)
      expect(protocol).toBeInstanceOf(SymbiosisProtocol)
    })

    test('should re-export the ISwidgeProtocol interface from wdk-wallet', () => {
      expect(typeof ISwidgeProtocol).toBe('function')
    })

    test('should export every typed error class', () => {
      for (const ErrorClass of [
        SymbiosisError, ConfigurationError, ValidationError, ExactOutNotSupportedError,
        UnsupportedChainError, UnsupportedTokenError, ReadOnlyAccountError,
        UnsupportedRouteError, FeeLimitExceededError, TransactionError, ApiError
      ]) {
        expect(typeof ErrorClass).toBe('function')
        expect(ErrorClass.prototype).toBeInstanceOf(Error)
      }
    })
  })

  describe('typed errors', () => {
    test('every typed error extends SymbiosisError and carries its own name', () => {
      const cases = [
        [new SymbiosisError('x'), 'SymbiosisError'],
        [new ConfigurationError('x'), 'ConfigurationError'],
        [new ValidationError('x'), 'ValidationError'],
        [new ExactOutNotSupportedError(), 'ExactOutNotSupportedError'],
        [new UnsupportedChainError('Foo'), 'UnsupportedChainError'],
        [new UnsupportedTokenError('BAR', 'Foo'), 'UnsupportedTokenError'],
        [new ReadOnlyAccountError('x'), 'ReadOnlyAccountError'],
        [new UnsupportedRouteError('tron'), 'UnsupportedRouteError'],
        [new FeeLimitExceededError('protocol', 12.34, 10), 'FeeLimitExceededError'],
        [new TransactionError('x', '0xabc'), 'TransactionError'],
        [new ApiError('x', 500, { message: 'x' }), 'ApiError']
      ]

      for (const [err, name] of cases) {
        expect(err).toBeInstanceOf(SymbiosisError)
        expect(err).toBeInstanceOf(Error)
        expect(err.name).toBe(name)
      }
    })

    test('should preserve typed-error metadata', () => {
      expect(new UnsupportedChainError('Foo').identifier).toBe('Foo')
      expect(new UnsupportedTokenError('BAR').identifier).toBe('BAR')
      expect(new UnsupportedRouteError('solana').type).toBe('solana')

      const feeErr = new FeeLimitExceededError('protocol', 12.34, 10)
      expect(feeErr.feeType).toBe('protocol')
      expect(feeErr.cap).toBe(10)

      expect(new TransactionError('reverted', '0xabc').hash).toBe('0xabc')

      const apiErr = new ApiError('failed', 404, { message: 'not found' })
      expect(apiErr.status).toBe(404)
      expect(apiErr.response).toEqual({ message: 'not found' })

      const cause = new Error('root')
      expect(new SymbiosisError('wrapped', { cause }).cause).toBe(cause)
    })

    test('UnsupportedTokenError should omit the chain when none is given', () => {
      expect(new UnsupportedTokenError('BAR').message).not.toContain('on chain')
      expect(new UnsupportedTokenError('BAR', 'Ethereum').message).toContain("on chain 'Ethereum'")
    })
  })
})
