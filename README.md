# @symbiosis-finance/wdk-protocol-swidge-symbiosis

[<img src="assets/built-with-wdk.png" alt="Built with WDK" height="32">](https://wdk.tether.io)

WDK swidge protocol module for [Symbiosis](https://symbiosis.finance) — any-to-any cross-chain swaps and bridging across 50+ networks, including EVM chains, TON, Bitcoin, Tron and Solana.

The module implements the [WDK swidge protocol interface](https://docs.wdk.tether.io/sdk/swidge-modules) (`SwidgeProtocol` from `@tetherto/wdk-wallet/protocols`) on top of the public [Symbiosis REST API](https://api.symbiosis.finance/crosschain/docs/) (`/v2/quote`, `/v2/swap`, `/v2/tx`). No heavyweight chain SDK dependencies: quoting and routing happen server-side, transactions are signed and broadcast by your WDK wallet account.

## Compatibility

- **WDK interface implemented**: `SwidgeProtocol` (`ISwidgeProtocol`) from `@tetherto/wdk-wallet/protocols`. The legacy `ISwapProtocol` / `IBridgeProtocol` methods (`swap`, `quoteSwap`, `bridge`, `quoteBridge`) are derived from the swidge implementation by the WDK base class.
- **Tested against**: `@tetherto/wdk-wallet` `^1.0.0-beta.11` (peer/runtime dependency) and `@tetherto/wdk-wallet-evm` `^1.0.0-beta.14`.
- **Runtimes**: Node.js, React Native and Bare (no native chain SDK dependencies).

## Features

- **Any-to-any routes**: swap-only, bridge-only and combined swap + bridge routes in a single interface
- **50+ chains**: all networks supported by the Symbiosis protocol, discoverable at runtime
- **Self-custodial**: the Symbiosis API returns calldata; signing stays inside your WDK wallet account
- **Status tracking**: cross-chain settlement tracking via `getSwidgeStatus()`, including revert/refund states
- **Fee caps**: optional `maxNetworkFeeBps` / `maxProtocolFeeBps` guards before execution
- **Legacy interfaces for free**: `swap()`, `quoteSwap()`, `bridge()` and `quoteBridge()` are derived from the swidge implementation by the WDK base class

## Installation

```bash
npm install @symbiosis-finance/wdk-protocol-swidge-symbiosis
```

## Usage

### With a WDK wallet account

```javascript
import SymbiosisProtocol from '@symbiosis-finance/wdk-protocol-swidge-symbiosis'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'

const account = new WalletAccountEvm(seedPhrase, "0'/0/0", {
  provider: 'https://eth.drpc.org'
})

const symbiosis = new SymbiosisProtocol(account, {
  chain: 'Ethereum' // the Symbiosis chain of the bound account (id or name)
})

// Discover supported chains and tokens
const chains = await symbiosis.getSupportedChains()
const tokens = await symbiosis.getSupportedTokens({ fromChain: 'Ethereum' })

// Quote: 100 USDT (Ethereum) -> USDC (Arbitrum)
const options = {
  fromToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  toChain: 'Arbitrum One',
  fromTokenAmount: 100_000_000n,
  slippage: 0.02
}

const quote = await symbiosis.quoteSwidge(options)
console.log('Expected output:', quote.toTokenAmount)
console.log('Minimum output:', quote.toTokenAmountMin)
console.log('Fees:', quote.fees)

// Execute after showing the quote to the user
const result = await symbiosis.swidge(options, { maxProtocolFeeBps: 100 })
console.log('Swidge id:', result.id)

// Track cross-chain settlement
const status = await symbiosis.getSwidgeStatus(result.id)
console.log('Status:', status.status) // 'pending' | 'completed' | 'refunded' | ...
```

### With WDK Core

```javascript
import WDK from '@tetherto/wdk-core'
import { WalletManagerEvm } from '@tetherto/wdk-wallet-evm'
import SymbiosisProtocol from '@symbiosis-finance/wdk-protocol-swidge-symbiosis'

const wdk = new WDK(seedPhrase)
  .registerWallet('ethereum', WalletManagerEvm, { provider: 'https://eth.drpc.org' })
  .registerProtocol('ethereum', 'symbiosis', SymbiosisProtocol, { chain: 'Ethereum' })
```

### Quote-only mode (no account)

```javascript
const symbiosis = new SymbiosisProtocol(undefined, { chain: 'Ethereum' })

const quote = await symbiosis.quoteSwidge({
  fromToken: 'USDT',
  toToken: 'USDC',
  toChain: 'Arbitrum One',
  recipient: '0x...', // used as the sender for quoting
  fromTokenAmount: 100_000_000n
})
```

### Full example

[`examples/swidge.js`](examples/swidge.js) is an end-to-end script (resolve → quote → execute → track settlement) verified against mainnet. It takes the source and destination as `chain:token` pairs (chain name or id, token symbol or address) and a human-readable amount. It is safe by default — without `EXECUTE=1` it stops after the quote:

```bash
SEED="word word ..." node examples/swidge.js "Arbitrum One:USDC" Base:USDC 2          # quote only
SEED="word word ..." RPC_URL=https://arb1.arbitrum.io/rpc EXECUTE=1 \
  node examples/swidge.js "Arbitrum One:USDC" Base:USDC 2                             # real execution
```

## Configuration

```javascript
new SymbiosisProtocol(account, {
  chain: 'Ethereum',          // required for quoting/execution: Symbiosis chain id or name of the account's chain
  apiUrl: 'https://api.symbiosis.finance/crosschain', // optional API override
  timeoutMs: 30000,           // Symbiosis API request timeout in milliseconds
  partnerId: 'wdk',           // X-Partner-Id header sent to the Symbiosis API (registered partners get higher rate limits)
  defaultSlippage: 0.02,      // default slippage when options.slippage is omitted
  partnerAddress: '0x...',    // registered Symbiosis partner address (protocol fee share)
  refundAddress: 'bc1q...',   // default refund address for deposit-address routes (e.g. from Bitcoin)
  skipApproval: false,        // skip the automatic ERC-20 approval before EVM routes
  maxNetworkFeeBps: 50,       // optional fee caps in basis points of the input amount
  maxProtocolFeeBps: 100
})
```

### Token and chain identifiers

- **Chains**: numeric Symbiosis chain ids (`1`, `42161`, `85918`, …) or chain names as returned by `getSupportedChains()` (`'Ethereum'`, `'TON'`, `'Bitcoin'`, …).
- **Tokens**: contract addresses in their native format (EVM `0x…`, TON `EQ…`, Solana base58), token symbols (`'USDT'`), or `''`/`'native'` for the chain's gas token. Use `getSupportedTokens()` for the canonical identifiers.

## Execution support by source chain

Quoting works for every Symbiosis route. Execution through a bound WDK wallet account depends on the route type returned by the API:

| Source chain | Route type | Execution |
|---|---|---|
| EVM chains | `evm` | ✅ Approve (if needed) + calldata transaction via `WalletAccountEvm` / `WalletAccountEvmErc4337` |
| Bitcoin | `btc` | ✅ Transfer to the generated deposit address via `WalletAccountBtc` (set `refundAddress`) |
| TON | `ton` | ☑️ When the route is a single message and `WalletAccountTon` supports raw BoC message bodies; quote-only otherwise |
| Tron | `tron` | ☑️ When `WalletAccountTron` supports smart contract calls and TRC-20 approvals; quote-only otherwise |
| Solana | `solana` | ☑️ When `WalletAccountSolana` supports base64-serialized transactions; quote-only otherwise |

For TON, Tron and Solana the module probes the bound wallet account at execution time: if the installed `wdk-wallet-*` version provides the capability the route requires, the route is executed like any other; if not, `swidge()` throws `UnsupportedRouteError` and the route stays quote-only. No configuration is needed — upgrading the wallet package enables execution automatically.

Any chain can be used as the **destination** regardless of this table.

## Statuses

`getSwidgeStatus(id)` maps Symbiosis operation codes to WDK swidge statuses:

| Symbiosis code | WDK status |
|---|---|
| `1` (Pending) | `pending` |
| `0` (Success) | `completed` |
| `2` (Stuck) | `pending` (non-terminal — Symbiosis resolves it automatically, no manual action needed) |
| `3` (Reverted) | `refunded` |
| `-1` (Not found) | `pending` (the source transaction may not be indexed yet) |

The `id` returned by `swidge()` has the form `'<sourceChainId>:<sourceTxHash>'` and is self-contained: no extra status options are needed.

A just-submitted source transaction is not indexed by the API for a while (~30s), during which the status endpoint returns HTTP 404. `getSwidgeStatus()` reports this as `pending` (returning the known source transaction) rather than throwing, so a polling consumer can keep tracking right after `swidge()`. As a consequence, a genuinely unknown id is also reported as `pending` rather than raising an error.

## Fees

Symbiosis returns an itemised fee breakdown on every quote and swap. Each entry is mapped to a WDK `SwidgeFee`:

| Symbiosis fee entry | `SwidgeFee.type` |
|---|---|
| The partner (affiliate) share, reported with the `Partner fee` description when a `partnerAddress` is configured | `affiliate` |
| Every other fee (cross-chain, on-chain routing, etc.) | `protocol` |

The mapped `SwidgeFee` carries `amount` (base units), `token`, `chain`, `description`, and `included: true` — Symbiosis quotes are net of fees, so they are always already reflected in `toTokenAmount`.

When you call the derived legacy interfaces, the WDK base class aggregates these `SwidgeFee` entries into the legacy scalar fee fields:

| Legacy method | Legacy `fee` | Legacy `bridgeFee` |
|---|---|---|
| `swap()` / `quoteSwap()` | sum of **all** `SwidgeFee.amount` | — |
| `bridge()` / `quoteBridge()` | sum of `network`-type fees | sum of `protocol`-type fees |

This module does not emit `network`-type fees, so the legacy `bridge()` `fee` is `0n` and the Symbiosis protocol fee is reported as `bridgeFee`. Prefer `quoteSwidge()` / `swidge()` and read the full `fees` array for a complete, typed breakdown.

## Error handling

Every error thrown by the module is an instance of `SymbiosisError`, so you can catch the whole family with a single check and still narrow to a specific subclass. All classes are exported from the package entry point:

```javascript
import {
  SymbiosisError, ConfigurationError, ValidationError, ExactOutNotSupportedError,
  UnsupportedChainError, UnsupportedTokenError, ReadOnlyAccountError,
  UnsupportedRouteError, FeeLimitExceededError, TransactionError, ApiError
} from '@symbiosis-finance/wdk-protocol-swidge-symbiosis'

try {
  await symbiosis.swidge(options, { maxProtocolFeeBps: 100 })
} catch (err) {
  if (err instanceof FeeLimitExceededError) {
    console.warn(`${err.feeType} fee ${err.bps} bps exceeds cap ${err.cap} bps`)
  } else if (err instanceof SymbiosisError) {
    console.error(err.name, err.message)
  }
}
```

| Error | Extends | Thrown when |
|---|---|---|
| `SymbiosisError` | `Error` | Base class for all errors below — use for a catch-all `instanceof` check. |
| `ConfigurationError` | `SymbiosisError` | The required source `chain` option is missing from the protocol configuration. |
| `ValidationError` | `SymbiosisError` | Invalid arguments: missing `fromTokenAmount`, a non-string token identifier, an empty/malformed swidge id, an unresolvable source chain from a bare id, or an unresolvable sender address. |
| `ExactOutNotSupportedError` | `SymbiosisError` | An exact-out operation is requested (`toTokenAmount` is set); Symbiosis is exact-in only. |
| `UnsupportedChainError` | `SymbiosisError` | A chain identifier cannot be resolved to a Symbiosis-supported chain. Carries `.identifier`. |
| `UnsupportedTokenError` | `SymbiosisError` | A token identifier is not in the Symbiosis token list for the chain. Carries `.identifier`. |
| `ReadOnlyAccountError` | `SymbiosisError` | Execution is attempted without a signing account, with a read-only account, or with an account lacking a required capability (e.g. ERC-20 approvals). |
| `UnsupportedRouteError` | `SymbiosisError` | The bound WDK account cannot execute the route returned by Symbiosis (a `ton`/`tron`/`solana` route on a wallet version without the required capability). Carries `.type`. |
| `FeeLimitExceededError` | `SymbiosisError` | The quoted network/protocol fee exceeds the configured `maxNetworkFeeBps`/`maxProtocolFeeBps`. Carries `.feeType`, `.bps`, `.cap`. |
| `TransactionError` | `SymbiosisError` | A transaction submitted during execution reverts, or its receipt does not appear before the timeout. Carries `.hash`. |
| `ApiError` | `SymbiosisError` | The Symbiosis REST API returned a non-2xx response, or the request failed or timed out before a response was received (`.status` is `0`). Carries `.status` and the parsed `.response`. |

## Notes and limitations

- **Exact-out is not supported**: pass `fromTokenAmount`; `toTokenAmount` throws.
- **ERC-20 approvals**: when the wallet account can read allowances (EVM accounts expose `getAllowance`), the approval is skipped if the existing allowance already covers the amount; otherwise it is sent before the EVM route. Tokens that require resetting a non-zero allowance before granting a new one (e.g. USDT on Ethereum) are reset to zero first. Accounts without allowance reads always approve. Set `skipApproval: true` to suppress approvals entirely if you manage allowances yourself.
- **Fee caps** are valued in USD when the API provides price data; otherwise amounts normalized by token decimals are compared directly, which is approximate for fee tokens whose unit value differs from the input token.
- **API requests** time out after 30 seconds by default (`timeoutMs`); `/v2/swap` is rate-limited to 1 request per second per IP by the Symbiosis API.
- Discovery responses (`/v1/chains`, `/v2/tokens`) are cached for 10 minutes per protocol instance.

## Development

```bash
npm install
npm test
npm run lint
npm run build:types
```

See [CHANGELOG.md](CHANGELOG.md) for the release history.

## Support

- **Bugs and feature requests**: open an issue at [github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/issues](https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/issues).
- **Symbiosis protocol / API questions**: see the [Symbiosis developer docs](https://docs.symbiosis.finance/developer-tools/symbiosis-api) and the [Symbiosis community channels](https://symbiosis.finance).
- **WDK questions**: see the [WDK documentation](https://docs.wdk.tether.io).

## Security

Please report security vulnerabilities privately, following the process in
[SECURITY.md](SECURITY.md) — **do not** open a public issue for security reports.

## License

Apache-2.0
