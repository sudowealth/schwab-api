import { z } from 'zod'
import { createEndpoint } from '../../core/http'
import { Transaction, Transactions } from '../../schemas'
import {
	GetTransactionsRequestQueryParams,
	GetTransactionsRequestPathParams,
} from './schema'

export const getTransactions = createEndpoint<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	Transactions,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber/transactions',
	pathSchema: GetTransactionsRequestPathParams,
	querySchema: GetTransactionsRequestQueryParams,
	responseSchema: Transactions,
	description:
		'Retrieves transactions for a specific account within a date range.',
})

export type GetTransactionByIdRequestPathParams = {
	accountId: string // Hashed Account ID
	transactionId: string // Transaction ID
}

export const getTransactionById = createEndpoint<
	GetTransactionByIdRequestPathParams,
	never, // No query params for this endpoint
	never,
	Transaction,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountId/transactions/:transactionId',
	pathSchema: z.object({
		accountId: z.string(),
		transactionId: z.number().int(),
	}),
	responseSchema: Transaction,
	description:
		'Retrieves a specific transaction by its ID for a given account.',
})
