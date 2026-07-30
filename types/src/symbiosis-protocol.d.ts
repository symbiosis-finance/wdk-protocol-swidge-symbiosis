export default class SymbiosisProtocol extends SwidgeProtocol {
    /**
     * Creates a new symbiosis swidge protocol without binding it to a wallet account.
     *
     * @overload
     * @param {undefined} [account] - The wallet account to use to interact with the protocol.
     * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
     */
    constructor(account?: undefined, config?: SymbiosisProtocolConfig);
    /**
     * Creates a new read-only symbiosis swidge protocol.
     *
     * @overload
     * @param {IWalletAccountReadOnly} account - The wallet account to use to interact with the protocol.
     * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
     */
    constructor(account: IWalletAccountReadOnly, config?: SymbiosisProtocolConfig);
    /**
     * Creates a new symbiosis swidge protocol.
     *
     * @overload
     * @param {IWalletAccount} account - The wallet account to use to interact with the protocol.
     * @param {SymbiosisProtocolConfig} [config] - The symbiosis protocol configuration.
     */
    constructor(account: IWalletAccount, config?: SymbiosisProtocolConfig);
    /**
     * The Symbiosis API client.
     *
     * @protected
     * @type {SymbiosisApiClient}
     */
    protected _api: SymbiosisApiClient;
    /**
     * Cache for chain and token discovery responses.
     *
     * @protected
     * @type {Record<string, DiscoveryCacheEntry>}
     */
    protected _discoveryCache: Record<string, DiscoveryCacheEntry>;
    /**
     * Builds a Symbiosis `/v2/quote` and `/v2/swap` request payload from swidge options.
     *
     * @protected
     * @param {SwidgeOptions} options - The swidge options.
     * @returns {Promise<SwapRequestBuildResult>} The request payload and the resolved tokens.
     * @throws {ExactOutNotSupportedError} If an exact-out operation is requested.
     * @throws {ValidationError} If the options are invalid.
     * @throws {ConfigurationError} If the source `chain` is not configured.
     * @throws {UnsupportedChainError} If a chain identifier cannot be resolved.
     * @throws {UnsupportedTokenError} If a token identifier cannot be resolved.
     */
    protected _buildSwapRequest(options: SwidgeOptions): Promise<SwapRequestBuildResult>;
    /**
     * Maps a Symbiosis fee entry to a swidge fee type.
     *
     * The API reports every fee — including the partner share — under provider-specific
     * keys with `'symbiosis'` for its own; the partner share is only distinguishable by
     * its description, and everything else is treated as a protocol fee.
     *
     * @protected
     * @param {SymbiosisFeeEntry} fee - The Symbiosis fee entry.
     * @returns {'protocol' | 'affiliate'} The swidge fee type.
     */
    protected _feeType(fee: SymbiosisFeeEntry): "protocol" | "affiliate";
    /**
     * Maps Symbiosis fee entries to the shared swidge fee shape.
     *
     * @protected
     * @param {SymbiosisFeeEntry[]} fees - The Symbiosis fee entries.
     * @returns {SwidgeFee[]} The mapped fees.
     */
    protected _mapFees(fees: SymbiosisFeeEntry[]): SwidgeFee[];
    /**
     * Verifies the quoted fees against the configured fee caps.
     *
     * Fees are valued in USD when price data is available; otherwise the fee amount,
     * normalized by token decimals, is compared against the normalized input amount,
     * which is only an approximation for fees denominated in tokens whose unit value
     * differs from the input token.
     *
     * @protected
     * @param {SymbiosisSwapResponse} response - The Symbiosis swap response.
     * @param {SymbiosisSwapRequest} body - The request payload.
     * @param {SymbiosisToken} tokenIn - The resolved input token.
     * @param {SwidgeProtocolConfig} [config] - Optional execution configuration overriding the instance fee caps.
     * @throws {FeeLimitExceededError} If a configured fee cap is exceeded.
     */
    protected _checkFeeLimits(response: SymbiosisSwapResponse, body: SymbiosisSwapRequest, tokenIn: SymbiosisToken, config?: SwidgeProtocolConfig): void;
    /**
     * Ensures the route's spender holds a sufficient ERC-20 allowance before executing an EVM route.
     *
     * When the wallet account can read allowances (EVM accounts expose {@link getAllowance}),
     * the existing allowance is compared against the input amount and the approval is skipped
     * when it already covers the spend. Tokens like mainnet USDT require a non-zero allowance
     * to be reset to zero before granting a new one (the WDK EVM account enforces this), so a
     * non-zero insufficient allowance is reset first. Accounts without allowance reads (e.g.,
     * non-EVM ones, for which the concept does not apply) always approve.
     *
     * Every submitted approval is appended to `transactions` and awaited until mined: the swap
     * transaction spends the freshly granted allowance and would revert if it is not yet confirmed.
     *
     * @protected
     * @param {IWalletAccount} account - The bound wallet account.
     * @param {string} token - The input token address.
     * @param {string} spender - The address that will spend the token (the route's `approveTo`).
     * @param {bigint} amount - The input amount in base units.
     * @param {string | number} chain - The source chain id, used to label the approval transactions.
     * @param {SwidgeTransaction[]} transactions - The execution transaction list to append approvals to.
     * @returns {Promise<void>}
     * @throws {ReadOnlyAccountError} If an approval is required but the account does not support approvals.
     * @throws {TransactionError} If an approval transaction reverts or times out.
     */
    protected _ensureAllowance(account: IWalletAccount, token: string, spender: string, amount: bigint, chain: string | number, transactions: SwidgeTransaction[]): Promise<void>;
    /**
     * Waits for a transaction to be mined by polling the wallet account for its receipt.
     *
     * @protected
     * @param {IWalletAccount} account - The bound wallet account.
     * @param {string} hash - The transaction hash to wait for.
     * @param {{ intervalMs?: number, timeoutMs?: number }} [options] - Polling options: the poll
     *   interval (default: 2,000 ms) and the overall timeout (default: 180,000 ms).
     * @returns {Promise<TransactionReceipt | undefined>} The transaction receipt, if available.
     * @throws {TransactionError} If the transaction reverts, or the receipt does not appear before the timeout.
     */
    protected _waitForReceipt(account: IWalletAccount, hash: string, { intervalMs, timeoutMs }?: {
        intervalMs?: number;
        timeoutMs?: number;
    }): Promise<TransactionReceipt | undefined>;
    /**
     * Resolves a chain identifier (Symbiosis chain id or chain name) to a Symbiosis chain.
     *
     * @protected
     * @param {string | number} identifier - The chain identifier.
     * @returns {Promise<SymbiosisChain>} The resolved chain.
     * @throws {UnsupportedChainError} If the chain is not supported by Symbiosis.
     */
    protected _resolveChain(identifier: string | number): Promise<SymbiosisChain>;
    /**
     * Resolves a token identifier to a Symbiosis token on the given chain.
     *
     * Accepts a token contract address (EVM, TON or Solana format), a token symbol,
     * or a native-token alias (`''`, `'native'`, or the zero address).
     *
     * @protected
     * @param {SymbiosisChain} chain - The chain to resolve the token on.
     * @param {string} identifier - The token identifier.
     * @returns {Promise<SymbiosisToken>} The resolved Symbiosis token.
     * @throws {ValidationError} If the token identifier is not a string.
     * @throws {UnsupportedTokenError} If the token is not in the Symbiosis token list.
     */
    protected _resolveToken(chain: SymbiosisChain, identifier: string): Promise<SymbiosisToken>;
    /**
     * Fetches the supported chains, caching the response.
     *
     * Chains outside the scope of this module (see {@link EXCLUDED_CHAIN_NAMES}) are filtered out.
     *
     * @protected
     * @returns {Promise<SymbiosisChain[]>} The supported chains.
     */
    protected _getChains(): Promise<SymbiosisChain[]>;
    /**
     * Fetches the supported tokens, caching the response.
     *
     * Tokens on chains outside the supported chain list (including the excluded ones) are filtered out.
     *
     * @protected
     * @returns {Promise<SymbiosisToken[]>} The supported tokens.
     */
    protected _getTokens(): Promise<SymbiosisToken[]>;
    /**
     * Returns a cached discovery response, refreshing it when stale.
     *
     * @protected
     * @param {string} key - The cache key.
     * @param {() => Promise<any>} fetcher - The fetcher producing a fresh response.
     * @returns {Promise<any>} The cached or fresh response.
     */
    protected _cachedDiscovery(key: string, fetcher: () => Promise<any>): Promise<any>;
}
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
export type SwidgeOptions = import("@tetherto/wdk-wallet/protocols").SwidgeOptions;
export type SwidgeQuote = import("@tetherto/wdk-wallet/protocols").SwidgeQuote;
export type SwidgeResult = import("@tetherto/wdk-wallet/protocols").SwidgeResult;
export type SwidgeFee = import("@tetherto/wdk-wallet/protocols").SwidgeFee;
export type SwidgeTransaction = import("@tetherto/wdk-wallet/protocols").SwidgeTransaction;
export type SwidgeProtocolConfig = import("@tetherto/wdk-wallet/protocols").SwidgeProtocolConfig;
export type SwidgeStatus = import("@tetherto/wdk-wallet/protocols").SwidgeStatus;
export type SwidgeStatusOptions = import("@tetherto/wdk-wallet/protocols").SwidgeStatusOptions;
export type SwidgeStatusResult = import("@tetherto/wdk-wallet/protocols").SwidgeStatusResult;
export type SwidgeSupportedChain = import("@tetherto/wdk-wallet/protocols").SwidgeSupportedChain;
export type SwidgeSupportedToken = import("@tetherto/wdk-wallet/protocols").SwidgeSupportedToken;
export type SwidgeSupportedTokensOptions = import("@tetherto/wdk-wallet/protocols").SwidgeSupportedTokensOptions;
export type ApiError = import("./errors.js").ApiError;
export type SymbiosisChain = import("./api-client.js").SymbiosisChain;
export type SymbiosisToken = import("./api-client.js").SymbiosisToken;
export type SymbiosisFeeEntry = import("./api-client.js").SymbiosisFeeEntry;
export type SymbiosisSwapRequest = import("./api-client.js").SymbiosisSwapRequest;
export type SymbiosisSwapResponse = import("./api-client.js").SymbiosisSwapResponse;
export type DiscoveryCacheEntry = {
    /**
     * - The epoch milliseconds at which the response was cached.
     */
    timestamp: number;
    /**
     * - The in-flight or settled discovery response.
     */
    promise: Promise<any>;
};
export type SwapRequestBuildResult = {
    /**
     * - The request payload for `/v2/quote` and `/v2/swap`.
     */
    body: SymbiosisSwapRequest;
    /**
     * - The resolved input token.
     */
    tokenIn: SymbiosisToken;
    /**
     * - The resolved output token.
     */
    tokenOut: SymbiosisToken;
};
export type TransactionReceipt = {
    /**
     * - The transaction status; a zero/false value indicates a reverted transaction.
     */
    status?: number | bigint | boolean;
};
export type SymbiosisProtocolConfig = {
    /**
     * - The Symbiosis chain of the bound wallet account: either the numeric
     * Symbiosis chain id or the chain name as returned by {@link SymbiosisProtocol#getSupportedChains}(e.g., `1`, `'Ethereum'`, `'TON'`, `'Bitcoin'`). Required to quote and execute swidge operations.
     */
    chain?: string | number;
    /**
     * - The base URL of the Symbiosis API (defaults to `https://api.symbiosis.finance/crosschain`).
     */
    apiUrl?: string;
    /**
     * - The Symbiosis API request timeout in milliseconds (defaults to 30,000).
     */
    timeoutMs?: number;
    /**
     * - The `X-Partner-Id` header value identifying the integrator to the
     * Symbiosis API; registered partners get higher API rate limits (defaults to `'wdk'`).
     */
    partnerId?: string;
    /**
     * - The default slippage tolerance as a decimal (e.g., 0.01 for 1%). Defaults to 0.02.
     */
    defaultSlippage?: number;
    /**
     * - The EVM address of a registered Symbiosis partner to receive a share of the protocol fee.
     */
    partnerAddress?: string;
    /**
     * - The default refund address for deposit-address routes (e.g., swaps from Bitcoin).
     */
    refundAddress?: string;
    /**
     * - Skip the automatic ERC-20 allowance approval before executing an EVM route.
     */
    skipApproval?: boolean;
    /**
     * - Maximum acceptable network fee in basis points of the input amount.
     */
    maxNetworkFeeBps?: number | bigint;
    /**
     * - Maximum acceptable protocol fee in basis points of the input amount.
     */
    maxProtocolFeeBps?: number | bigint;
};
import { SwidgeProtocol } from '@tetherto/wdk-wallet/protocols';
import SymbiosisApiClient from './api-client.js';
