import { z } from 'zod'

export const TransactionType = z.enum([
	'TRADE',
	'RECEIVE_AND_DELIVER',
	'DIVIDEND_OR_INTEREST',
	'ACH_RECEIPT',
	'ACH_DISBURSEMENT',
	'CASH_RECEIPT',
	'CASH_DISBURSEMENT',
	'ELECTRONIC_FUND',
	'WIRE_OUT',
	'WIRE_IN',
	'JOURNAL',
	'MEMORANDUM',
	'MARGIN_CALL',
	'MONEY_MARKET',
	'SMA_ADJUSTMENT',
])
export type TransactionType = z.infer<typeof TransactionType>

export const GetTransactionsRequestPathParams = z.object({
	accountNumber: z.string().describe('The encrypted ID of the account'),
})

const iso8601DateTimeFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

export const GetTransactionsRequestQueryParams = z.object({
	startDate: z
		.string()
		.regex(
			iso8601DateTimeFormat,
			"Valid ISO-8601 format is yyyy-MM-dd'T'HH:mm:ss.SSSZ. Example: 2024-03-28T21:10:42.000Z",
		)
		.describe(
			"Specifies that no transactions entered before this time should be returned. The 'endDate' must also be set.",
		),
	endDate: z
		.string()
		.regex(
			iso8601DateTimeFormat,
			"Valid ISO-8601 format is yyyy-MM-dd'T'HH:mm:ss.SSSZ. Example: 2024-05-10T21:10:42.000Z",
		)
		.describe(
			"Specifies that no transactions entered after this time should be returned. The 'startDate' must also be set.",
		),
	types: TransactionType.describe(
		'Specifies that only transactions of this status should be returned.',
	),
	symbol: z
		.string()
		.optional()
		.describe(
			'It filters all the transaction activities based on the symbol specified. NOTE: If there is any special character in the symbol, please send th encoded value.',
		),
})

// For inferring types if needed elsewhere
export type GetTransactionsRequestPathParams = z.infer<
	typeof GetTransactionsRequestPathParams
>
export type GetTransactionsRequestQueryParams = z.infer<
	typeof GetTransactionsRequestQueryParams
>
