import { TRADER } from '../../constants'
import { createEndpointWithContext } from '../../core/http'
import { getSharedContext } from '../../core/shared-context'
import { ErrorResponseSchema } from '../../errors'
import {
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	GetTransactionsResponseBody,
	GetTransactionByIdRequestPathParams,
	GetTransactionByIdResponseBody,
} from './schema'

export const getTransactions = createEndpointWithContext<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	GetTransactionsResponseBody,
	'GET',
	ErrorResponseSchema
>(getSharedContext(), {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTIONS,
	pathSchema: GetTransactionsRequestPathParams,
	querySchema: GetTransactionsRequestQueryParams,
	responseSchema: GetTransactionsResponseBody,
	errorSchema: ErrorResponseSchema,
	description:
		'Retrieves transactions for a specific account within a date range.',
})

export const getTransactionById = createEndpointWithContext<
	GetTransactionByIdRequestPathParams,
	never,
	never,
	GetTransactionByIdResponseBody,
	'GET',
	ErrorResponseSchema
>(getSharedContext(), {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTION,
	pathSchema: GetTransactionByIdRequestPathParams,
	responseSchema: GetTransactionByIdResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves a specific transaction by transaction ID.',
})
