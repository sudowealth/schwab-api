## ⚠️ Unofficial and Incomplete Library ⚠️

**This is an unofficial, community-developed TypeScript client library for
interacting with Schwab APIs. It has not been approved, endorsed, or certified
by Charles Schwab. It is provided as-is, and its functionality may be incomplete
or unstable. Use at your own risk, especially when dealing with financial data
or transactions.**

---

## Installation

```bash
npm install schwab-api
# or
yarn add schwab-api
# or
pnpm add schwab-api
```

## Usage

```typescript
import { configureSchwabApi, trader } from 'schwab-api'

// Configure the API (optional, defaults are provided)
configureSchwabApi({
	enableLogging: true,
})

async function main() {
	const accessToken = 'YOUR_ACCESS_TOKEN' // Obtain this through your OAuth flow

	try {
		const accounts = await trader.accounts.getAccounts(accessToken)
		console.log('Accounts:', accounts)

		// Example: Get orders for the first account
		if (accounts.length > 0) {
			const firstAccountHash = accounts[0].securitiesAccount.hashedAccountId
			const orders = await trader.orders.getOrders(accessToken, {
				accountId: firstAccountHash,
			})
			console.log(`Orders for account ${firstAccountHash}:`, orders)
		}
	} catch (error) {
		console.error('API Error:', error)
	}
}

main()
```

## Features

- Type-safe interaction with Schwab Trader API and (planned) Market Data API.
- OAuth helper functions.
- Configurable base URL and logging.
- Uses Zod for schema validation.

## Development

- Clone the repository.
- Install dependencies: `npm install`
- Build: `npm run build`
- Test: `npm run test`

## Contributing

TBD

## License

MIT
