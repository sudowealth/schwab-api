import { TRADER } from '../../constants.js'
import { type EndpointMetadata } from '../../core/http.js'
import { ErrorResponseSchema } from '../../errors.js'
import {
	GetTransactionsPathParams,
	GetTransactionsQueryParams,
	GetTransactionsResponse,
	GetTransactionByIdPathParams,
	GetTransactionByIdResponse,
} from './schema.js'

export const getTransactionsMeta: EndpointMetadata<
	GetTransactionsPathParams,
	GetTransactionsQueryParams,
	never,
	GetTransactionsResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTIONS,
	pathSchema: GetTransactionsPathParams,
	querySchema: GetTransactionsQueryParams,
	responseSchema: GetTransactionsResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get transactions for a specific account.',
}

export const getTransactionByIdMeta: EndpointMetadata<
	GetTransactionByIdPathParams,
	never,
	never,
	GetTransactionByIdResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.TRANSACTIONS.GET_TRANSACTION,
	pathSchema: GetTransactionByIdPathParams,
	responseSchema: GetTransactionByIdResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get a specific transaction by its ID.',
}
