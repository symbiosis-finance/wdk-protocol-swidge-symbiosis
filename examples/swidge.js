// Cross-chain swidge example: quote and execute a Symbiosis route from an EVM
// source chain to any supported destination chain.
//
// Usage:
//   SEED=<seed phrase> node examples/swidge.js <fromChain>:<token> <toChain>:<token> <amount>
//
//   SEED     BIP-39 seed phrase of the wallet.
//   RPC_URL  Source chain RPC endpoint (required with EXECUTE=1).
//   EXECUTE  Set to 1 to send the transactions; omitted = quote only, nothing is signed.
//
//   Chains are Symbiosis names or numeric ids (see getSupportedChains()), tokens
//   are symbols or addresses (see getSupportedTokens()), the amount is human-readable.
//
// Examples:
//   SEED="word word ..." node examples/swidge.js "Arbitrum One:USDC" Base:USDC 2
//   SEED="word word ..." RPC_URL=https://bsc-dataseed.binance.org EXECUTE=1 node examples/swidge.js BNB:USDT Avalanche:USDC 2

import SymbiosisProtocol from '../index.js'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

const [fromArg = '', toArg = '', amountArg] = process.argv.slice(2)
const [, fromChain, fromTokenId] = fromArg.match(/^(.+):(.+)$/) ?? []
const [, toChain, toTokenId] = toArg.match(/^(.+):(.+)$/) ?? []

if (!process.env.SEED || !fromChain || !toChain || !amountArg) {
  console.error('Usage: SEED=<seed phrase> node examples/swidge.js <fromChain>:<token> <toChain>:<token> <amount>')
  process.exit(1)
}

const wallet = new WalletManagerEvm(process.env.SEED, { provider: process.env.RPC_URL })
const account = await wallet.getAccount(0)
const symbiosis = new SymbiosisProtocol(account, { chain: fromChain })

// Resolves a token by symbol or address from the Symbiosis catalog of a chain.
async function resolveToken (chain, id) {
  const tokens = await symbiosis.getSupportedTokens({ fromChain: chain })
  const token = tokens.find(t => t.symbol.toLowerCase() === id.toLowerCase()) ??
    tokens.find(t => (t.address ?? '').toLowerCase() === id.toLowerCase())
  if (!token) throw new Error(`Token '${id}' not found on ${chain}`)
  return token
}

const toBaseUnits = (amount, decimals) => {
  const [int, frac = ''] = amount.split('.')
  return BigInt(int + frac.padEnd(decimals, '0').slice(0, decimals))
}
const fromBaseUnits = (amount, decimals) =>
  `${amount / 10n ** BigInt(decimals)}.${(amount % 10n ** BigInt(decimals)).toString().padStart(decimals, '0')}`

async function main () {
  const fromToken = await resolveToken(fromChain, fromTokenId)
  const toToken = await resolveToken(toChain, toTokenId)

  const options = {
    fromToken: fromToken.token,
    toToken: toToken.token,
    toChain,
    fromTokenAmount: toBaseUnits(amountArg, fromToken.decimals)
  }

  console.log(`Route: ${amountArg} ${fromToken.symbol} @ ${fromChain} -> ${toToken.symbol} @ ${toChain}`)
  console.log('Sender:', await account.getAddress())

  // 1. Quote (no signing). Fees are already reflected in the quoted output.
  const quote = await symbiosis.quoteSwidge(options)
  console.log('\nQuote:')
  console.log('  expected out :', fromBaseUnits(quote.toTokenAmount, toToken.decimals), toToken.symbol)
  console.log('  minimum out  :', fromBaseUnits(quote.toTokenAmountMin, toToken.decimals), toToken.symbol)
  for (const fee of quote.fees) console.log(`  fee          : ${fee.amount} (${fee.type}) — ${fee.description}`)

  if (!process.env.EXECUTE) {
    console.log('\nEXECUTE not set — stopping after quote.')
    return
  }

  // 2. Execute: approves the input token when needed (waiting for the approval
  //    to mine), then sends the route transaction.
  const result = await symbiosis.swidge(options)
  console.log('\nSubmitted:', result.id)
  for (const tx of result.transactions) console.log(`  ${tx.type} tx :`, tx.hash)

  // 3. Track cross-chain settlement until it completes (or is refunded).
  for (;;) {
    const { status, transactions } = await symbiosis.getSwidgeStatus(result.id)
    if (status !== 'pending') {
      console.log('\nFinal status:', status)
      for (const tx of transactions) console.log(`  ${tx.type} tx (chain ${tx.chain}) :`, tx.hash)
      break
    }
    await new Promise(resolve => setTimeout(resolve, 10_000))
  }
}

try {
  await main()
} finally {
  wallet.dispose()
}
