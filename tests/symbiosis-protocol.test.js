import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import SymbiosisProtocol from '../index.js'

const API_URL = 'https://api.symbiosis.finance/crosschain'

const USDT_ETH = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ARB = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const USDT_ARB = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
const SENDER = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'

const CHAINS = [
  { id: 1, name: 'Ethereum', explorer: 'https://etherscan.io', icon: '', hasDepository: true },
  { id: 42161, name: 'Arbitrum One', explorer: 'https://arbiscan.io', icon: '', hasDepository: true },
  { id: 3652501241, name: 'Bitcoin', explorer: 'https://mempool.space', icon: '', hasDepository: false },
  { id: 85918, name: 'TON', explorer: 'https://tonviewer.com', icon: '', hasDepository: false },
  { id: 728126428, name: 'Tron', explorer: 'https://tronscan.org', icon: '', hasDepository: false }
]

const TOKENS = [
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
    attributes: { ton: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs' }
  }
]

const EVM_SWAP_RESPONSE = {
  type: 'evm',
  kind: 'crosschain-swap',
  tx: { chainId: 1, to: '0xMetaRouter', data: '0xcalldata', value: '0' },
  approveTo: '0xApproveGateway',
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

function mockFetch (routes) {
  return jest.fn(async (url, init = {}) => {
    const path = url.replace(API_URL, '')
    for (const [match, handler] of Object.entries(routes)) {
      if (path.startsWith(match)) {
        const result = typeof handler === 'function' ? handler(init) : handler
        const { status = 200, body = result } = result?.__http ? result : {}
        return {
          ok: status >= 200 && status < 300,
          status,
          statusText: String(status),
          text: async () => JSON.stringify(body)
        }
      }
    }
    throw new Error(`Unexpected request: ${path}`)
  })
}

describe('SymbiosisProtocol', () => {
  let account,
      protocol

  beforeEach(() => {
    account = {
      getAddress: jest.fn(async () => SENDER),
      sendTransaction: jest.fn(async () => ({ hash: '0xsourcehash', fee: 1n })),
      approve: jest.fn(async () => ({ hash: '0xapprovehash', fee: 1n }))
    }

    global.fetch = mockFetch({
      '/v1/chains': CHAINS,
      '/v2/tokens': TOKENS,
      '/v2/quote': EVM_SWAP_RESPONSE,
      '/v2/swap': EVM_SWAP_RESPONSE
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
        fees: [{
          type: 'protocol',
          amount: 250000n,
          token: USDC_ARB,
          chain: 42161,
          included: true,
          description: 'Cross-chain fee'
        }],
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
      })).rejects.toThrow('exact-out')
    })

    test('should throw if the source chain is not configured', async () => {
      const unconfigured = new SymbiosisProtocol(account)

      await expect(unconfigured.quoteSwidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        fromTokenAmount: 1n
      })).rejects.toThrow("missing the 'chain' option")
    })

    test('should throw if the token is unknown', async () => {
      await expect(protocol.quoteSwidge({
        fromToken: '0x0000000000000000000000000000000000000bad',
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow('not in the Symbiosis token list')
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
        spender: '0xApproveGateway',
        amount: 100000000n
      })
      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: '0xMetaRouter',
        value: 0n,
        data: '0xcalldata'
      })
      expect(result).toMatchObject({
        id: '1:0xsourcehash',
        hash: '0xsourcehash',
        fromTokenAmount: 100000000n,
        toTokenAmount: 99263949n,
        toTokenAmountMin: 97269184n,
        transactions: [
          { hash: '0xapprovehash', chain: 1, type: 'approval' },
          { hash: '0xsourcehash', chain: 1, type: 'source' }
        ]
      })
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
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/swap': {
          ...EVM_SWAP_RESPONSE,
          type: 'btc',
          tx: { depositAddress: 'bc1qdepositaddress', expiresAt: '2026-06-12T00:00:00Z' }
        }
      })
      const btcProtocol = new SymbiosisProtocol(account, {
        chain: 'Bitcoin',
        refundAddress: 'bc1qrefundaddress'
      })

      const result = await btcProtocol.swidge({
        fromToken: 'BTC',
        toToken: USDC_ARB,
        toChain: 42161,
        recipient: SENDER,
        fromTokenAmount: 50000n
      })

      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: 'bc1qdepositaddress',
        value: 50000n
      })
      expect(result.id).toBe('3652501241:0xsourcehash')
    })

    test('should perform a TON swidge operation by sending route messages', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/swap': {
          ...EVM_SWAP_RESPONSE,
          type: 'ton',
          tx: {
            validUntil: 1780000000,
            messages: [{ address: 'EQRouterAddress', amount: '300000000', payload: 'base64payload' }]
          }
        }
      })
      const tonProtocol = new SymbiosisProtocol(account, { chain: 'TON' })

      const result = await tonProtocol.swidge({
        fromToken: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        toToken: USDC_ARB,
        toChain: 42161,
        recipient: SENDER,
        fromTokenAmount: 1000000n
      })

      expect(account.sendTransaction).toHaveBeenCalledWith({
        to: 'EQRouterAddress',
        value: 300000000,
        body: 'base64payload'
      })
      expect(result.id).toBe('85918:0xsourcehash')
    })

    test('should throw on route types not executable through WDK accounts', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/swap': { ...EVM_SWAP_RESPONSE, type: 'tron' }
      })

      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      })).rejects.toThrow("'tron' transaction")
    })

    test('should throw if the swidge fees exceed the max protocol fee configuration', async () => {
      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxProtocolFeeBps: 10 })).rejects.toThrow('exceeds the configured maximum of 10 bps')
    })

    test('should pass when the swidge fees are below the fee caps', async () => {
      await expect(protocol.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 100000000n
      }, { maxProtocolFeeBps: 50, maxNetworkFeeBps: 50 })).resolves.toBeDefined()
    })

    test('should throw if the account is read-only', async () => {
      const readOnly = new SymbiosisProtocol({ getAddress: async () => SENDER }, { chain: 1 })

      await expect(readOnly.swidge({
        fromToken: USDT_ETH,
        toToken: USDC_ARB,
        toChain: 42161,
        fromTokenAmount: 1n
      })).rejects.toThrow('read-only')
    })
  })

  describe('getSwidgeStatus', () => {
    test('should successfully return the status of a completed operation', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/tx/1/0xsourcehash': {
          status: { code: 0, text: 'Success' },
          txIn: { hash: '0xsourcehash', chainId: 1 },
          tx: { hash: '0xdesthash', chainId: 42161 }
        }
      })

      const status = await protocol.getSwidgeStatus('1:0xsourcehash')

      expect(status).toEqual({
        status: 'completed',
        transactions: [
          { hash: '0xsourcehash', chain: 1, type: 'source' },
          { hash: '0xdesthash', chain: 42161, type: 'destination' }
        ]
      })
    })

    test('should map reverted operations to the refunded status', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/tx/1/0xsourcehash': {
          status: { code: 3, text: 'Reverted' },
          txIn: { hash: '0xsourcehash', chainId: 1 },
          tx: { hash: '0xreverthash', chainId: 1 }
        }
      })

      const status = await protocol.getSwidgeStatus('1:0xsourcehash')

      expect(status.status).toBe('refunded')
      expect(status.transactions[1]).toEqual({ hash: '0xreverthash', chain: 1, type: 'refund' })
    })

    test('should resolve the source chain from status options when the id is a bare hash', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/tx/42161/0xsourcehash': { status: { code: 1, text: 'Pending' } }
      })

      const status = await protocol.getSwidgeStatus('0xsourcehash', { fromChain: 'Arbitrum One' })

      expect(status.status).toBe('pending')
    })

    test('should throw if no operation exists for the given id', async () => {
      global.fetch = mockFetch({
        '/v1/chains': CHAINS,
        '/v2/tokens': TOKENS,
        '/v2/tx/1/0xmissing': { __http: true, status: 404, body: {} }
      })

      await expect(protocol.getSwidgeStatus('1:0xmissing'))
        .rejects.toThrow("No swidge operation found for id '1:0xmissing'")
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

      expect(tokens).toHaveLength(TOKENS.length)
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
          token: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
          chain: 85918,
          symbol: 'USDT',
          decimals: 6,
          address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
          name: 'USDt'
        }
      ])
    })

    test('should prefer the toChain filter for route-scoped discovery', async () => {
      const tokens = await protocol.getSupportedTokens({ fromChain: 'Ethereum', toChain: 42161 })

      expect(tokens.map(t => t.token).sort()).toEqual([USDC_ARB, USDT_ARB].sort())
      expect(tokens.every(t => t.chain === 42161)).toBe(true)
    })
  })

  describe('legacy interfaces (derived from swidge)', () => {
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
})
