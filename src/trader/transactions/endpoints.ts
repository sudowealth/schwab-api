import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	GetTransactionsResponseBody,
	GetTransactionByIdRequestPathParams,
	GetTransactionByIdResponseBody,
} from './schema'

export const getTransactionsMeta: EndpointMetadata<
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	never,
	GetTransactionsResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTIONS,
	pathSchema: GetTransactionsRequestPathParams,
	querySchema: GetTransactionsRequestQueryParams,
	responseSchema: GetTransactionsResponseBody,
	errorSchema: ErrorResponseSchema,
	description:
		'Retrieves transactions for a specific account within a date range.',
}

export const getTransactionByIdMeta: EndpointMetadata<
	GetTransactionByIdRequestPathParams,
	never,
	never,
	GetTransactionByIdResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTION,
	pathSchema: GetTransactionByIdRequestPathParams,
	responseSchema: GetTransactionByIdResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves a specific transaction by transaction ID.',
}
