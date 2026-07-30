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
    constructor(message: string, options?: {
        cause?: unknown;
    });
    cause: unknown;
}
/**
 * Thrown when the protocol instance is misconfigured — most commonly when the
 * required `chain` option identifying the bound account's source chain is missing.
 */
export class ConfigurationError extends SymbiosisError {
    /**
     * @param {string} message - The human-readable error message.
     */
    constructor(message: string);
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
    constructor(message: string);
}
/**
 * Thrown when an exact-out operation is requested (`toTokenAmount` is set):
 * Symbiosis only supports exact-in routing.
 */
export class ExactOutNotSupportedError extends SymbiosisError {
    /**
     * @param {string} [message] - The human-readable error message.
     */
    constructor(message?: string);
}
/**
 * Thrown when a chain identifier cannot be resolved to a chain supported by
 * the Symbiosis protocol.
 */
export class UnsupportedChainError extends SymbiosisError {
    /**
     * @param {string | number} identifier - The unresolved chain identifier.
     */
    constructor(identifier: string | number);
    /**
     * The chain identifier that could not be resolved.
     *
     * @type {string | number}
     */
    identifier: string | number;
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
    constructor(identifier: string, chainName?: string);
    /**
     * The token identifier that could not be resolved.
     *
     * @type {string}
     */
    identifier: string;
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
    constructor(message: string);
}
/**
 * Thrown when the route type returned by Symbiosis cannot be executed through the
 * bound WDK wallet account (currently `ton`, `tron` and `solana` source routes).
 */
export class UnsupportedRouteError extends SymbiosisError {
    /**
     * @param {string} type - The route type reported by the Symbiosis API.
     */
    constructor(type: string);
    /**
     * The route type reported by the Symbiosis API.
     *
     * @type {string}
     */
    type: string;
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
    constructor(feeType: "network" | "protocol", bps: number, cap: number | bigint);
    /**
     * The fee category that exceeded its cap.
     *
     * @type {'network' | 'protocol'}
     */
    feeType: "network" | "protocol";
    /**
     * The quoted fee in basis points of the input amount.
     *
     * @type {number}
     */
    bps: number;
    /**
     * The configured maximum in basis points.
     *
     * @type {number | bigint}
     */
    cap: number | bigint;
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
    constructor(message: string, hash?: string);
    /**
     * The transaction hash the error relates to, when known.
     *
     * @type {string | undefined}
     */
    hash: string | undefined;
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
    constructor(message: string, status: number, response?: any);
    /**
     * The HTTP status code returned by the API, or `0` if no response was received.
     *
     * @type {number}
     */
    status: number;
    /**
     * The parsed JSON response body, when available.
     *
     * @type {any}
     */
    response: any;
}
