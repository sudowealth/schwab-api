import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
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

test('exported Zod enums retain the legacy lookup', () => {
	assert.equal(schemas.AssetTypeEnum.Enum.EQUITY, 'EQUITY')
	for (const schema of Object.values(schemas)) {
		if (schema instanceof z.ZodEnum) {
			assert.deepEqual(schema.Enum, schema.enum)
			assert.equal(
				schema.parse(schema.Enum[schema.options[0]]),
				schema.options[0],
			)
		}
	}
})
