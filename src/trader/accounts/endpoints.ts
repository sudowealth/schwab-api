import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetAccountsRequestQueryParams,
	GetAccountsResponseBody,
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	GetAccountByNumberResponseBody,
	GetAccountNumbersResponseBody,
} from './schema'

export const getAccountsMeta: EndpointMetadata<
	never,
	GetAccountsRequestQueryParams,
	never,
	GetAccountsResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNTS,
	querySchema: GetAccountsRequestQueryParams,
	responseSchema: GetAccountsResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves all accounts associated with the user.',
}

export const getAccountByNumberMeta: EndpointMetadata<
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	never,
	GetAccountByNumberResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT,
	pathSchema: GetAccountByNumberRequestPathParams,
	querySchema: GetAccountByNumberRequestQueryParams,
	responseSchema: GetAccountByNumberResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves a specific account by account number.',
}

export const getAccountNumbersMeta: EndpointMetadata<
	never,
	never,
	never,
	GetAccountNumbersResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT_NUMBERS,
	responseSchema: GetAccountNumbersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves all account numbers associated with the user.',
}
