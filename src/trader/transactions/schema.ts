import { z } from 'zod'
import { isoDateTimeSchema } from '../../utils/date-utils.js'
import { mergeShapes } from '../../utils/schema-utils.js'
import { assetType } from '../shared/index.js'

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

// Create a flexible date schema for query parameters
const flexibleDateSchema = (daysOffset: number, description: string) =>
	z
		.preprocess((val) => {
			// Handle empty strings and undefined
			if (val === '' || val === undefined || val === null) {
				// Generate default date in full ISO format
				const date = new Date()
				date.setDate(date.getDate() + daysOffset)
				// For start dates, set to beginning of day; for end dates, set to end of day
				if (daysOffset < 0) {
					// Start date - beginning of day
					date.setHours(0, 0, 0, 0)
				} else {
					// End date - end of day
					date.setHours(23, 59, 59, 999)
				}
				return date.toISOString()
			}
			// Handle YYYY-MM-DD format - convert to full ISO datetime
			if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
				const date = new Date(val + 'T00:00:00.000Z')
				return date.toISOString()
			}
			// Handle full ISO datetime - ensure proper format
			if (typeof val === 'string' && val.includes('T')) {
				return new Date(val).toISOString()
			}
			return val
		}, z.string().describe(description))
		.optional()

const UserDetails = z.object({
	cdDomainId: z.string().optional(), // May not be present
	login: z.string().optional(), // May not be present
	type: z.enum([
		'ADVISOR_USER',
		'BROKER_USER',
		'CLIENT_USER',
		'SYSTEM_USER',
		'UNKNOWN',
	]).optional(),
	userId: z.number().int().optional(), // ($int64) May not be present
	systemUserName: z.string().optional(), // May not be present
	firstName: z.string().optional(), // May not be present
	lastName: z.string().optional(), // May not be present
	brokerRepCode: z.string().optional(), // May not be present
})

// Recreate TransactionBaseInstrument
const TransactionBaseInstrument = z.object({
	assetType: assetType,
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
	description: z.string().optional(), // May not be present
	instrumentId: z.number().int().optional(),
	netChange: z.number().optional(),
})

// Define Transaction Instrument Types
const TransactionCashEquivalent = TransactionBaseInstrument.extend({
	assetType: z.literal('CASH_EQUIVALENT'),
	symbol: z.string().optional(), // May not be present
	description: z.string().optional(), // May not be present
	type: z.enum(['SWEEP_VEHICLE', 'SAVINGS', 'MONEY_MARKET_FUND', 'UNKNOWN']).optional(),
})

const CollectiveInvestment = TransactionBaseInstrument.extend({
	assetType: z.literal('COLLECTIVE_INVESTMENT'),
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
	instrumentId: z.any(), // [...] definition unclear
	type: z.any(), // [...] definition unclear
})

const Currency = TransactionBaseInstrument.extend({
	assetType: z.literal('CURRENCY'),
	symbol: z.string().optional(), // May not be present
})

const TransactionEquity = TransactionBaseInstrument.extend({
	assetType: z.literal('EQUITY'),
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
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
	]).optional(),
})

const TransactionFixedIncome = TransactionBaseInstrument.extend({
	assetType: z.literal('FIXED_INCOME'),
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
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
	]).optional(),
	maturityDate: z.string().optional(), // Relaxed - may not be present
	factor: z.number().optional(),
	multiplier: z.number().optional(),
	variableRate: z.number().optional(),
})

const Forex = TransactionBaseInstrument.extend({
	assetType: z.literal('FOREX'),
	symbol: z.string().optional(), // May not be present
	type: z.enum(['STANDARD', 'NBBO', 'UNKNOWN']).optional(),
	baseCurrency: z.lazy(() => Currency).optional(),
	counterCurrency: z.lazy(() => Currency).optional(),
})

// Define Future and Index based on interpretation (ignoring incorrect oneOf)
const Future = TransactionBaseInstrument.extend({
	assetType: z.literal('FUTURE'), // Assuming FUTURE based on name
	symbol: z.string().optional(), // May not be present
	activeContract: z.boolean().default(false),
	type: z.enum(['STANDARD', 'UNKNOWN']).optional(),
	expirationDate: z.string().optional(), // Relaxed
	lastTradingDate: z.string().optional(),
	firstNoticeDate: z.string().optional(),
	multiplier: z.number().optional(),
})

const Index = TransactionBaseInstrument.extend({
	assetType: z.literal('INDEX'), // Assuming INDEX based on name
	symbol: z.string().optional(), // May not be present
	activeContract: z.boolean().default(false),
	type: z.string().optional(),
})

const TransactionMutualFund = TransactionBaseInstrument.extend({
	assetType: z.literal('MUTUAL_FUND'),
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
	fundFamilyName: z.string().optional(),
	fundFamilySymbol: z.string().optional(),
	fundGroup: z.string().optional(),
	type: z.enum([
		'NOT_APPLICABLE',
		'OPEN_END_NON_TAXABLE',
		'OPEN_END_TAXABLE',
		'NO_LOAD_NON_TAXABLE',
		'NO_LOAD_TAXABLE',
		'UNKNOWN',
	]).optional(),
	exchangeCutoffTime: z.string().optional(), // Relaxed
	purchaseCutoffTime: z.string().optional(), // Relaxed
	redemptionCutoffTime: z.string().optional(), // Relaxed
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
	cusip: z.string().optional(), // May not be present
	symbol: z.string().optional(), // May not be present
	description: z.string().optional(), // May not be present
	instrumentId: z.number().int().optional(),
	netChange: z.number().optional(),
	expirationDate: z.string().optional(), // Relaxed
	optionDeliverables: z.array(TransactionAPIOptionDeliverable).optional(),
	optionPremiumMultiplier: z.number().int().optional(),
	putCall: z.enum(['PUT', 'CALL', 'UNKNOWN']).optional(),
	strikePrice: z.number().optional(),
	type: z.enum(['VANILLA', 'BINARY', 'BARRIER', 'UNKNOWN']).optional(),
	underlyingSymbol: z.string().optional(),
	underlyingCusip: z.string().optional(),
	deliverable: z.any().optional(),
})

const Product = TransactionBaseInstrument.extend({
	assetType: z.literal('PRODUCT'),
	symbol: z.string().optional(), // May not be present
	type: z.enum(['TBD', 'UNKNOWN']).optional(),
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
	instrument: TransactionInstrument.optional(), // May not be present
	amount: z.number().optional(), // May not be present
	cost: z.number().optional(), // May not be present
	price: z.number().optional(), // May not be present
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
	]).optional(), // May not be present
	positionEffect: z.enum(['OPENING', 'CLOSING', 'AUTOMATIC', 'UNKNOWN']).optional(), // May not be present
})

// Define Transaction after its dependencies UserDetails and TransferItem
const Transaction = z.object({
	activityId: z.number().int(),
	time: z.string(), // Relaxed - Schwab datetime format varies
	user: UserDetails.optional(), // May not be present for system transactions
	description: z.string().optional(), // May not be present
	accountNumber: z.string(),
	type: TransactionType,
	status: z.enum(['VALID', 'INVALID', 'PENDING', 'UNKNOWN']).optional(), // May not be present
	subAccount: z.enum(['CASH', 'MARGIN', 'SHORT', 'DIV', 'INCOME', 'UNKNOWN']).optional(), // May not be present
	tradeDate: z.string().optional(), // Relaxed - May not be present for non-trade transactions
	settlementDate: z.string().optional(), // Relaxed - May not be present
	positionId: z.number().int().optional(), // May not be present
	orderId: z.number().int().optional(), // May not be present for non-trade transactions
	netAmount: z.number(),
	activityType: z.enum([
		'ACTIVITY_CORRECTION',
		'EXECUTION',
		'ORDER_ACTION',
		'TRANSFER',
		'UNKNOWN',
	]).optional(), // May not be present
	transferItems: z.array(TransferItem).optional(), // May be empty/absent
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
	startDate: flexibleDateSchema(-30, 'Start date for transaction search'),
	endDate: flexibleDateSchema(0, 'End date for transaction search'),
	symbol: z.string().optional().describe('Symbol to filter transactions'),
	types: TransactionType.describe('Transaction type to filter'),
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
