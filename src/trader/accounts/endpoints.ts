import { TRADER } from '../../constants.js'
import { type EndpointMetadata } from '../../core/http.js'
import { ErrorResponseSchema } from '../../errors.js'
import {
	GetAccountsQueryParams,
	GetAccountsResponse,
	GetAccountByNumberPathParams,
	GetAccountByNumberQueryParams,
	GetAccountByNumberResponse,
	GetAccountNumbersResponse,
} from './schema.js'

export const getAccountsMeta: EndpointMetadata<
	never,
	GetAccountsQueryParams,
	never,
	GetAccountsResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNTS,
	querySchema: GetAccountsQueryParams,
	responseSchema: GetAccountsResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get all accounts for the authenticated user.',
}

export const getAccountByNumberMeta: EndpointMetadata<
	GetAccountByNumberPathParams,
	GetAccountByNumberQueryParams,
	never,
	GetAccountByNumberResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT,
	pathSchema: GetAccountByNumberPathParams,
	querySchema: GetAccountByNumberQueryParams,
	responseSchema: GetAccountByNumberResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get a specific account by account number.',
}

export const getAccountNumbersMeta: EndpointMetadata<
	never,
	never,
	never,
	GetAccountNumbersResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ACCOUNTS.GET_ACCOUNT_NUMBERS,
	responseSchema: GetAccountNumbersResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get account numbers for the authenticated user.',
}
