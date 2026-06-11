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
     * @type {Object<string, { timestamp: number, promise: Promise<any> }>}
     */
    protected _discoveryCache: {
        [x: string]: {
            timestamp: number;
            promise: Promise<any>;
        };
    };
    /**
     * Builds a Symbiosis `/v2/quote` and `/v2/swap` request payload from swidge options.
     *
     * @protected
     * @param {SwidgeOptions} options - The swidge options.
     * @returns {Promise<{ body: Object, tokenIn: Object, tokenOut: Object }>} The request payload and the resolved tokens.
     * @throws {Error} If the options are invalid or the route cannot be resolved.
     */
    protected _buildSwapRequest(options: SwidgeOptions): Promise<{
        body: any;
        tokenIn: any;
        tokenOut: any;
    }>;
    /**
     * Maps Symbiosis fee entries to the shared swidge fee shape.
     *
     * @protected
     * @param {Array<Object>} fees - The Symbiosis fee entries.
     * @returns {SwidgeFee[]} The mapped fees.
     */
    protected _mapFees(fees: Array<any>): SwidgeFee[];
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
    protected _checkFeeLimits(response: any, body: any, tokenIn: any, config?: SwidgeProtocolConfig): void;
    /**
     * Resolves a chain identifier (Symbiosis chain id or chain name) to a Symbiosis chain.
     *
     * @protected
     * @param {string | number} identifier - The chain identifier.
     * @returns {Promise<{ id: number, name: string }>} The resolved chain.
     * @throws {Error} If the chain is not supported by Symbiosis.
     */
    protected _resolveChain(identifier: string | number): Promise<{
        id: number;
        name: string;
    }>;
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
    protected _resolveToken(chain: {
        id: number;
        name: string;
    }, identifier: string): Promise<any>;
    /**
     * Fetches the supported chains, caching the response.
     *
     * @protected
     * @returns {Promise<Array<Object>>} The supported chains.
     */
    protected _getChains(): Promise<Array<any>>;
    /**
     * Fetches the supported tokens, caching the response.
     *
     * @protected
     * @returns {Promise<Array<Object>>} The supported tokens.
     */
    protected _getTokens(): Promise<Array<any>>;
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
