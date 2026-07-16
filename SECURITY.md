# Security Policy

## Supported versions

Security fixes are provided for the latest published `1.x` release. Please make
sure you are on the most recent version before reporting an issue.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

Instead, use either of the following private channels:

- **GitHub private advisory** (preferred): open a report via the repository's
  [**Security → Report a vulnerability**](https://github.com/symbiosis-finance/wdk-protocol-swidge-symbiosis/security/advisories/new)
  page. This keeps the report private until a fix is published.
- **Email**: [legal@symbiosis.finance](mailto:legal@symbiosis.finance).

Please include as much of the following as you can, to help us triage quickly:

- The affected version(s) of `@symbiosis-finance/wdk-protocol-swidge-symbiosis`.
- A description of the vulnerability and its potential impact.
- Steps to reproduce, a proof of concept, or affected code paths.
- Any suggested mitigations you are aware of.

## Response process

- We aim to **acknowledge** your report within **3 business days**.
- We will provide an initial **assessment** and expected timeline within
  **10 business days**.
- We will keep you informed of progress toward a fix and coordinate a
  disclosure date with you.
- With your consent, we are happy to credit you once a fix is released.

## Scope

This policy covers the `@symbiosis-finance/wdk-protocol-swidge-symbiosis` module
itself. Vulnerabilities in the underlying [Symbiosis protocol](https://symbiosis.finance),
the Symbiosis REST API, the [WDK](https://docs.wdk.tether.io) libraries, or other
third-party dependencies should be reported to their respective maintainers.
