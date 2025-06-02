import { z } from 'zod'
import {
	isoDateTimeSchema,
	createISODateTimeSchema,
} from '../../utils/date-utils'
import { mergeShapes } from '../../utils/schema-utils'
import { assetType } from '../shared'

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

const UserDetails = z.object({
	cdDomainId: z.string(),
	login: z.string(),
	type: z.enum([
		'ADVISOR_USER',
		'BROKER_USER',
		'CLIENT_USER',
		'SYSTEM_USER',
		'UNKNOWN',
	]),
	userId: z.number().int(), // ($int64)
	systemUserName: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	brokerRepCode: z.string(),
})

// Recreate TransactionBaseInstrument
const TransactionBaseInstrument = z.object({
	assetType: assetType,
	cusip: z.string(), // Removed optional
	symbol: z.string(), // Removed optional
	description: z.string(), // Description often optional
	instrumentId: z.number().int().optional(), // Removed optional, kept int ($int64)
	netChange: z.number().optional(),
})

// Define Transaction Instrument Types
const TransactionCashEquivalent = TransactionBaseInstrument.extend({
	assetType: z.literal('CASH_EQUIVALENT'),
	symbol: z.string(), // Required per spec
	description: z.string(), // Required per spec
	type: z.enum(['SWEEP_VEHICLE', 'SAVINGS', 'MONEY_MARKET_FUND', 'UNKNOWN']),
})

const CollectiveInvestment = TransactionBaseInstrument.extend({
	assetType: z.literal('COLLECTIVE_INVESTMENT'),
	cusip: z.string(), // Required per spec
	symbol: z.string(), // Required per spec
	instrumentId: z.any(), // [...] definition unclear
	type: z.any(), // [...] definition unclear
})

const Currency = TransactionBaseInstrument.extend({
	assetType: z.literal('CURRENCY'),
	symbol: z.string(), // Required per spec
})

const TransactionEquity = TransactionBaseInstrument.extend({
	assetType: z.literal('EQUITY'),
	cusip: z.string(), // Required per spec
	symbol: z.string(), // Required per spec
	type: z.enum([
		'COMMON_STOCK',
		'PREFERRED_STOCK',
		'DEPOSITORY_RECEIPT',
		'PREFERRED_DEPOSITORY_RECEIPT',
		'RESTRICTED_STOCK',
		'COMPONENT_UNIT',
		'RIGHT',
		'WARRANT',
		'CONVERTIBLE_PREFERRED_STOCK',
		'CONVERTIBLE_STOCK',
		'LIMITED_PARTNERSHIP',
		'WHEN_ISSUED',
		'UNKNOWN',
	]),
})

const TransactionFixedIncome = TransactionBaseInstrument.extend({
	assetType: z.literal('FIXED_INCOME'),
	cusip: z.string(), // Required per spec
	symbol: z.string(), // Required per spec
	type: z.enum([
		'BOND_UNIT',
		'CERTIFICATE_OF_DEPOSIT',
		'CONVERTIBLE_BOND',
		'COLLATERALIZED_MORTGAGE_OBLIGATION',
		'CORPORATE_BOND',
		'GOVERNMENT_MORTGAGE',
		'GNMA_BONDS',
		'MUNICIPAL_ASSESSMENT_DISTRICT',
		'MUNICIPAL_BOND',
		'OTHER_GOVERNMENT',
		'SHORT_TERM_PAPER',
		'US_TREASURY_BOND',
		'US_TREASURY_BILL',
		'US_TREASURY_NOTE',
		'US_TREASURY_ZERO_COUPON',
		'AGENCY_BOND',
		'WHEN_AS_AND_IF_ISSUED_BOND',
		'ASSET_BACKED_SECURITY',
		'UNKNOWN',
	]),
	maturityDate: isoDateTimeSchema,
	factor: z.number(), // Not marked required
	multiplier: z.number(), // Not marked required
	variableRate: z.number(), // Not marked required
})

const Forex = TransactionBaseInstrument.extend({
	assetType: z.literal('FOREX'),
	symbol: z.string(), // Required per spec
	type: z.enum(['STANDARD', 'NBBO', 'UNKNOWN']),
	baseCurrency: z.lazy(() => Currency), // Assuming Currency is defined
	counterCurrency: z.lazy(() => Currency),
})

// Define Future and Index based on interpretation (ignoring incorrect oneOf)
const Future = TransactionBaseInstrument.extend({
	assetType: z.literal('FUTURE'), // Assuming FUTURE based on name
	symbol: z.string(), // Required per spec
	activeContract: z.boolean().default(false),
	type: z.enum(['STANDARD', 'UNKNOWN']),
	expirationDate: isoDateTimeSchema,
	lastTradingDate: isoDateTimeSchema, // Assuming optional
	firstNoticeDate: isoDateTimeSchema, // Assuming optional
	multiplier: z.number(),
})

const Index = TransactionBaseInstrument.extend({
	assetType: z.literal('INDEX'), // Assuming INDEX based on name
	symbol: z.string(), // Required per spec
	activeContract: z.boolean().default(false),
	type: z.string(), // Enum Array [ 3 ] unclear
})

const TransactionMutualFund = TransactionBaseInstrument.extend({
	assetType: z.literal('MUTUAL_FUND'),
	cusip: z.string(), // Required per spec
	symbol: z.string(), // Required per spec
	fundFamilyName: z.string(), // Not marked required
	fundFamilySymbol: z.string(), // Not marked required
	fundGroup: z.string(), // Not marked required
	type: z.enum([
		'NOT_APPLICABLE',
		'OPEN_END_NON_TAXABLE',
		'OPEN_END_TAXABLE',
		'NO_LOAD_NON_TAXABLE',
		'NO_LOAD_TAXABLE',
		'UNKNOWN',
	]),
	exchangeCutoffTime: isoDateTimeSchema, // Not marked required
	purchaseCutoffTime: isoDateTimeSchema, // Not marked required
	redemptionCutoffTime: isoDateTimeSchema, // Not marked required
})

const TransactionAPIOptionDeliverable = z.object({
	rootSymbol: z.string(),
	strikePercent: z.number().int(),
	deliverableNumber: z.number().int(),
	deliverableUnits: z.number(),
	deliverable: z.any(), // Changed to z.any() for now
	assetType: assetType,
})

const TransactionOption = TransactionBaseInstrument.extend({
	assetType: z.literal('OPTION'), // Corrected to z.literal for discriminated union
	cusip: z.string(),
	symbol: z.string(),
	description: z.string(),
	instrumentId: z.number().int().optional(),
	netChange: z.number().optional(),
	expirationDate: isoDateTimeSchema,
	optionDeliverables: z.array(TransactionAPIOptionDeliverable),
	optionPremiumMultiplier: z.number().int(),
	putCall: z.enum(['PUT', 'CALL', 'UNKNOWN']),
	strikePrice: z.number(),
	type: z.enum(['VANILLA', 'BINARY', 'BARRIER', 'UNKNOWN']),
	underlyingSymbol: z.string(),
	underlyingCusip: z.string(),
	deliverable: z.any(), // Changed to z.any() for now
})

const Product = TransactionBaseInstrument.extend({
	assetType: z.literal('PRODUCT'),
	symbol: z.string(), // Required per spec
	type: z.enum(['TBD', 'UNKNOWN']),
})

// Replace placeholder with the correct discriminated union
const TransactionInstrument = z.discriminatedUnion('assetType', [
	TransactionCashEquivalent,
	CollectiveInvestment,
	Currency,
	TransactionEquity,
	TransactionFixedIncome,
	Forex,
	Future,
	Index,
	TransactionMutualFund,
	TransactionOption,
	Product,
])

const TransferItem = z.object({
	instrument: TransactionInstrument, // References the placeholder TransactionInstrument
	amount: z.number(),
	cost: z.number(),
	price: z.number(),
	feeType: z.enum([
		'COMMISSION',
		'SEC_FEE',
		'STR_FEE',
		'R_FEE',
		'CDSC_FEE',
		'OPT_REG_FEE',
		'ADDITIONAL_FEE',
		'MISCELLANEOUS_FEE',
		'FUTURES_EXCHANGE_FEE',
		'LOW_PROCEEDS_COMMISSION',
		'BASE_CHARGE',
		'GENERAL_CHARGE',
		'GST_FEE',
		'TAF_FEE',
		'INDEX_OPTION_FEE',
		'UNKNOWN',
	]),
	positionEffect: z.enum(['OPENING', 'CLOSING', 'AUTOMATIC', 'UNKNOWN']),
})

// Define Transaction after its dependencies UserDetails and TransferItem
const Transaction = z.object({
	activityId: z.number().int(),
	time: isoDateTimeSchema,
	user: UserDetails,
	description: z.string(),
	accountNumber: z.string(),
	type: TransactionType,
	status: z.enum(['VALID', 'INVALID', 'PENDING', 'UNKNOWN']),
	subAccount: z.enum(['CASH', 'MARGIN', 'SHORT', 'DIV', 'INCOME', 'UNKNOWN']),
	tradeDate: isoDateTimeSchema,
	settlementDate: isoDateTimeSchema,
	positionId: z.number().int(),
	orderId: z.number().int(),
	netAmount: z.number(),
	activityType: z.enum([
		'ACTIVITY_CORRECTION',
		'EXECUTION',
		'ORDER_ACTION',
		'TRANSFER',
		'UNKNOWN',
	]),
	transferItems: z.array(TransferItem),
})

// --- GET /accounts/{accountNumber}/transactions endpoint schemas ---

// Path Parameters Schema for GET /accounts/{accountNumber}/transactions
export const GetTransactionsPathParams = z.object({
	accountNumber: z.string().describe('Encrypted account number'),
})
export type GetTransactionsPathParams = z.infer<
	typeof GetTransactionsPathParams
>

// Query Parameters Schema for GET /accounts/{accountNumber}/transactions
export const GetTransactionsQueryParams = z.object({
	startDate: createISODateTimeSchema({
		daysOffset: -30,
		description: 'Start date for transaction search',
	}),
	endDate: createISODateTimeSchema({
		daysOffset: 0,
		description: 'End date for transaction search',
	}),
	symbol: z.string().optional().describe('Symbol to filter transactions'),
	type: TransactionType.optional()
		.default('TRADE')
		.describe('Transaction type to filter'),
})
export type GetTransactionsQueryParams = z.infer<
	typeof GetTransactionsQueryParams
>

// Request Params Schema for GET /accounts/{accountNumber}/transactions (merged path + query params)
export const GetTransactionsParams = z.object(
	mergeShapes(
		GetTransactionsQueryParams.shape,
		GetTransactionsPathParams.shape,
	),
)
export type GetTransactionsParams = z.infer<typeof GetTransactionsParams>

// Response Body Schema for GET /accounts/{accountNumber}/transactions
export const GetTransactionsResponse = z.array(Transaction)
export type GetTransactionsResponse = z.infer<typeof GetTransactionsResponse>

// --- GET /accounts/{accountNumber}/transactions/{transactionId} endpoint schemas ---

// Path Parameters Schema for GET /accounts/{accountNumber}/transactions/{transactionId}
export const GetTransactionByIdPathParams = z.object({
	accountNumber: z.string().describe('Encrypted account number'),
	transactionId: z.number().int().describe('Transaction ID'),
})
export type GetTransactionByIdPathParams = z.infer<
	typeof GetTransactionByIdPathParams
>

// Query Parameters Schema for GET /accounts/{accountNumber}/transactions/{transactionId}
export const GetTransactionByIdQueryParams = z.object({})
export type GetTransactionByIdQueryParams = z.infer<
	typeof GetTransactionByIdQueryParams
>

// Request Params Schema for GET /accounts/{accountNumber}/transactions/{transactionId} (merged path + query params)
export const GetTransactionByIdParams = z.object(
	mergeShapes(
		GetTransactionByIdQueryParams.shape,
		GetTransactionByIdPathParams.shape,
	),
)
export type GetTransactionByIdParams = z.infer<typeof GetTransactionByIdParams>

// Response Body Schema for GET /accounts/{accountNumber}/transactions/{transactionId}
export const GetTransactionByIdResponse = Transaction
export type GetTransactionByIdResponse = z.infer<
	typeof GetTransactionByIdResponse
>
