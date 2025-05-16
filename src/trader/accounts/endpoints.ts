import { TRADER } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
import {
	GetAccountsRequestQueryParams,
	GetAccountsResponseBody,
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	GetAccountByNumberResponseBody,
	GetAccountNumbersResponseBody,
} from './schema'

export const getAccounts = createEndpoint<
	never,
	GetAccountsRequestQueryParams,
	never,
	GetAccountsResponseBody,
	'GET',
	ErrorResponseSchema
>({
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNTS,
	querySchema: GetAccountsRequestQueryParams,
	responseSchema: GetAccountsResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves all accounts associated with the user.',
})

export const getAccountByNumber = createEndpoint<
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	never,
	GetAccountByNumberResponseBody,
	'GET',
	ErrorResponseSchema
>({
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT,
	pathSchema: GetAccountByNumberRequestPathParams,
	querySchema: GetAccountByNumberRequestQueryParams,
	responseSchema: GetAccountByNumberResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves a specific account by its number.',
})

export const getAccountNumbers = createEndpoint<
	never,
	never,
	never,
	GetAccountNumbersResponseBody,
	'GET',
	ErrorResponseSchema
>({
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNTS + '/accountNumbers',
	responseSchema: GetAccountNumbersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get list of account numbers and their encrypted values.',
})
