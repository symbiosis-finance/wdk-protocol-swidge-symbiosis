# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0]

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

## [1.0.4]

### Changed

- Replaced the "Built with WDK" logo asset.

## [1.0.3]

### Changed

- Minor documentation and packaging touch-ups.

## [1.0.2]

### Changed

- Packaging fixes for the public scoped release.

## [1.0.1]

### Added

- `repository` and `bugs` links in the package metadata.

## [1.0.0]

### Added

- Initial release of the Symbiosis WDK swidge protocol module: `quoteSwidge`,
  `swidge`, `getSwidgeStatus`, `getSupportedChains` and `getSupportedTokens`
  implemented on top of the public Symbiosis REST API, with the legacy
  `swap`/`quoteSwap`/`bridge`/`quoteBridge` interfaces derived by the WDK base
  class. Supports EVM, TON and Bitcoin source-route execution; quote-only for
  Tron and Solana source routes.

[Unreleased]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/releases/tag/v1.0.0
