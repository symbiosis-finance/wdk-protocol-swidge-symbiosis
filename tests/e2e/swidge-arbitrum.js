// End-to-end smoke test of the Symbiosis swidge module against a real WDK
// EVM wallet account and the live Symbiosis API.
//
// The scope is decided by the credentials you provide:
//   - no SEED -> quote-only (live API, no signing, no funds, safe).
//   - SEED    -> real execution: a small mainnet transaction.
//
// Usage:
//   node tests/e2e/swidge-arbitrum.js                       # quote-only
//   SEED="word word ..." node tests/e2e/swidge-arbitrum.js  # execute (real WDK account)
//
// Environment:
//   SEED         BIP-39 mnemonic of the source account (real WDK WalletAccountEvm).
//   ARB_RPC      Arbitrum RPC url (default: https://arb1.arbitrum.io/rpc).
//   FROM_TOKEN   Source token id on Arbitrum (default: USDC contract).
//   TO_TOKEN     Destination token id (default: USDT on Ethereum).
//   TO_CHAIN     Destination chain id or name (default: Ethereum).
//   AMOUNT       Source amount in base units (default: 3000000 = 3 USDC).
//   FROM_ADDRESS Placeholder address used for quote-only mode.
//   MAX_PROTOCOL_FEE_BPS / MAX_NETWORK_FEE_BPS
//                Optional execution fee caps in basis points. Unset = no cap.
//                Note: fixed protocol fees dwarf tiny amounts (e.g. ~1000 bps on
//                3 USDC), so raise AMOUNT rather than the cap for a realistic test.

import SymbiosisProtocol from '../../index.js'
import { WalletAccountEvm, WalletAccountReadOnlyEvm } from '@tetherto/wdk-wallet-evm'

const ARB_CHAIN_ID = 42161
const ARB_RPC = process.env.ARB_RPC ?? 'https://arb1.arbitrum.io/rpc'

// USDC on Arbitrum -> USDT on Ethereum, a small cross-chain stable route.
const FROM_TOKEN = process.env.FROM_TOKEN ?? '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const TO_TOKEN = process.env.TO_TOKEN ?? '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const TO_CHAIN = process.env.TO_CHAIN ?? 'Ethereum'
const AMOUNT = BigInt(process.env.AMOUNT ?? '3000000') // 3 USDC (6 decimals)

const SEED = process.env.SEED

const log = (...args) => console.log(...args)
const fmt = n => (typeof n === 'bigint' ? n.toString() : n)

async function main () {
  // Presence of a SEED implies execution; otherwise quote only.
  let account, willExecute
  if (SEED) {
    account = new WalletAccountEvm(SEED, "0'/0/0", { provider: ARB_RPC, chainId: ARB_CHAIN_ID })
    willExecute = true
    log('Account: WDK WalletAccountEvm (HD, from SEED) — execution enabled.\n')
  } else {
    account = new WalletAccountReadOnlyEvm(
      process.env.FROM_ADDRESS ?? '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      { provider: ARB_RPC, chainId: ARB_CHAIN_ID }
    )
    willExecute = false
    log('No SEED — quote-only with a read-only placeholder account.\n')
  }

  const symbiosis = new SymbiosisProtocol(account, { chain: ARB_CHAIN_ID })

  const from = await account.getAddress()
  log('Source account:', from)
  log(`Route: ${fmt(AMOUNT)} ${FROM_TOKEN} @Arbitrum -> ${TO_TOKEN} @${TO_CHAIN}\n`)

  // ---- Phase 0: discovery (live API) ----
  const chains = await symbiosis.getSupportedChains()
  log(`Discovery: ${chains.length} chains supported.`)
  const arb = chains.find(c => c.id === ARB_CHAIN_ID)
  log('  Arbitrum:', arb)

  const tokens = await symbiosis.getSupportedTokens({ fromChain: ARB_CHAIN_ID })
  log(`  ${tokens.length} tokens on Arbitrum (e.g. ${tokens.slice(0, 3).map(t => t.symbol).join(', ')} ...)\n`)

  // ---- Phase 1: quote (live API, no signing) ----
  const options = {
    fromToken: FROM_TOKEN,
    toToken: TO_TOKEN,
    toChain: TO_CHAIN,
    fromTokenAmount: AMOUNT,
    slippage: 0.02,
    recipient: from
  }

  log('Quoting...')
  const quote = await symbiosis.quoteSwidge(options)
  log('Quote:')
  log('  fromTokenAmount   :', fmt(quote.fromTokenAmount))
  log('  toTokenAmount     :', fmt(quote.toTokenAmount))
  log('  toTokenAmountMin  :', fmt(quote.toTokenAmountMin))
  log('  estimatedDuration :', quote.estimatedDuration, 's')
  log('  priceImpact       :', quote.priceImpact)
  log('  fees              :', quote.fees.map(f => `${fmt(f.amount)} ${f.token} (${f.type})`).join(', '))
  log('')

  if (!willExecute) {
    log('No SEED — stopping after quote. No transaction sent.')
    return
  }

  // ---- Phase 2: execution (real mainnet transaction) ----
  log('=== EXECUTION ===')
  const execConfig = {}
  if (process.env.MAX_PROTOCOL_FEE_BPS) execConfig.maxProtocolFeeBps = Number(process.env.MAX_PROTOCOL_FEE_BPS)
  if (process.env.MAX_NETWORK_FEE_BPS) execConfig.maxNetworkFeeBps = Number(process.env.MAX_NETWORK_FEE_BPS)
  const result = await symbiosis.swidge(options, execConfig)
  log('Swidge submitted:')
  log('  id   :', result.id)
  log('  hash :', result.hash)
  log('  txs  :', result.transactions.map(t => `${t.type}:${t.hash}`).join(', '))
  log('')

  // Poll the cross-chain settlement status until it is terminal.
  const TERMINAL = new Set(['completed', 'refunded', 'failed', 'cancelled', 'expired'])
  log('Tracking settlement (polling getSwidgeStatus)...')
  for (let i = 0; i < 60; i++) {
    const status = await symbiosis.getSwidgeStatus(result.id)
    log(`  [${i}] status=${status.status} txs=${status.transactions?.length ?? 0}`)
    if (TERMINAL.has(status.status)) {
      log('\nFinal status:', status.status)
      log('Transactions:', status.transactions)
      return
    }
    await new Promise(r => setTimeout(r, 10000))
  }
  log('\nStill pending after polling window — check the id later:', result.id)
}

main().catch(err => {
  console.error('\nE2E failed:', err.message)
  if (err.response) console.error('API response:', JSON.stringify(err.response, null, 2))
  process.exitCode = 1
})
