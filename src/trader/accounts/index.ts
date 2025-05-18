export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type GetAccountsResponseBody, type GetAccountByNumberResponseBody, type GetAccountNumbersResponseBody } from './schema'

export type GetAccountsFunction = () => Promise<GetAccountsResponseBody>
export declare const getAccounts: GetAccountsFunction

export type GetAccountByNumberFunction = (params: { accountNumber: string }) => Promise<GetAccountByNumberResponseBody>
export declare const getAccountByNumber: GetAccountByNumberFunction

export type GetAccountNumbersFunction = () => Promise<GetAccountNumbersResponseBody>
export declare const getAccountNumbers: GetAccountNumbersFunction
