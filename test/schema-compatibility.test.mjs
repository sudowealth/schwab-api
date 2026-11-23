import assert from 'node:assert/strict'
import test from 'node:test'
import { schemas } from '@sudowealth/schwab-api'

test('market hours can contain a single requested market', () => {
	for (const schema of [
		schemas.GetMarketHoursResponse,
		schemas.GetMarketHoursByMarketIdResponse,
	]) {
		const response = { equity: {} }
		assert.deepEqual(schema.parse(response), response)
		assert.equal(schema.safeParse({ other: {} }).success, false)
	}
})

test('omitted query fields retain their endpoint-specific defaults', () => {
	assert.deepEqual(schemas.GetMoversQueryParams.parse({ sort: 'up' }), {
		sort: 'up',
	})
	assert.deepEqual(
		schemas.GetPriceHistoryQueryParams.parse({ symbol: 'AAPL' }),
		{
			symbol: 'AAPL',
			frequency: 1,
		},
	)
})

test('accounts can omit positions and flags', () => {
	const response = { securitiesAccount: { type: 'CASH', accountNumber: '123' } }
	assert.deepEqual(schemas.GetAccountByNumberResponse.parse(response), response)
})
