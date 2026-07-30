# CLAUDE.md

## Project

`@symbiosis-finance/wdk-protocol-swidge-symbiosis` — community module for Tether's [WDK](https://docs.wdk.tether.io) that integrates the [Symbiosis](https://symbiosis.finance) cross-chain protocol. Implements the WDK **swidge** interface (`SwidgeProtocol` from `@tetherto/wdk-wallet/protocols`) on top of the public Symbiosis REST API. ESM, plain JavaScript with JSDoc types, no chain SDK dependencies (must run in Node.js, React Native and Bare runtime).

## Commands

```bash
npm test               # jest (ESM via NODE_OPTIONS=--experimental-vm-modules)
npm run lint           # standard
npm run build:types    # tsc — regenerates types/ from JSDoc; run after changing public JSDoc
```

## Architecture

- `src/symbiosis-protocol.js` — `SymbiosisProtocol extends SwidgeProtocol`. Implements `quoteSwidge`, `swidge`, `getSwidgeStatus`, `getSupportedChains`, `getSupportedTokens`. The base class derives the legacy `swap`/`quoteSwap`/`bridge`/`quoteBridge` from these — do not implement them here.
- `src/api-client.js` — thin fetch-based client for the Symbiosis API (`/v2/quote`, `/v2/swap`, `/v2/tx/{chainId}/{hash}`, `/v1/chains`, `/v2/tokens`). Base URL: `https://api.symbiosis.finance/crosschain` (OpenAPI: `/openapi.json`).
- `index.js` / `bare.js` — Node and Bare runtime entry points. `types/` is generated, don't edit by hand.

## Key conventions and gotchas

- **Source chain comes from config**: WDK accounts don't expose their chain, so `new SymbiosisProtocol(account, { chain: 'Ethereum' })` is required for quoting/execution. Chain identifiers are Symbiosis numeric ids or names from `/v1/chains`.
- **Symbiosis API specifics**:
  - `slippage` is in basis points (WDK options use decimals: `0.02` → `200`).
  - Native tokens have `address: ''`; TON/Solana tokens carry their real addresses in `attributes.ton`/`attributes.solana` (the top-level `address` is a synthetic EVM-style id). Always send the full token object (address, chainId, decimals, attributes) resolved from the cached `/v2/tokens` list.
  - Do **not** send `revertableAddresses`: if present, the API requires an entry per chain including the destination; omitting it uses correct server-side defaults.
  - Status codes: `-1` not-found (treated as `pending` — tx may not be indexed yet), `0` → `completed`, `1` → `pending`, `2` (stuck) → `pending` (defensive: the live API remaps stuck to pending server-side and never returns `2`), `3` (reverted) → `refunded`.
  - Every request sends an `X-Partner-Id` header (config `partnerId`, default `'wdk'`; registered partners get higher rate limits) and times out after 30s (config `timeoutMs`). Network failures/timeouts surface as `ApiError` with `status: 0`.
  - Chains routed through third-party custodial integrations (Changelly: Monero, Zcash) are out of scope and filtered out of discovery and chain/token resolution (`EXCLUDED_CHAIN_NAMES`).
- **Execution dispatch** on the response `type`: `evm` (approve to `approveTo` unless native/`skipApproval`, then send calldata), `btc` (transfer to generated deposit address; uses `/v2/swap`, rate-limited 1 rps). `ton`, `tron` and `solana` source routes throw `UnsupportedRouteError` — the WDK TON wallet encodes string bodies as text comments (not the BoC cells routes require), the WDK Tron wallet has no contract calls and the WDK Solana wallet doesn't accept serialized transactions.
- **EVM approvals**: a non-zero insufficient allowance is reset to zero before approving (mainnet-USDT requirement, enforced by `WalletAccountEvm.approve`); every approval is awaited until mined before the swap calldata is sent.
- **Exact-out is unsupported** by Symbiosis: `toTokenAmount` in options must throw.
- **Swidge id format**: `'<sourceChainId>:<sourceTxHash>'` — keeps `getSwidgeStatus(id)` self-contained.
- The legacy `bridge()` delegation passes the source-token identifier as the destination token; `_buildSwapRequest` falls back to resolving the destination by the source token's symbol.
- All amounts are bigint in base units; API amounts are decimal strings.
- Code style: standard (no semicolons), JSDoc on all public methods (types are generated from it).

## Testing

Unit tests mock `global.fetch` (see `mockFetch` in `tests/symbiosis-protocol.test.js`) and a fake account object. For live smoke tests, quote-only calls against the real API are safe (no signing); execution requires a funded wallet and has not been e2e-tested yet.
