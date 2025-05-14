import { createEndpoint } from '../../core/http'
import {
	AccountsArraySchema,
	AccountWrapper,
	AccountsQueryParamsSchema,
} from './schema'
import { z } from 'zod'

export type GetAccountsRequestPathParams = never // No path params
export type GetAccountsRequestQueryParams = z.infer<
	typeof AccountsQueryParamsSchema
>
export type GetAccountsResponseBody = z.infer<typeof AccountsArraySchema>

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
	querySchema: AccountsQueryParamsSchema,
	responseSchema: AccountsArraySchema,
	description: 'Retrieves all accounts associated with the user.',
})

// Example: getAccountByNumber
export type GetAccountByNumberRequestPathParams = {
	accountNumber: string
}
export type GetAccountByNumberRequestQueryParams = never // No query params
export type GetAccountByNumberResponseBody = z.infer<typeof AccountWrapper>

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
	pathSchema: z.object({ accountNumber: z.string() }),
	responseSchema: AccountWrapper,
	description: 'Retrieves a specific account by its number.',
})

export type GetAccountNumbersRequestPathParams = never
export type GetAccountNumbersRequestQueryParams = never
export type GetAccountNumbersResponseBody = z.infer<
	typeof AccountNumbersResponseSchema
>

export const AccountNumbersResponseSchema = z.array(
	z.object({
		accountNumber: z.string(),
		hashValue: z.string(),
	}),
)

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
	responseSchema: AccountNumbersResponseSchema,
	description: 'Get list of account numbers and their encrypted values.',
})
