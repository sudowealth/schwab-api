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
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts',
	querySchema: GetAccountsRequestQueryParams,
	responseSchema: GetAccountsResponseBody,
	description: 'Retrieves all accounts associated with the user.',
})

export const getAccountByNumber = createEndpoint<
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	never,
	GetAccountByNumberResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber',
	pathSchema: GetAccountByNumberRequestPathParams,
	querySchema: GetAccountByNumberRequestQueryParams,
	responseSchema: GetAccountByNumberResponseBody,
	description: 'Retrieves a specific account by its number.',
})

export const getAccountNumbers = createEndpoint<
	never,
	never,
	never,
	GetAccountNumbersResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/accountNumbers',
	responseSchema: GetAccountNumbersResponseBody,
	description: 'Get list of account numbers and their encrypted values.',
})
