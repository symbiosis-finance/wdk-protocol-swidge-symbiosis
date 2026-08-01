# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-01

### Added

- TON, Tron and Solana source routes are now executed when the bound WDK
  wallet account supports them, detected by probing the account at execution
  time: raw BoC message bodies for TON, smart contract calls plus TRC-20
  approvals for Tron, and base64-serialized transactions for Solana. On older
  wallet versions these routes keep throwing `UnsupportedRouteError`
  (quote-only), exactly as before. TON routes are limited to single-message
  transactions (the TON wallet cannot chain sends safely); Tron approval
  receipts are checked for on-chain failure (`result`/`receipt.result`)
  before the swap is sent.
- `examples/swidge.js`: an end-to-end example that quotes and executes a route
  from an EVM source chain to any supported destination and tracks the
  settlement. Takes `chain:token` pairs and a human-readable amount; quote-only
  unless `EXECUTE=1`.

## [1.2.0] - 2026-07-31

### Added

- `partnerId` configuration option: every API request now carries an
  `X-Partner-Id` header identifying the integrator to the Symbiosis API
  (default `'wdk'`; registered partners get higher rate limits).
- `timeoutMs` configuration option: Symbiosis API requests now time out
  (default 30 seconds). Timeouts and network failures are wrapped in
  `ApiError` with `status: 0` instead of leaking raw fetch errors.

### Changed

- EVM approvals now reset a non-zero insufficient allowance to zero before
  granting the new one, as required by tokens like USDT on Ethereum. Both
  transactions are awaited until mined and reported in the result.
- The partner (affiliate) fee share is now recognised by its fee description:
  the Symbiosis API reports it under the `symbiosis` provider, so the previous
  provider-based mapping could never produce an `affiliate` fee.
- `fromTokenAmount` is validated as a positive integer amount and rejected
  with a `ValidationError` otherwise.
- Chain ids and transaction hashes are URL-encoded in status lookups.
- Chains routed through third-party custodial integrations are excluded from
  chain and token discovery and from chain resolution.

### Removed

- TON source-route execution: `ton` routes now throw `UnsupportedRouteError`
  (quoting is unaffected). The WDK TON wallet account encodes string message
  bodies as plain-text comments rather than the BoC cells Symbiosis routes
  require, so the previous implementation could not execute the swap and
  risked sending funds with an ineffective payload.

## [1.1.2] - 2026-07-30

### Changed

- Publishing now runs on version tags and uses npm trusted publishing (OIDC).
- Dependency security updates.

## [1.1.1] - 2026-07-28

_First published release of the 1.1 line (1.1.0 was not published to npm)._

### Added

- Typed error classes exported from the package (`SymbiosisError` base plus
  `ConfigurationError`, `ValidationError`, `ExactOutNotSupportedError`,
  `UnsupportedChainError`, `UnsupportedTokenError`, `ReadOnlyAccountError`,
  `UnsupportedRouteError`, `FeeLimitExceededError`, `TransactionError` and
  `ApiError`). Every error thrown by the module is now an instance of
  `SymbiosisError`, so consumers can catch the whole family or narrow to a
  specific type.
- Named `SymbiosisProtocol` export and a re-export of the `ISwidgeProtocol`
  interface from `@tetherto/wdk-wallet/protocols`, in addition to the existing
  default export.
- `SECURITY.md` describing the vulnerability disclosure process.
- `CHANGELOG.md` (this file).
- README: error types table, Symbiosis-fee → `SwidgeFeeType` mapping table,
  Support and Security sections, and the implemented WDK interface with the
  tested `@tetherto/wdk-wallet` version range.

### Changed

- All interface methods now throw the typed errors above instead of raw `Error`
  instances. Messages are unchanged, so existing message-based handling keeps
  working. `ApiError` continues to carry the HTTP `status` and parsed `response`.
- `getSwidgeStatus` now maps the Symbiosis "stuck" status code (`2`) to `pending`
  instead of `action-required`: the state is non-terminal and Symbiosis resolves
  it automatically (completing or refunding), so no manual action is required.

## [1.0.4] - 2026-06-24

### Changed

- Replaced the "Built with WDK" logo asset.

## 1.0.3 - 2026-06-24

### Changed

- Minor documentation and packaging touch-ups.

## 1.0.2 - 2026-06-24

### Changed

- Packaging fixes for the public scoped release.

## 1.0.1 - 2026-06-16

### Added

- `repository` and `bugs` links in the package metadata.

## [1.0.0] - 2026-06-16

### Added

- Initial release of the Symbiosis WDK swidge protocol module: `quoteSwidge`,
  `swidge`, `getSwidgeStatus`, `getSupportedChains` and `getSupportedTokens`
  implemented on top of the public Symbiosis REST API, with the legacy
  `swap`/`quoteSwap`/`bridge`/`quoteBridge` interfaces derived by the WDK base
  class. Supports EVM, TON and Bitcoin source-route execution; quote-only for
  Tron and Solana source routes.

[1.3.0]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.4...v1.1.1
[1.0.4]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.0...v1.0.4
[1.0.0]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/releases/tag/v1.0.0
