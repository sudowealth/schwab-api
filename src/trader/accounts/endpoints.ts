import { TRADER } from '../../constants'
import { createEndpointWithContext } from '../../core/http'
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

export const getAccounts = createEndpointWithContext<
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

export const getAccountByNumber = createEndpointWithContext<
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

export const getAccountNumbers = createEndpointWithContext<
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
