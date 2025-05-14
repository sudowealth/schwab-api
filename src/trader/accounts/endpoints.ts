import { createEndpoint } from '../../core/http'
import {
	GetAccountsRequestPathParams,
	GetAccountsRequestQueryParams,
	GetAccountsResponseBody,
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	GetAccountByNumberResponseBody,
	GetAccountNumbersRequestPathParams,
	GetAccountNumbersRequestQueryParams,
	GetAccountNumbersResponseBody,
} from './schema'

export const getAccounts = createEndpoint<
	GetAccountsRequestPathParams,
	GetAccountsRequestQueryParams,
	never,
	GetAccountsResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts',
	pathSchema: GetAccountsRequestPathParams,
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
	GetAccountNumbersRequestPathParams,
	GetAccountNumbersRequestQueryParams,
	never,
	GetAccountNumbersResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/accountNumbers',
	pathSchema: GetAccountNumbersRequestPathParams,
	querySchema: GetAccountNumbersRequestQueryParams,
	responseSchema: GetAccountNumbersResponseBody,
	description: 'Get list of account numbers and their encrypted values.',
})
