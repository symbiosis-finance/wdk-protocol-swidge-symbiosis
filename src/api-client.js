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
 * Thin HTTP client for the Symbiosis cross-chain REST API.
 *
 * @see https://docs.symbiosis.finance/developer-tools/symbiosis-api
 */
export default class SymbiosisApiClient {
  /**
   * Creates a new Symbiosis API client.
   *
   * @param {Object} [config] - The client configuration.
   * @param {string} [config.apiUrl] - The base URL of the Symbiosis API.
   */
  constructor ({ apiUrl } = {}) {
    this._apiUrl = (apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '')
  }

  /**
   * Lists the chains supported by the Symbiosis protocol.
   *
   * @returns {Promise<Array<{ id: number, name: string, explorer: string, icon: string, hasDepository: boolean }>>} The supported chains.
   */
  async getChains () {
    return this._request('GET', '/v1/chains')
  }

  /**
   * Lists all tokens known to the Symbiosis protocol, including native
   * gas tokens, transit tokens and third-party loaded tokens.
   *
   * @returns {Promise<Array<Object>>} The supported tokens.
   */
  async getTokens () {
    return this._request('GET', '/v2/tokens')
  }

  /**
   * Returns a price quote and calldata for a swap operation.
   *
   * @param {Object} body - The swap request payload.
   * @returns {Promise<Object>} The swap response.
   */
  async quote (body) {
    return this._request('POST', '/v2/quote', body)
  }

  /**
   * Same as {@link quote}, but for BTC routes it additionally generates
   * a Bitcoin deposit address. Rate limited to 1 request per second.
   *
   * @param {Object} body - The swap request payload.
   * @returns {Promise<Object>} The swap response.
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
   * @returns {Promise<Object>} The operation status.
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
   * @param {Object} [body] - The optional JSON request body.
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
