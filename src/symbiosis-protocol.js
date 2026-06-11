// Copyright 2026 allush <al.lushnikov@yandex.ru>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { SwidgeProtocol } from '@tetherto/wdk-wallet/protocols'

import SymbiosisApiClient from './api-client.js'

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */
/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */

/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeOptions} SwidgeOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeQuote} SwidgeQuote */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeResult} SwidgeResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeFee} SwidgeFee */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeTransaction} SwidgeTransaction */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeProtocolConfig} SwidgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeStatus} SwidgeStatus */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeStatusOptions} SwidgeStatusOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeStatusResult} SwidgeStatusResult */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeSupportedChain} SwidgeSupportedChain */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeSupportedToken} SwidgeSupportedToken */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwidgeSupportedTokensOptions} SwidgeSupportedTokensOptions */

/**
 * @typedef {Object} SymbiosisProtocolConfig
 * @property {string | number} [chain] - The Symbiosis chain of the bound wallet account: either the numeric
 *   Symbiosis chain id or the chain name as returned by {@link SymbiosisProtocol#getSupportedChains}
 *   (e.g., `1`, `'Ethereum'`, `'TON'`, `'Bitcoin'`). Required to quote and execute swidge operations.
 * @property {string} [apiUrl] - The base URL of the Symbiosis API (defaults to `https://api.symbiosis.finance/crosschain`).
 * @property {number} [defaultSlippage] - The default slippage tolerance as a decimal (e.g., 0.01 for 1%). Defaults to 0.02.
 * @property {string} [partnerAddress] - The EVM address of a registered Symbiosis partner to receive a share of the protocol fee.
 * @property {string} [refundAddress] - The default refund address for deposit-address routes (e.g., swaps from Bitcoin).
 * @property {boolean} [skipApproval] - Skip the automatic ERC-20 allowance approval before executing an EVM route.
 * @property {number | bigint} [maxNetworkFeeBps] - Maximum acceptable network fee in basis points of the input amount.
 * @property {number | bigint} [maxProtocolFeeBps] - Maximum acceptable protocol fee in basis points of the input amount.
 */

const NATIVE_TOKEN_ALIASES = new Set(['', 'native', '0x0000000000000000000000000000000000000000'])

const CHAIN_TYPES = {
  bitcoin: 'utxo',
  ton: 'tvm',
  tron: 'tron',
  solana: 'svm'
}

const FEE_TYPES = {
  symbiosis: 'protocol',
  partner: 'affiliate'
}

const STATUS_BY_CODE = {
  // -1 (not found): the source transaction may not be indexed yet
  '-1': 'pending',
  0: 'completed',
  1: 'pending',
  // 2 (stuck): the operation requires a manual revert
  2: 'action-required',
  3: 'refunded'
}

const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000

export default class SymbiosisProtocol extends SwidgeProtocol {
  /**
   * Creates a new symbiosis swidge protocol without binding it to a wallet account.
   *
   * @overload
   * @param {undefined} [account] - The wallet account to use to interact with the protocol.
   * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
   */

  /**
   * Creates a new read-only symbiosis swidge protocol.
   *
   * @overload
   * @param {IWalletAccountReadOnly} account - The wallet account to use to interact with the protocol.
   * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
   */

  /**
   * Creates a new symbiosis swidge protocol.
   *
   * @overload
   * @param {IWalletAccount} account - The wallet account to use to interact with the protocol.
   * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
   */
  constructor (account, config = {}) {
    super(account, config)

    /**
     * The symbiosis protocol configuration.
     *
     * @protected
     * @type {SymbiosisProtocolConfig}
     */
    this._config = config

    /**
     * The Symbiosis API client.
     *
     * @protected
     * @type {SymbiosisApiClient}
     */
    this._api = new SymbiosisApiClient(config)

    /**
     * Cache for chain and token discovery responses.
     *
     * @protected
     * @type {Object<string, { timestamp: number, promise: Promise<any> }>}
     */
    this._discoveryCache = {}
  }

  /**
   * Quotes the estimated costs and output of a swidge operation.
   * Returns a non-binding quote; the actual execution is performed
   * by {@link swidge}.
   *
   * @param {SwidgeOptions} options - The swidge options.
   * @returns {Promise<SwidgeQuote>} The quoted swidge details.
   * @throws {Error} If the route is unsupported, or the protocol is misconfigured.
   */
  async quoteSwidge (options) {
    const { body } = await this._buildSwapRequest(options)
    const response = await this._api.quote(body)

    return {
      fromTokenAmount: BigInt(body.tokenAmountIn.amount),
      toTokenAmount: BigInt(response.tokenAmountOut.amount),
      toTokenAmountMin: BigInt(response.tokenAmountOutMin.amount),
      fees: this._mapFees(response.fees),
      estimatedDuration: response.estimatedTime,
      priceImpact: response.priceImpact != null ? Number(response.priceImpact) / 100 : undefined
    }
  }

  /**
   * Executes a swidge operation.
   *
   * The execution path depends on the route returned by Symbiosis:
   * - `evm` routes approve the input token (unless native or `skipApproval` is set) and send the calldata transaction.
   * - `ton` routes send the returned messages through the TON wallet account.
   * - `btc` routes transfer the input amount to the generated Bitcoin deposit address.
   * - `tron` and `solana` source routes are not yet executable through WDK wallet accounts and throw.
   *
   * @param {SwidgeOptions} options - The swidge options.
   * @param {SwidgeProtocolConfig} [config] - Optional execution configuration overriding the instance fee caps.
   * @returns {Promise<SwidgeResult>} The swidge execution result.
   * @throws {Error} If no account or a read-only account was given at construction, if a fee cap is
   *   exceeded, or if the route type cannot be executed by the bound wallet account.
   */
  async swidge (options, config) {
    const account = this._account
    if (!account || typeof account.sendTransaction !== 'function') {
      throw new Error('Cannot execute a swidge operation: the protocol was created without an account or with a read-only account.')
    }

    const { body, tokenIn } = await this._buildSwapRequest(options)
    const response = await this._api.swap(body)

    this._checkFeeLimits(response, body, tokenIn, config)

    const srcChainId = body.tokenAmountIn.chainId
    const amount = BigInt(body.tokenAmountIn.amount)
    /** @type {SwidgeTransaction[]} */
    const transactions = []
    let hash

    switch (response.type) {
      case 'evm': {
        const isNative = body.tokenAmountIn.address === ''
        if (!isNative && !this._config.skipApproval) {
          if (typeof account.approve !== 'function') {
            throw new Error('Cannot approve the input token: the wallet account does not support ERC-20 approvals.')
          }
          const approval = await account.approve({
            token: body.tokenAmountIn.address,
            spender: response.approveTo,
            amount
          })
          if (approval?.hash) {
            transactions.push({ hash: approval.hash, chain: srcChainId, type: 'approval' })
          }
        }

        const result = await account.sendTransaction({
          to: response.tx.to,
          value: BigInt(response.tx.value ?? 0),
          data: response.tx.data
        })
        hash = result.hash
        break
      }

      case 'ton': {
        for (const message of response.tx.messages) {
          const result = await account.sendTransaction({
            to: message.address,
            value: Number(message.amount),
            body: message.payload
          })
          hash = result.hash
        }
        break
      }

      case 'btc': {
        const result = await account.sendTransaction({
          to: response.tx.depositAddress,
          value: amount
        })
        hash = result.hash
        break
      }

      default:
        throw new Error(`Symbiosis returned a '${response.type}' transaction, which cannot be executed through the bound WDK wallet account yet. Use quoteSwidge() to retrieve the route and execute it externally.`)
    }

    transactions.push({ hash, chain: srcChainId, type: 'source' })

    return {
      id: `${srcChainId}:${hash}`,
      hash,
      fees: this._mapFees(response.fees),
      transactions,
      fromTokenAmount: amount,
      toTokenAmount: BigInt(response.tokenAmountOut.amount),
      toTokenAmountMin: BigInt(response.tokenAmountOutMin.amount)
    }
  }

  /**
   * Retrieves the current status of an in-flight swidge.
   *
   * @param {string} id - The swidge execution identifier returned by {@link swidge}
   *   (`'<sourceChainId>:<sourceTransactionHash>'`), or a bare source transaction hash
   *   combined with the `fromChain` status option.
   * @param {SwidgeStatusOptions} [options] - Optional hints to assist provider lookups.
   * @returns {Promise<SwidgeStatusResult>} The current swidge status.
   * @throws {Error} If the id is invalid, or no swidge exists with the given identifier.
   */
  async getSwidgeStatus (id, options) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('Invalid swidge identifier.')
    }

    let chain, hash
    const separator = id.indexOf(':')
    if (separator !== -1) {
      chain = id.slice(0, separator)
      hash = id.slice(separator + 1)
    } else {
      chain = options?.fromChain ?? this._config.chain
      hash = id
    }
    if (chain == null) {
      throw new Error('Cannot resolve the source chain of the swidge: pass an id in the \'<chainId>:<hash>\' format, or provide the fromChain status option.')
    }

    const { id: chainId } = await this._resolveChain(chain)

    let response
    try {
      response = await this._api.getTxStatus(chainId, hash)
    } catch (err) {
      if (err.status === 404) {
        throw new Error(`No swidge operation found for id '${id}'.`)
      }
      throw err
    }

    const status = STATUS_BY_CODE[response.status?.code] ?? 'pending'

    /** @type {SwidgeTransaction[]} */
    const transactions = []
    if (response.txIn?.hash) {
      transactions.push({ hash: response.txIn.hash, chain: response.txIn.chainId, type: 'source' })
    }
    if (response.tx?.hash) {
      transactions.push({
        hash: response.tx.hash,
        chain: response.tx.chainId,
        type: status === 'refunded' ? 'refund' : 'destination'
      })
    }

    return { status, transactions }
  }

  /**
   * Retrieves the chains supported by the Symbiosis protocol for swidge operations.
   *
   * @returns {Promise<SwidgeSupportedChain[]>} The supported chains.
   */
  async getSupportedChains () {
    const [chains, tokens] = await Promise.all([this._getChains(), this._getTokens()])

    const nativeByChain = new Map()
    for (const token of tokens) {
      if (token.address === '' && !nativeByChain.has(token.chainId)) {
        nativeByChain.set(token.chainId, token.symbol)
      }
    }

    return chains.map(chain => ({
      id: chain.id,
      name: chain.name,
      type: CHAIN_TYPES[chain.name.toLowerCase()] ?? 'evm',
      nativeToken: nativeByChain.get(chain.id) ?? ''
    }))
  }

  /**
   * Retrieves the tokens supported by the Symbiosis protocol for swidge operations.
   *
   * Symbiosis supports any-to-any routing, so when a `toChain` filter is given the
   * method lists the candidate destination tokens on that chain; otherwise it lists
   * the tokens of `fromChain`, or all known tokens when no filter is given.
   *
   * @param {SwidgeSupportedTokensOptions} [options] - Optional filters for chain- or route-scoped token discovery.
   * @returns {Promise<SwidgeSupportedToken[]>} The supported tokens.
   */
  async getSupportedTokens (options) {
    const tokens = await this._getTokens()

    let chainId
    const chainFilter = options?.toChain ?? options?.fromChain
    if (chainFilter != null) {
      chainId = (await this._resolveChain(chainFilter)).id
    }

    const filtered = chainId == null ? tokens : tokens.filter(t => t.chainId === chainId)

    return filtered.map(token => {
      const address = token.attributes?.ton ?? token.attributes?.solana ?? token.address
      return {
        token: address === '' ? token.symbol : address,
        chain: token.chainId,
        symbol: token.symbol,
        decimals: token.decimals,
        address: address === '' ? undefined : address,
        name: token.name
      }
    })
  }

  /**
   * Builds a Symbiosis `/v2/quote` and `/v2/swap` request payload from swidge options.
   *
   * @protected
   * @param {SwidgeOptions} options - The swidge options.
   * @returns {Promise<{ body: Object, tokenIn: Object, tokenOut: Object }>} The request payload and the resolved tokens.
   * @throws {Error} If the options are invalid or the route cannot be resolved.
   */
  async _buildSwapRequest (options) {
    if (options.toTokenAmount != null) {
      throw new Error('Symbiosis does not support exact-out operations: pass fromTokenAmount instead of toTokenAmount.')
    }
    if (options.fromTokenAmount == null) {
      throw new Error('The fromTokenAmount option is required.')
    }
    if (this._config.chain == null) {
      throw new Error('The symbiosis protocol configuration is missing the \'chain\' option identifying the source chain of the bound account.')
    }

    const srcChain = await this._resolveChain(this._config.chain)
    const dstChain = options.toChain != null ? await this._resolveChain(options.toChain) : srcChain

    const tokenIn = await this._resolveToken(srcChain, options.fromToken)

    let tokenOut
    try {
      tokenOut = await this._resolveToken(dstChain, options.toToken)
    } catch (err) {
      // The legacy bridge() interface passes the source-chain token identifier as the
      // destination token; fall back to the same token symbol on the destination chain.
      if (options.toToken === options.fromToken && dstChain.id !== srcChain.id) {
        tokenOut = await this._resolveToken(dstChain, tokenIn.symbol)
      } else {
        throw err
      }
    }

    const from = this._account ? await this._account.getAddress() : options.recipient
    if (!from) {
      throw new Error('Cannot resolve the sender address: bind a wallet account or pass the recipient option.')
    }
    const to = options.recipient ?? from

    const slippage = options.slippage ?? this._config.defaultSlippage ?? 0.02

    const body = {
      tokenAmountIn: {
        address: tokenIn.address,
        chainId: tokenIn.chainId,
        decimals: tokenIn.decimals,
        symbol: tokenIn.symbol,
        ...(tokenIn.attributes ? { attributes: tokenIn.attributes } : {}),
        amount: BigInt(options.fromTokenAmount).toString()
      },
      tokenOut: {
        address: tokenOut.address,
        chainId: tokenOut.chainId,
        decimals: tokenOut.decimals,
        symbol: tokenOut.symbol,
        ...(tokenOut.attributes ? { attributes: tokenOut.attributes } : {})
      },
      from,
      to,
      slippage: Math.round(slippage * 10000)
    }

    if (this._config.partnerAddress) body.partnerAddress = this._config.partnerAddress

    const refundAddress = options.refundAddress ?? this._config.refundAddress
    if (refundAddress) body.refundAddress = refundAddress

    return { body, tokenIn, tokenOut }
  }

  /**
   * Maps Symbiosis fee entries to the shared swidge fee shape.
   *
   * @protected
   * @param {Array<Object>} fees - The Symbiosis fee entries.
   * @returns {SwidgeFee[]} The mapped fees.
   */
  _mapFees (fees) {
    return (fees ?? []).map(fee => ({
      type: FEE_TYPES[fee.provider] ?? 'protocol',
      amount: BigInt(fee.value.amount),
      token: fee.value.address === '' ? fee.value.symbol : fee.value.address,
      chain: fee.value.chainId,
      included: true,
      description: fee.description ?? fee.provider
    }))
  }

  /**
   * Verifies the quoted fees against the configured fee caps.
   *
   * Fees are valued in USD when price data is available; otherwise the fee amount,
   * normalized by token decimals, is compared against the normalized input amount,
   * which is only an approximation for fees denominated in tokens whose unit value
   * differs from the input token.
   *
   * @protected
   * @param {Object} response - The Symbiosis swap response.
   * @param {Object} body - The request payload.
   * @param {Object} tokenIn - The resolved input token.
   * @param {SwidgeProtocolConfig} [config] - Optional execution configuration overriding the instance fee caps.
   * @throws {Error} If a configured fee cap is exceeded.
   */
  _checkFeeLimits (response, body, tokenIn, config) {
    const maxNetworkFeeBps = config?.maxNetworkFeeBps ?? this._config.maxNetworkFeeBps
    const maxProtocolFeeBps = config?.maxProtocolFeeBps ?? this._config.maxProtocolFeeBps
    if (maxNetworkFeeBps == null && maxProtocolFeeBps == null) return

    const amountIn = Number(body.tokenAmountIn.amount) / 10 ** body.tokenAmountIn.decimals
    const priceIn = tokenIn.priceUsd > 0 ? tokenIn.priceUsd : null

    const totals = { network: 0, protocol: 0 }
    for (const fee of response.fees ?? []) {
      const type = FEE_TYPES[fee.provider] ?? 'protocol'
      if (totals[type] === undefined) continue
      const feeAmount = Number(fee.value.amount) / 10 ** fee.value.decimals
      const priceFee = fee.value.priceUsd > 0 ? fee.value.priceUsd : null
      totals[type] += priceIn && priceFee
        ? (feeAmount * priceFee) / (amountIn * priceIn)
        : feeAmount / amountIn
    }

    for (const [type, cap] of [['network', maxNetworkFeeBps], ['protocol', maxProtocolFeeBps]]) {
      if (cap == null) continue
      const bps = totals[type] * 10000
      if (bps > Number(cap)) {
        throw new Error(`The quoted ${type} fee (${bps.toFixed(2)} bps) exceeds the configured maximum of ${cap} bps.`)
      }
    }
  }

  /**
   * Resolves a chain identifier (Symbiosis chain id or chain name) to a Symbiosis chain.
   *
   * @protected
   * @param {string | number} identifier - The chain identifier.
   * @returns {Promise<{ id: number, name: string }>} The resolved chain.
   * @throws {Error} If the chain is not supported by Symbiosis.
   */
  async _resolveChain (identifier) {
    const chains = await this._getChains()

    const numeric = typeof identifier === 'number' ? identifier : Number(identifier)
    if (Number.isFinite(numeric)) {
      const chain = chains.find(c => c.id === numeric)
      if (chain) return chain
    }
    if (typeof identifier === 'string') {
      const name = identifier.toLowerCase()
      const chain = chains.find(c => c.name.toLowerCase() === name)
      if (chain) return chain
    }

    throw new Error(`Chain '${identifier}' is not supported by Symbiosis. Use getSupportedChains() to list the supported chains.`)
  }

  /**
   * Resolves a token identifier to a Symbiosis token on the given chain.
   *
   * Accepts a token contract address (EVM, TON or Solana format), a token symbol,
   * or a native-token alias (`''`, `'native'`, or the zero address).
   *
   * @protected
   * @param {{ id: number, name: string }} chain - The chain to resolve the token on.
   * @param {string} identifier - The token identifier.
   * @returns {Promise<Object>} The resolved Symbiosis token.
   * @throws {Error} If the token is not in the Symbiosis token list.
   */
  async _resolveToken (chain, identifier) {
    if (typeof identifier !== 'string') {
      throw new Error('Token identifiers must be strings.')
    }

    const tokens = await this._getTokens()
    const needle = identifier.toLowerCase()
    const isNative = NATIVE_TOKEN_ALIASES.has(needle)

    const token = tokens.find(t => {
      if (t.chainId !== chain.id) return false
      if (isNative) return t.address === ''
      return t.address.toLowerCase() === needle ||
        t.attributes?.ton === identifier ||
        t.attributes?.solana === identifier ||
        t.symbol.toLowerCase() === needle
    })

    if (!token) {
      throw new Error(`Token '${identifier}' on chain '${chain.name}' is not in the Symbiosis token list. Use getSupportedTokens() to list the supported tokens.`)
    }
    return token
  }

  /**
   * Fetches the supported chains, caching the response.
   *
   * @protected
   * @returns {Promise<Array<Object>>} The supported chains.
   */
  async _getChains () {
    return this._cachedDiscovery('chains', () => this._api.getChains())
  }

  /**
   * Fetches the supported tokens, caching the response.
   *
   * @protected
   * @returns {Promise<Array<Object>>} The supported tokens.
   */
  async _getTokens () {
    return this._cachedDiscovery('tokens', () => this._api.getTokens())
  }

  /**
   * Returns a cached discovery response, refreshing it when stale.
   *
   * @protected
   * @param {string} key - The cache key.
   * @param {() => Promise<any>} fetcher - The fetcher producing a fresh response.
   * @returns {Promise<any>} The cached or fresh response.
   */
  async _cachedDiscovery (key, fetcher) {
    const entry = this._discoveryCache[key]
    if (entry && Date.now() - entry.timestamp < DISCOVERY_CACHE_TTL_MS) {
      return entry.promise
    }

    const promise = fetcher().catch(err => {
      delete this._discoveryCache[key]
      throw err
    })
    this._discoveryCache[key] = { timestamp: Date.now(), promise }
    return promise
  }
}
