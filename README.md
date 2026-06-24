# @symbiosis-finance/wdk-protocol-swidge-symbiosis

[![Built with WDK](https://img.shields.io/badge/Built%20with-WDK-50AF95?style=flat-square)](https://wdk.tether.io)

WDK swidge protocol module for [Symbiosis](https://symbiosis.finance) — any-to-any cross-chain swaps and bridging across 50+ networks, including EVM chains, TON, Bitcoin, Tron and Solana.

The module implements the [WDK swidge protocol interface](https://docs.wdk.tether.io/sdk/swidge-modules) (`SwidgeProtocol` from `@tetherto/wdk-wallet/protocols`) on top of the public [Symbiosis REST API](https://api.symbiosis.finance/crosschain/docs/) (`/v2/quote`, `/v2/swap`, `/v2/tx`). No heavyweight chain SDK dependencies: quoting and routing happen server-side, transactions are signed and broadcast by your WDK wallet account.

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

## Configuration

```javascript
new SymbiosisProtocol(account, {
  chain: 'Ethereum',          // required for quoting/execution: Symbiosis chain id or name of the account's chain
  apiUrl: 'https://api.symbiosis.finance/crosschain', // optional API override
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
| TON | `ton` | ✅ Route messages sent via `WalletAccountTon` (`to`/`value`/`body`) |
| Bitcoin | `btc` | ✅ Transfer to the generated deposit address via `WalletAccountBtc` (set `refundAddress`) |
| Tron | `tron` | ⚠️ Quote only — the WDK Tron wallet account does not expose smart-contract calls yet |
| Solana | `solana` | ⚠️ Quote only — the WDK Solana wallet account does not accept serialized route transactions yet |

Any chain can be used as the **destination** regardless of this table.

## Statuses

`getSwidgeStatus(id)` maps Symbiosis operation codes to WDK swidge statuses:

| Symbiosis code | WDK status |
|---|---|
| `1` (Pending) | `pending` |
| `0` (Success) | `completed` |
| `2` (Stuck) | `action-required` |
| `3` (Reverted) | `refunded` |
| `-1` (Not found) | `pending` (the source transaction may not be indexed yet) |

The `id` returned by `swidge()` has the form `'<sourceChainId>:<sourceTxHash>'` and is self-contained: no extra status options are needed.

A just-submitted source transaction is not indexed by the API for a while (~30s), during which the status endpoint returns HTTP 404. `getSwidgeStatus()` reports this as `pending` (returning the known source transaction) rather than throwing, so a polling consumer can keep tracking right after `swidge()`. As a consequence, a genuinely unknown id is also reported as `pending` rather than raising an error.

## Notes and limitations

- **Exact-out is not supported**: pass `fromTokenAmount`; `toTokenAmount` throws.
- **ERC-20 approvals**: when the wallet account can read allowances (EVM accounts expose `getAllowance`), the approval is skipped if the existing allowance already covers the amount; otherwise it is sent before the EVM route. Accounts without allowance reads always approve. Set `skipApproval: true` to suppress approvals entirely if you manage allowances yourself.
- **Fee caps** are valued in USD when the API provides price data; otherwise amounts normalized by token decimals are compared directly, which is approximate for fee tokens whose unit value differs from the input token.
- **Bitcoin routes** call `/v2/swap`, which is rate-limited to 1 request per second by the Symbiosis API.
- Discovery responses (`/v1/chains`, `/v2/tokens`) are cached for 10 minutes per protocol instance.

## Development

```bash
npm install
npm test
npm run lint
npm run build:types
```

## License

Apache-2.0
