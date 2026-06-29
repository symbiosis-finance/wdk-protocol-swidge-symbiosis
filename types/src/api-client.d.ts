export const DEFAULT_API_URL: "https://api.symbiosis.finance/crosschain";
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
    constructor({ apiUrl }?: SymbiosisApiClientConfig);
    _apiUrl: string;
    /**
     * Lists the chains supported by the Symbiosis protocol.
     *
     * @returns {Promise<SymbiosisChain[]>} The supported chains.
     */
    getChains(): Promise<SymbiosisChain[]>;
    /**
     * Lists all tokens known to the Symbiosis protocol, including native
     * gas tokens, transit tokens and third-party loaded tokens.
     *
     * @returns {Promise<SymbiosisToken[]>} The supported tokens.
     */
    getTokens(): Promise<SymbiosisToken[]>;
    /**
     * Returns a price quote and calldata for a swap operation.
     *
     * @param {SymbiosisSwapRequest} body - The swap request payload.
     * @returns {Promise<SymbiosisQuoteResponse>} The swap response.
     */
    quote(body: SymbiosisSwapRequest): Promise<SymbiosisQuoteResponse>;
    /**
     * Same as {@link quote}, but for BTC routes it additionally generates
     * a Bitcoin deposit address. Rate limited to 1 request per second.
     *
     * @param {SymbiosisSwapRequest} body - The swap request payload.
     * @returns {Promise<SymbiosisSwapResponse>} The swap response.
     */
    swap(body: SymbiosisSwapRequest): Promise<SymbiosisSwapResponse>;
    /**
     * Returns the status of a cross-chain operation by the source chain id
     * and the source transaction hash.
     *
     * @param {number | string} chainId - The source chain id.
     * @param {string} hash - The source transaction hash.
     * @returns {Promise<SymbiosisTxStatusResponse>} The operation status.
     */
    getTxStatus(chainId: number | string, hash: string): Promise<SymbiosisTxStatusResponse>;
    /**
     * Performs an HTTP request against the Symbiosis API.
     *
     * @protected
     * @param {string} method - The HTTP method.
     * @param {string} path - The API path.
     * @param {Record<string, unknown>} [body] - The optional JSON request body.
     * @returns {Promise<any>} The parsed JSON response.
     * @throws {ApiError} If the request fails or the API returns a non-2xx status.
     */
    protected _request(method: string, path: string, body?: Record<string, unknown>): Promise<any>;
}
export type SymbiosisApiClientConfig = {
    /**
     * - The base URL of the Symbiosis API (defaults to {@link DEFAULT_API_URL}).
     */
    apiUrl?: string;
};
export type SymbiosisChain = {
    /**
     * - The numeric Symbiosis chain id.
     */
    id: number;
    /**
     * - The human-readable chain name (e.g., `'Ethereum'`).
     */
    name: string;
    /**
     * - The base URL of the chain's block explorer.
     */
    explorer: string;
    /**
     * - The URL of the chain's icon.
     */
    icon: string;
    /**
     * - Whether the chain supports deposit-address (depository) routes.
     */
    hasDepository: boolean;
};
export type SymbiosisTokenAttributes = {
    /**
     * - The real TON address, when the token lives on TON (the top-level `address` is a synthetic id).
     */
    ton?: string;
    /**
     * - The real Solana mint address, when the token lives on Solana.
     */
    solana?: string;
};
export type SymbiosisToken = {
    /**
     * - The token symbol (e.g., `'USDT'`).
     */
    symbol: string;
    /**
     * - The token display name.
     */
    name: string;
    /**
     * - The token contract address; `''` for native gas tokens. For TON/Solana tokens this is a synthetic EVM-style id and the real address is in `attributes`.
     */
    address: string;
    /**
     * - The Symbiosis chain id the token lives on.
     */
    chainId: number;
    /**
     * - The number of decimals the token uses.
     */
    decimals: number;
    /**
     * - The token's unit price in USD, when known.
     */
    priceUsd?: number;
    /**
     * - The non-EVM address attributes for TON/Solana tokens.
     */
    attributes?: SymbiosisTokenAttributes;
};
export type SymbiosisTokenAmount = {
    /**
     * - The token symbol.
     */
    symbol: string;
    /**
     * - The token contract address; `''` for native gas tokens.
     */
    address: string;
    /**
     * - The Symbiosis chain id the token lives on.
     */
    chainId: number;
    /**
     * - The number of decimals the token uses.
     */
    decimals: number;
    /**
     * - The amount in base units, as a decimal string.
     */
    amount: string;
    /**
     * - The token's unit price in USD, when known.
     */
    priceUsd?: number;
};
export type SymbiosisFeeEntry = {
    /**
     * - The fee provider key (e.g., `'symbiosis'`, `'partner'`).
     */
    provider: string;
    /**
     * - A human-readable fee description.
     */
    description?: string;
    /**
     * - The fee amount and the token it is denominated in.
     */
    value: SymbiosisTokenAmount;
};
export type SymbiosisTokenRef = {
    /**
     * - The token contract address; `''` for native gas tokens.
     */
    address: string;
    /**
     * - The Symbiosis chain id the token lives on.
     */
    chainId: number;
    /**
     * - The number of decimals the token uses.
     */
    decimals: number;
    /**
     * - The token symbol.
     */
    symbol: string;
    /**
     * - The non-EVM address attributes for TON/Solana tokens.
     */
    attributes?: SymbiosisTokenAttributes;
};
export type SymbiosisTokenAmountRef = SymbiosisTokenRef & {
    amount: string;
};
export type SymbiosisSwapRequest = {
    /**
     * - The input token and the amount to spend, in base units.
     */
    tokenAmountIn: SymbiosisTokenAmountRef;
    /**
     * - The desired output token.
     */
    tokenOut: SymbiosisTokenRef;
    /**
     * - The sender address on the source chain.
     */
    from: string;
    /**
     * - The recipient address on the destination chain.
     */
    to: string;
    /**
     * - The slippage tolerance in basis points.
     */
    slippage: number;
    /**
     * - The registered partner address to receive a share of the protocol fee.
     */
    partnerAddress?: string;
    /**
     * - The refund address for deposit-address routes.
     */
    refundAddress?: string;
};
export type SymbiosisEvmTx = {
    /**
     * - The MetaRouter contract address to send the transaction to.
     */
    to: string;
    /**
     * - The transaction calldata.
     */
    data: string;
    /**
     * - The native value to attach, in wei, as a decimal string.
     */
    value?: string;
};
export type SymbiosisTonMessage = {
    /**
     * - The destination address of the TON message.
     */
    address: string;
    /**
     * - The amount of nanoTON to attach, as a decimal string.
     */
    amount: string;
    /**
     * - The base64-encoded message body (BoC).
     */
    payload: string;
};
export type SymbiosisTonTx = {
    /**
     * - The TON messages to send to perform the swap.
     */
    messages: SymbiosisTonMessage[];
};
export type SymbiosisBtcTx = {
    /**
     * - The generated Bitcoin deposit address to transfer the input amount to.
     */
    depositAddress: string;
};
export type SymbiosisSwapResponse = {
    /**
     * - The route type: `'evm'`, `'ton'`, `'btc'`, `'tron'` or `'solana'`.
     */
    type: string;
    /**
     * - The route transaction payload; its shape depends on `type`.
     */
    tx: SymbiosisEvmTx | SymbiosisTonTx | SymbiosisBtcTx;
    /**
     * - The spender to grant the ERC-20 allowance to, for `evm` routes.
     */
    approveTo?: string;
    /**
     * - The fees applied to the route.
     */
    fees?: SymbiosisFeeEntry[];
    /**
     * - The estimated output amount.
     */
    tokenAmountOut: SymbiosisTokenAmount;
    /**
     * - The minimum output amount after slippage.
     */
    tokenAmountOutMin: SymbiosisTokenAmount;
    /**
     * - The estimated completion time in seconds.
     */
    estimatedTime?: number;
    /**
     * - The price impact as a percentage.
     */
    priceImpact?: string | number;
};
export type SymbiosisQuoteResponse = SymbiosisSwapResponse;
export type SymbiosisTxStatus = {
    /**
     * - The Symbiosis status code: `-1` not-found, `0` completed, `1` pending, `2` stuck, `3` reverted.
     */
    code: number;
    /**
     * - A human-readable status description.
     */
    text?: string;
};
export type SymbiosisTxRef = {
    /**
     * - The transaction hash.
     */
    hash: string;
    /**
     * - The chain id the transaction was included on.
     */
    chainId: number;
};
export type SymbiosisTxStatusResponse = {
    /**
     * - The operation status.
     */
    status?: SymbiosisTxStatus;
    /**
     * - The source (deposit) transaction.
     */
    txIn?: SymbiosisTxRef;
    /**
     * - The destination (or refund) transaction.
     */
    tx?: SymbiosisTxRef;
};
