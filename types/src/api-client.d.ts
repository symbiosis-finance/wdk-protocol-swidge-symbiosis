export const DEFAULT_API_URL: "https://api.symbiosis.finance/crosschain";
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
    constructor({ apiUrl }?: {
        apiUrl?: string;
    });
    _apiUrl: string;
    /**
     * Lists the chains supported by the Symbiosis protocol.
     *
     * @returns {Promise<Array<{ id: number, name: string, explorer: string, icon: string, hasDepository: boolean }>>} The supported chains.
     */
    getChains(): Promise<Array<{
        id: number;
        name: string;
        explorer: string;
        icon: string;
        hasDepository: boolean;
    }>>;
    /**
     * Lists all tokens known to the Symbiosis protocol, including native
     * gas tokens, transit tokens and third-party loaded tokens.
     *
     * @returns {Promise<Array<Object>>} The supported tokens.
     */
    getTokens(): Promise<Array<any>>;
    /**
     * Returns a price quote and calldata for a swap operation.
     *
     * @param {Object} body - The swap request payload.
     * @returns {Promise<Object>} The swap response.
     */
    quote(body: any): Promise<any>;
    /**
     * Same as {@link quote}, but for BTC routes it additionally generates
     * a Bitcoin deposit address. Rate limited to 1 request per second.
     *
     * @param {Object} body - The swap request payload.
     * @returns {Promise<Object>} The swap response.
     */
    swap(body: any): Promise<any>;
    /**
     * Returns the status of a cross-chain operation by the source chain id
     * and the source transaction hash.
     *
     * @param {number | string} chainId - The source chain id.
     * @param {string} hash - The source transaction hash.
     * @returns {Promise<Object>} The operation status.
     */
    getTxStatus(chainId: number | string, hash: string): Promise<any>;
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
    protected _request(method: string, path: string, body?: any): Promise<any>;
}
