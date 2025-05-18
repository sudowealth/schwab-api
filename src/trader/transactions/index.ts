export * from './endpoints'
export * from './schema'

// Explicitly declare the function type so TypeScript recognizes it
import { type GetTransactionsResponseBody, type GetTransactionByIdResponseBody } from './schema'

export type GetTransactionsFunction = (params: { accountNumber: string }) => Promise<GetTransactionsResponseBody>
export declare const getTransactions: GetTransactionsFunction

export type GetTransactionByIdFunction = (params: { accountNumber: string, transactionId: number }) => Promise<GetTransactionByIdResponseBody>
export declare const getTransactionById: GetTransactionByIdFunction
