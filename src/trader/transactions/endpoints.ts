import { createEndpoint } from '../../core/http'
import {
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	GetTransactionsResponseBody,
	GetTransactionByIdRequestPathParams,
	GetTransactionByIdRequestQueryParams,
	GetTransactionByIdResponseBody,
} from './schema'

export const getTransactions = createEndpoint<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	GetTransactionsResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber/transactions',
	pathSchema: GetTransactionsRequestPathParams,
	querySchema: GetTransactionsRequestQueryParams,
	responseSchema: GetTransactionsResponseBody,
	description:
		'Retrieves transactions for a specific account within a date range.',
})

export const getTransactionById = createEndpoint<
	GetTransactionByIdRequestPathParams,
	GetTransactionByIdRequestQueryParams,
	never,
	GetTransactionByIdResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber/transactions/:transactionId',
	pathSchema: GetTransactionByIdRequestPathParams,
	querySchema: GetTransactionByIdRequestQueryParams,
	responseSchema: GetTransactionByIdResponseBody,
	description:
		'Retrieves a specific transaction by its ID for a given account.',
})
