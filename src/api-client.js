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

export const DEFAULT_API_URL = 'https://api.symbiosis.finance/crosschain'

/**
 * @typedef {Object} SymbiosisApiClientConfig
 * @property {string} [apiUrl] - The base URL of the Symbiosis API (defaults to {@link DEFAULT_API_URL}).
 */

/**
 * @typedef {Object} SymbiosisChain
 * @property {number} id - The numeric Symbiosis chain id.
 * @property {string} name - The human-readable chain name (e.g., `'Ethereum'`).
 * @property {string} explorer - The base URL of the chain's block explorer.
 * @property {string} icon - The URL of the chain's icon.
 * @property {boolean} hasDepository - Whether the chain supports deposit-address (depository) routes.
 */

/**
 * @typedef {Object} SymbiosisTokenAttributes
 * @property {string} [ton] - The real TON address, when the token lives on TON (the top-level `address` is a synthetic id).
 * @property {string} [solana] - The real Solana mint address, when the token lives on Solana.
 */

/**
 * @typedef {Object} SymbiosisToken
 * @property {string} symbol - The token symbol (e.g., `'USDT'`).
 * @property {string} name - The token display name.
 * @property {string} address - The token contract address; `''` for native gas tokens. For TON/Solana tokens this is a synthetic EVM-style id and the real address is in `attributes`.
 * @property {number} chainId - The Symbiosis chain id the token lives on.
 * @property {number} decimals - The number of decimals the token uses.
 * @property {number} [priceUsd] - The token's unit price in USD, when known.
 * @property {SymbiosisTokenAttributes} [attributes] - The non-EVM address attributes for TON/Solana tokens.
 */

/**
 * @typedef {Object} SymbiosisTokenAmount
 * @property {string} symbol - The token symbol.
 * @property {string} address - The token contract address; `''` for native gas tokens.
 * @property {number} chainId - The Symbiosis chain id the token lives on.
 * @property {number} decimals - The number of decimals the token uses.
 * @property {string} amount - The amount in base units, as a decimal string.
 * @property {number} [priceUsd] - The token's unit price in USD, when known.
 */

/**
 * @typedef {Object} SymbiosisFeeEntry
 * @property {string} provider - The fee provider key (e.g., `'symbiosis'`, `'partner'`).
 * @property {string} [description] - A human-readable fee description.
 * @property {SymbiosisTokenAmount} value - The fee amount and the token it is denominated in.
 */

/**
 * @typedef {Object} SymbiosisTokenRef
 * @property {string} address - The token contract address; `''` for native gas tokens.
 * @property {number} chainId - The Symbiosis chain id the token lives on.
 * @property {number} decimals - The number of decimals the token uses.
 * @property {string} symbol - The token symbol.
 * @property {SymbiosisTokenAttributes} [attributes] - The non-EVM address attributes for TON/Solana tokens.
 */

/**
 * @typedef {SymbiosisTokenRef & { amount: string }} SymbiosisTokenAmountRef
 */

/**
 * @typedef {Object} SymbiosisSwapRequest
 * @property {SymbiosisTokenAmountRef} tokenAmountIn - The input token and the amount to spend, in base units.
 * @property {SymbiosisTokenRef} tokenOut - The desired output token.
 * @property {string} from - The sender address on the source chain.
 * @property {string} to - The recipient address on the destination chain.
 * @property {number} slippage - The slippage tolerance in basis points.
 * @property {string} [partnerAddress] - The registered partner address to receive a share of the protocol fee.
 * @property {string} [refundAddress] - The refund address for deposit-address routes.
 */

/**
 * @typedef {Object} SymbiosisEvmTx
 * @property {string} to - The MetaRouter contract address to send the transaction to.
 * @property {string} data - The transaction calldata.
 * @property {string} [value] - The native value to attach, in wei, as a decimal string.
 */

/**
 * @typedef {Object} SymbiosisTonMessage
 * @property {string} address - The destination address of the TON message.
 * @property {string} amount - The amount of nanoTON to attach, as a decimal string.
 * @property {string} payload - The base64-encoded message body (BoC).
 */

/**
 * @typedef {Object} SymbiosisTonTx
 * @property {SymbiosisTonMessage[]} messages - The TON messages to send to perform the swap.
 */

/**
 * @typedef {Object} SymbiosisBtcTx
 * @property {string} depositAddress - The generated Bitcoin deposit address to transfer the input amount to.
 */

/**
 * @typedef {Object} SymbiosisSwapResponse
 * @property {string} type - The route type: `'evm'`, `'ton'`, `'btc'`, `'tron'` or `'solana'`.
 * @property {SymbiosisEvmTx | SymbiosisTonTx | SymbiosisBtcTx} tx - The route transaction payload; its shape depends on `type`.
 * @property {string} [approveTo] - The spender to grant the ERC-20 allowance to, for `evm` routes.
 * @property {SymbiosisFeeEntry[]} [fees] - The fees applied to the route.
 * @property {SymbiosisTokenAmount} tokenAmountOut - The estimated output amount.
 * @property {SymbiosisTokenAmount} tokenAmountOutMin - The minimum output amount after slippage.
 * @property {number} [estimatedTime] - The estimated completion time in seconds.
 * @property {string | number} [priceImpact] - The price impact as a percentage.
 */

/**
 * @typedef {SymbiosisSwapResponse} SymbiosisQuoteResponse
 */

/**
 * @typedef {Object} SymbiosisTxStatus
 * @property {number} code - The Symbiosis status code: `-1` not-found, `0` completed, `1` pending, `2` stuck, `3` reverted.
 * @property {string} [text] - A human-readable status description.
 */

/**
 * @typedef {Object} SymbiosisTxRef
 * @property {string} hash - The transaction hash.
 * @property {number} chainId - The chain id the transaction was included on.
 */

/**
 * @typedef {Object} SymbiosisTxStatusResponse
 * @property {SymbiosisTxStatus} [status] - The operation status.
 * @property {SymbiosisTxRef} [txIn] - The source (deposit) transaction.
 * @property {SymbiosisTxRef} [tx] - The destination (or refund) transaction.
 */

/**
 * Thin HTTP client for the Symbiosis cross-chain REST API.
 *
 * @see https://docs.symbiosis.finance/developer-tools/symbiosis-api
 */
export default class SymbiosisApiClient {
  /**
   * Creates a new Symbiosis API client.
   *
   * @param {SymbiosisApiClientConfig} [config] - The client configuration.
   */
  constructor ({ apiUrl } = {}) {
    this._apiUrl = (apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '')
  }

  /**
   * Lists the chains supported by the Symbiosis protocol.
   *
   * @returns {Promise<SymbiosisChain[]>} The supported chains.
   */
  async getChains () {
    return this._request('GET', '/v1/chains')
  }

  /**
   * Lists all tokens known to the Symbiosis protocol, including native
   * gas tokens, transit tokens and third-party loaded tokens.
   *
   * @returns {Promise<SymbiosisToken[]>} The supported tokens.
   */
  async getTokens () {
    return this._request('GET', '/v2/tokens')
  }

  /**
   * Returns a price quote and calldata for a swap operation.
   *
   * @param {SymbiosisSwapRequest} body - The swap request payload.
   * @returns {Promise<SymbiosisQuoteResponse>} The swap response.
   */
  async quote (body) {
    return this._request('POST', '/v2/quote', body)
  }

  /**
   * Same as {@link quote}, but for BTC routes it additionally generates
   * a Bitcoin deposit address. Rate limited to 1 request per second.
   *
   * @param {SymbiosisSwapRequest} body - The swap request payload.
   * @returns {Promise<SymbiosisSwapResponse>} The swap response.
   */
  async swap (body) {
    return this._request('POST', '/v2/swap', body)
  }

  /**
   * Returns the status of a cross-chain operation by the source chain id
   * and the source transaction hash.
   *
   * @param {number | string} chainId - The source chain id.
   * @param {string} hash - The source transaction hash.
   * @returns {Promise<SymbiosisTxStatusResponse>} The operation status.
   */
  async getTxStatus (chainId, hash) {
    return this._request('GET', `/v2/tx/${chainId}/${hash}`)
  }

  /**
   * Performs an HTTP request against the Symbiosis API.
   *
   * @protected
   * @param {string} method - The HTTP method.
   * @param {string} path - The API path.
   * @param {Record<string, unknown>} [body] - The optional JSON request body.
   * @returns {Promise<any>} The parsed JSON response.
   * @throws {Error} If the request fails or the API returns a non-2xx status.
   */
  async _request (method, path, body) {
    const res = await fetch(this._apiUrl + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    })

    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {}

    if (!res.ok) {
      const message = json?.message ??
        (Array.isArray(json?.errors) ? json.errors.map(e => e.message ?? e).join('; ') : null) ??
        (text || res.statusText)
      const error = new Error(`Symbiosis API request failed (${res.status}): ${message}`)
      error.status = res.status
      error.response = json
      throw error
    }

    return json
  }
}
