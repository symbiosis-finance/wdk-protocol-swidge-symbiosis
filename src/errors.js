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

/**
 * Base class for every error thrown by the Symbiosis swidge protocol module.
 *
 * All typed errors below extend this class, so consumers can catch the whole
 * family with a single `instanceof SymbiosisError` check and still narrow down
 * to a specific subclass when they need to.
 */
export class SymbiosisError extends Error {
  /**
   * Creates a new Symbiosis error.
   *
   * @param {string} message - The human-readable error message.
   * @param {{ cause?: unknown }} [options] - Optional error options; `cause` preserves the underlying error.
   */
  constructor (message, options = {}) {
    super(message)
    this.name = 'SymbiosisError'
    if (options.cause !== undefined) this.cause = options.cause
  }
}

/**
 * Thrown when the protocol instance is misconfigured — most commonly when the
 * required `chain` option identifying the bound account's source chain is missing.
 */
export class ConfigurationError extends SymbiosisError {
  /**
   * @param {string} message - The human-readable error message.
   */
  constructor (message) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

/**
 * Thrown when the arguments passed to a public method are invalid — e.g. a
 * missing `fromTokenAmount`, a non-string token identifier, an empty or
 * malformed swidge id, or an unresolvable sender address.
 */
export class ValidationError extends SymbiosisError {
  /**
   * @param {string} message - The human-readable error message.
   */
  constructor (message) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Thrown when an exact-out operation is requested (`toTokenAmount` is set):
 * Symbiosis only supports exact-in routing.
 */
export class ExactOutNotSupportedError extends SymbiosisError {
  /**
   * @param {string} [message] - The human-readable error message.
   */
  constructor (message = 'Symbiosis does not support exact-out operations: pass fromTokenAmount instead of toTokenAmount.') {
    super(message)
    this.name = 'ExactOutNotSupportedError'
  }
}

/**
 * Thrown when a chain identifier cannot be resolved to a chain supported by
 * the Symbiosis protocol.
 */
export class UnsupportedChainError extends SymbiosisError {
  /**
   * @param {string | number} identifier - The unresolved chain identifier.
   */
  constructor (identifier) {
    super(`Chain '${identifier}' is not supported by Symbiosis. Use getSupportedChains() to list the supported chains.`)
    this.name = 'UnsupportedChainError'

    /**
     * The chain identifier that could not be resolved.
     *
     * @type {string | number}
     */
    this.identifier = identifier
  }
}

/**
 * Thrown when a token identifier cannot be resolved against the Symbiosis token
 * list for the given chain.
 */
export class UnsupportedTokenError extends SymbiosisError {
  /**
   * @param {string} identifier - The unresolved token identifier.
   * @param {string} [chainName] - The name of the chain the token was looked up on.
   */
  constructor (identifier, chainName) {
    super(chainName != null
      ? `Token '${identifier}' on chain '${chainName}' is not in the Symbiosis token list. Use getSupportedTokens() to list the supported tokens.`
      : `Token '${identifier}' is not in the Symbiosis token list. Use getSupportedTokens() to list the supported tokens.`)
    this.name = 'UnsupportedTokenError'

    /**
     * The token identifier that could not be resolved.
     *
     * @type {string}
     */
    this.identifier = identifier
  }
}

/**
 * Thrown when a swidge operation is executed without a wallet account capable of
 * signing — i.e. the protocol was created without an account, with a read-only
 * account, or with an account that lacks a capability the route requires (such as
 * ERC-20 approvals).
 */
export class ReadOnlyAccountError extends SymbiosisError {
  /**
   * @param {string} message - The human-readable error message.
   */
  constructor (message) {
    super(message)
    this.name = 'ReadOnlyAccountError'
  }
}

/**
 * Thrown when the route type returned by Symbiosis cannot be executed through the
 * bound WDK wallet account. `ton`, `tron` and `solana` routes are executed when the
 * account supports the required capability (raw cell bodies, smart contract calls
 * with TRC-20 approvals, serialized transactions respectively) and are quote-only
 * otherwise.
 */
export class UnsupportedRouteError extends SymbiosisError {
  /**
   * @param {string} type - The route type reported by the Symbiosis API.
   */
  constructor (type) {
    super(`Symbiosis returned a '${type}' transaction, which cannot be executed through the bound WDK wallet account yet. Use quoteSwidge() to retrieve the route and execute it externally.`)
    this.name = 'UnsupportedRouteError'

    /**
     * The route type reported by the Symbiosis API.
     *
     * @type {string}
     */
    this.type = type
  }
}

/**
 * Thrown before execution when the quoted fee exceeds a configured
 * `maxNetworkFeeBps` / `maxProtocolFeeBps` cap.
 */
export class FeeLimitExceededError extends SymbiosisError {
  /**
   * @param {'network' | 'protocol'} feeType - The fee category that exceeded its cap.
   * @param {number} bps - The quoted fee in basis points of the input amount.
   * @param {number | bigint} cap - The configured maximum in basis points.
   */
  constructor (feeType, bps, cap) {
    super(`The quoted ${feeType} fee (${bps.toFixed(2)} bps) exceeds the configured maximum of ${cap} bps.`)
    this.name = 'FeeLimitExceededError'

    /**
     * The fee category that exceeded its cap.
     *
     * @type {'network' | 'protocol'}
     */
    this.feeType = feeType

    /**
     * The quoted fee in basis points of the input amount.
     *
     * @type {number}
     */
    this.bps = bps

    /**
     * The configured maximum in basis points.
     *
     * @type {number | bigint}
     */
    this.cap = cap
  }
}

/**
 * Thrown when an on-chain transaction submitted during execution reverts, or its
 * receipt does not appear before the polling timeout.
 */
export class TransactionError extends SymbiosisError {
  /**
   * @param {string} message - The human-readable error message.
   * @param {string} [hash] - The transaction hash the error relates to.
   */
  constructor (message, hash) {
    super(message)
    this.name = 'TransactionError'

    /**
     * The transaction hash the error relates to, when known.
     *
     * @type {string | undefined}
     */
    this.hash = hash
  }
}

/**
 * Thrown when the Symbiosis REST API responds with a non-2xx status, or the request
 * fails or times out before a response is received. Carries the HTTP status code
 * (`0` for network failures and timeouts) and the parsed response body so callers
 * can react to specific conditions (e.g. treating a 404 as a not-yet-indexed
 * transaction).
 */
export class ApiError extends SymbiosisError {
  /**
   * @param {string} message - The human-readable error message.
   * @param {number} status - The HTTP status code returned by the API, or `0` if no response was received.
   * @param {any} [response] - The parsed JSON response body, when available.
   */
  constructor (message, status, response) {
    super(message)
    this.name = 'ApiError'

    /**
     * The HTTP status code returned by the API, or `0` if no response was received.
     *
     * @type {number}
     */
    this.status = status

    /**
     * The parsed JSON response body, when available.
     *
     * @type {any}
     */
    this.response = response
  }
}
