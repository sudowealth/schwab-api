import { TRADER } from '../../constants'
import { createEndpoint } from '../../core/http'
import { getSharedContext } from '../../core/shared-context'
import { ErrorResponseSchema } from '../../errors'
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
>(getSharedContext(), {
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
>(getSharedContext(), {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT,
	pathSchema: GetAccountByNumberRequestPathParams,
	querySchema: GetAccountByNumberRequestQueryParams,
	responseSchema: GetAccountByNumberResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves a specific account by account number.',
})

export const getAccountNumbers = createEndpoint<
	never,
	never,
	never,
	GetAccountNumbersResponseBody,
	'GET',
	ErrorResponseSchema
>(getSharedContext(), {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT_NUMBERS,
	responseSchema: GetAccountNumbersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves all account numbers associated with the user.',
})
