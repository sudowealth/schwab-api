import { z } from 'zod'
import { mergeShapes } from '../../utils/schema-utils'
import { assetType, AccountAPIOptionDeliverable } from '../shared'

const session = z.enum(['NORMAL', 'AM', 'PM', 'SEAMLESS'])
const duration = z.enum([
	'DAY',
	'GOOD_TILL_CANCEL',
	'FILL_OR_KILL',
	'IMMEDIATE_OR_CANCEL',
	'END_OF_WEEK',
	'END_OF_MONTH',
	'NEXT_END_OF_MONTH',
	'UNKNOWN',
])

const orderTypeRequest = z.enum([
	'MARKET',
	'LIMIT',
	'STOP',
	'STOP_LIMIT',
	'TRAILING_STOP',
	'CABINET',
	'NON_MARKETABLE',
	'MARKET_ON_CLOSE',
	'EXERCISE',
	'TRAILING_STOP_LIMIT',
	'NET_DEBIT',
	'NET_CREDIT',
	'NET_ZERO',
	'LIMIT_ON_CLOSE',
])

const orderType = z.enum([...orderTypeRequest.options, 'UNKNOWN'])

const complexOrderStrategyType = z.enum([
	'NONE',
	'COVERED',
	'VERTICAL',
	'BACK_RATIO',
	'CALENDAR',
	'DIAGONAL',
	'STRADDLE',
	'STRANGLE',
	'COLLAR_SYNTHETIC',
	'BUTTERFLY',
	'CONDOR',
	'IRON_CONDOR',
	'VERTICAL_ROLL',
	'COLLAR_WITH_STOCK',
	'DOUBLE_DIAGONAL',
	'UNBALANCED_BUTTERFLY',
	'UNBALANCED_CONDOR',
	'UNBALANCED_IRON_CONDOR',
	'UNBALANCED_VERTICAL_ROLL',
	'MUTUAL_FUND_SWAP',
	'CUSTOM',
])
const requestedDestination = z.enum([
	'INET',
	'ECN_ARCA',
	'CBOE',
	'AMEX',
	'PHLX',
	'ISE',
	'BOX',
	'NYSE',
	'NASDAQ',
	'BATS',
	'C2',
	'AUTO',
])
const stopPriceLinkBasis = z.enum([
	'MANUAL',
	'BASE',
	'TRIGGER',
	'LAST',
	'BID',
	'ASK',
	'ASK_BID',
	'MARK',
	'AVERAGE',
])
const stopPriceLinkType = z.enum(['VALUE', 'PERCENT', 'TICK'])
const stopType = z.enum(['STANDARD', 'BID', 'ASK', 'LAST', 'MARK'])
const priceLinkBasis = z.enum([
	'MANUAL',
	'BASE',
	'TRIGGER',
	'LAST',
	'BID',
	'ASK',
	'ASK_BID',
	'MARK',
	'AVERAGE',
])
const priceLinkType = z.enum(['VALUE', 'PERCENT', 'TICK'])
const taxLotMethod = z.enum([
	'FIFO',
	'LIFO',
	'HIGH_COST',
	'LOW_COST',
	'AVERAGE_COST',
	'SPECIFIC_LOT',
	'LOSS_HARVESTER',
])
const specialInstruction = z.enum([
	'ALL_OR_NONE',
	'DO_NOT_REDUCE',
	'ALL_OR_NONE_DO_NOT_REDUCE',
])
const orderStrategyType = z.enum([
	'SINGLE',
	'CANCEL',
	'RECALL',
	'PAIR',
	'FLATTEN',
	'TWO_DAY_SWAP',
	'BLAST_ALL',
	'OCO',
	'TRIGGER',
])
const instruction = z.enum([
	'BUY',
	'SELL',
	'BUY_TO_COVER',
	'SELL_SHORT',
	'BUY_TO_OPEN',
	'BUY_TO_CLOSE',
	'SELL_TO_OPEN',
	'SELL_TO_CLOSE',
	'EXCHANGE',
	'SELL_SHORT_EXEMPT',
])
const activityType = z.enum(['EXECUTION', 'ORDER_ACTION'])
const executionType = z.enum(['FILL'])
const orderLegType = z.enum([
	'EQUITY',
	'OPTION',
	'INDEX',
	'MUTUAL_FUND',
	'CASH_EQUIVALENT',
	'FIXED_INCOME',
	'CURRENCY',
	'COLLECTIVE_INVESTMENT',
])
const positionEffect = z.enum(['OPENING', 'CLOSING', 'AUTOMATIC'])
const quantityType = z.enum(['ALL_SHARES', 'DOLLARS', 'SHARES'])
const divCapGains = z.enum(['REINVEST', 'PAYOUT'])
const status = z.enum([
	'AWAITING_PARENT_ORDER',
	'AWAITING_CONDITION',
	'AWAITING_STOP_CONDITION',
	'AWAITING_MANUAL_REVIEW',
	'ACCEPTED',
	'AWAITING_UR_OUT',
	'PENDING_ACTIVATION',
	'QUEUED',
	'WORKING',
	'REJECTED',
	'PENDING_CANCEL',
	'CANCELED',
	'PENDING_REPLACE',
	'REPLACED',
	'FILLED',
	'EXPIRED',
	'NEW',
	'AWAITING_RELEASE_TIME',
	'PENDING_ACKNOWLEDGEMENT',
	'PENDING_RECALL',
	'UNKNOWN',
])

const AccountsBaseInstrument = z.object({
	assetType: assetType,
	cusip: z.string(),
	symbol: z.string(),
	description: z.string(),
	instrumentId: z.number().int().optional(), // Assuming int based on spec ($int64)
	netChange: z.number().optional(),
})

// // Define placeholder schemas for the individual account instrument types
const AccountCashEquivalent = AccountsBaseInstrument.extend({
	assetType: z.literal('CASH_EQUIVALENT'),
	type: z.enum(['SWEEP_VEHICLE', 'SAVINGS', 'MONEY_MARKET_FUND', 'UNKNOWN']),
	underlyingSymbol: z.string(),
})

const AccountEquity = AccountsBaseInstrument.extend({
	assetType: z.literal('EQUITY'),
})

const AccountFixedIncome = AccountsBaseInstrument.extend({
	assetType: z.literal('FIXED_INCOME'),
	maturityDate: z.string().datetime(),
	factor: z.number(),
	variableRate: z.number(),
})

const AccountMutualFund = AccountsBaseInstrument.extend({
	assetType: z.literal('MUTUAL_FUND'),
})

const AccountOption = AccountsBaseInstrument.extend({
	assetType: z.literal('OPTION'),
	optionDeliverables: z.array(z.lazy(() => AccountAPIOptionDeliverable)),
	putCall: z.enum(['PUT', 'CALL', 'UNKNOWN']),
	optionMultiplier: z.number().int(),
	type: z.enum(['VANILLA', 'BINARY', 'BARRIER', 'UNKNOWN']),
})

const AccountFuture = AccountsBaseInstrument.extend({
	assetType: z.literal('FUTURE'),
	expirationDate: z.string().datetime().optional(),
	activeContract: z.boolean().default(false),
})

const AccountForex = AccountsBaseInstrument.extend({
	assetType: z.literal('FOREX'),
})

const AccountIndex = AccountsBaseInstrument.extend({
	assetType: z.literal('INDEX'),
})

const AccountProduct = AccountsBaseInstrument.extend({
	assetType: z.literal('PRODUCT'),
})

const AccountCurrency = AccountsBaseInstrument.extend({
	assetType: z.literal('CURRENCY'),
})

const AccountCollectiveInvestment = AccountsBaseInstrument.extend({
	assetType: z.literal('COLLECTIVE_INVESTMENT'),
})

export const AccountsInstrument = z.discriminatedUnion('assetType', [
	AccountCashEquivalent,
	AccountEquity,
	AccountFixedIncome,
	AccountMutualFund,
	AccountOption,
	AccountFuture,
	AccountForex,
	AccountIndex,
	AccountProduct,
	AccountCurrency,
	AccountCollectiveInvestment,
])

const ExecutionLeg = z.object({
	legId: z.number().int(),
	price: z.number(),
	quantity: z.number(),
	mismarkedQuantity: z.number(),
	instrumentId: z.number().int(), // Assuming instrumentId is an int based on context
	time: z.string().datetime(),
})

const OrderActivity = z.object({
	activityType: activityType,
	executionType: executionType, // Optional based on activityType = EXECUTION
	quantity: z.number(),
	orderRemainingQuantity: z.number(),
	executionLegs: z.array(ExecutionLeg),
})

const OrderLegCollection = z.object({
	orderLegType: orderLegType,
	legId: z.number().int(),
	instrument: z.lazy(() => AccountsInstrument), // Use lazy for potential circular dependency
	instruction: instruction,
	positionEffect: positionEffect,
	quantity: z.number(),
	quantityType: quantityType,
	divCapGains: divCapGains,
	toSymbol: z.string(),
})

const OrderRequest = z.object({
	session: session,
	duration: duration,
	orderType: orderTypeRequest,
	cancelTime: z.string().datetime(),
	complexOrderStrategyType: complexOrderStrategyType,
	quantity: z.number(),
	filledQuantity: z.number(), // Typically not part of a request, but included per spec
	remainingQuantity: z.number(), // Typically not part of a request, but included per spec
	destinationLinkName: z.string(),
	releaseTime: z.string().datetime(),
	stopPrice: z.number(),
	stopPriceLinkBasis: stopPriceLinkBasis,
	stopPriceLinkType: stopPriceLinkType,
	stopPriceOffset: z.number(),
	stopType: stopType,
	priceLinkBasis: priceLinkBasis,
	priceLinkType: priceLinkType,
	price: z.number(),
	taxLotMethod: taxLotMethod,
	orderLegCollection: z.array(OrderLegCollection),
	activationPrice: z.number(),
	specialInstruction: specialInstruction,
	orderStrategyType: orderStrategyType,
	orderId: z.number().int(), // Optional for new orders
	cancelable: z.boolean().default(false), // Typically not part of a request
	editable: z.boolean().default(false), // Typically not part of a request
	status: status, // Typically not part of a request
	enteredTime: z.string().datetime(), // Typically set by server
	closeTime: z.string().datetime(), // Typically set by server
	accountNumber: z.string(), // Must match path param, but often optional in body?
	orderActivityCollection: z.array(OrderActivity), // Typically not part of a request
	replacingOrderCollection: z.array(z.object({})), // Placeholder
	childOrderStrategies: z.array(z.object({})), // Placeholder
	statusDescription: z.string(), // Typically not part of a request
})

const Order = z.object({
	session: session,
	duration: duration,
	orderType: orderType,
	cancelTime: z.string().datetime(),
	complexOrderStrategyType: complexOrderStrategyType,
	quantity: z.number(),
	filledQuantity: z.number(),
	remainingQuantity: z.number(),
	requestedDestination: requestedDestination,
	destinationLinkName: z.string(),
	releaseTime: z.string().datetime(),
	stopPrice: z.number(),
	stopPriceLinkBasis: stopPriceLinkBasis,
	stopPriceLinkType: stopPriceLinkType,
	stopPriceOffset: z.number(),
	stopType: stopType,
	priceLinkBasis: priceLinkBasis,
	priceLinkType: priceLinkType,
	price: z.number(),
	taxLotMethod: taxLotMethod,
	orderLegCollection: z.array(OrderLegCollection),
	activationPrice: z.number(),
	specialInstruction: specialInstruction,
	orderStrategyType: orderStrategyType,
	orderId: z.number().int(),
	cancelable: z.boolean().default(false),
	editable: z.boolean().default(false),
	status: status,
	enteredTime: z.string().datetime(),
	closeTime: z.string().datetime(),
	tag: z.string(),
	accountNumber: z.number().int(),
	orderActivityCollection: z.array(OrderActivity),
	replacingOrderCollection: z.array(z.object({})), // Placeholder for unknown structure
	childOrderStrategies: z.array(z.object({})), // Placeholder for unknown structure
	statusDescription: z.string(),
})

export const GetOrdersResponseBody = z.array(Order)
export type GetOrdersResponseBody = z.infer<typeof GetOrdersResponseBody>

// --- GET /orders endpoint schemas ---

// Path Parameters Schema for GET /orders (no path params)
export const GetOrdersPathParams = z.object({})
export type GetOrdersPathParams = z.infer<typeof GetOrdersPathParams>

// Query Parameters Schema for GET /orders
export const GetOrdersQueryParams = z.object({
	maxResults: z
		.number()
		.int()
		.max(3000)
		.optional()
		.describe('The maximum number of orders to return'),
	fromEnteredTime: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe('Start date to search for orders'),
	toEnteredTime: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe('End date to search for orders'),
	status: status
		.optional()
		.describe('Specifies that only orders of this status should be returned'),
})
export type GetOrdersQueryParams = z.infer<typeof GetOrdersQueryParams>

// Request Params Schema for GET /orders (merged path + query params)
export const GetOrdersParams = z.object(
	mergeShapes(GetOrdersQueryParams.shape, GetOrdersPathParams.shape),
)
export type GetOrdersParams = z.infer<typeof GetOrdersParams>

// Response Body Schema for GET /orders
export const GetOrdersResponse = z.array(Order)
export type GetOrdersResponse = z.infer<typeof GetOrdersResponse>

// --- GET /accounts/{accountNumber}/orders endpoint schemas ---

// Path Parameters Schema for GET /accounts/{accountNumber}/orders
export const GetOrdersByAccountPathParams = z.object({
	accountNumber: z.string().describe('Encrypted account number'),
})
export type GetOrdersByAccountPathParams = z.infer<
	typeof GetOrdersByAccountPathParams
>

export const GetOrdersByAccountQueryParams = z.object({
	maxResults: z
		.number()
		.int()
		.max(3000)
		.optional()
		.describe('The maximum number of orders to return'),
	fromEnteredTime: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe('Start date to search for orders'),
	toEnteredTime: z
		.string()
		.datetime({ offset: true })
		.optional()
		.describe('End date to search for orders'),
	status: status
		.optional()
		.describe('Specifies that only orders of this status should be returned'),
})
export type GetOrdersByAccountQueryParams = z.infer<
	typeof GetOrdersByAccountQueryParams
>

export const GetOrdersByAccountParams = z.object(
	mergeShapes(
		GetOrdersByAccountQueryParams.shape,
		GetOrdersByAccountPathParams.shape,
	),
)
export type GetOrdersByAccountParams = z.infer<typeof GetOrdersByAccountParams>

export const GetOrdersByAccountResponse = z.array(Order)
export type GetOrdersByAccountResponse = z.infer<
	typeof GetOrdersByAccountResponse
>

export const PlaceOrderPathParams = GetOrdersByAccountPathParams
export type PlaceOrderPathParams = z.infer<typeof PlaceOrderPathParams>

export const PlaceOrderRequestBody = OrderRequest
export type PlaceOrderRequestBody = z.infer<typeof PlaceOrderRequestBody>

export const PlaceOrderParams = z.object(
	mergeShapes(PlaceOrderPathParams.shape, PlaceOrderRequestBody.shape),
)
export type PlaceOrderParams = z.infer<typeof PlaceOrderParams>

export const PlaceOrderResponse = z.object({}).passthrough()
export type PlaceOrderResponse = z.infer<typeof PlaceOrderResponse>

// --- GET /accounts/{accountNumber}/orders/{orderId} endpoint schemas ---

// Path Parameters Schema for GET /accounts/{accountNumber}/orders/{orderId}
export const GetOrderByIdPathParams = z.object({
	accountNumber: z.string().describe('Encrypted account number'),
	orderId: z.number().int().describe('The ID of the order being retrieved.'),
})
export type GetOrderByIdPathParams = z.infer<typeof GetOrderByIdPathParams>

// Query Parameters Schema for GET /accounts/{accountNumber}/orders/{orderId} (no query params)
export const GetOrderByIdQueryParams = z.object({})
export type GetOrderByIdQueryParams = z.infer<typeof GetOrderByIdQueryParams>

// Request Params Schema for GET /accounts/{accountNumber}/orders/{orderId} (merged path + query params)
export const GetOrderByIdParams = z.object(
	mergeShapes(GetOrderByIdQueryParams.shape, GetOrderByIdPathParams.shape),
)
export type GetOrderByIdParams = z.infer<typeof GetOrderByIdParams>

// Response Body Schema for GET /accounts/{accountNumber}/orders/{orderId}
export const GetOrderByIdResponse = Order
export type GetOrderByIdResponse = z.infer<typeof GetOrderByIdResponse>

// --- DELETE /accounts/{accountNumber}/orders/{orderId} endpoint schemas ---

// Path Parameters Schema for DELETE /accounts/{accountNumber}/orders/{orderId}
export const CancelOrderPathParams = GetOrderByIdPathParams
export type CancelOrderPathParams = z.infer<typeof CancelOrderPathParams>

// Query Parameters Schema for DELETE /accounts/{accountNumber}/orders/{orderId} (no query params)
export const CancelOrderQueryParams = z.object({})
export type CancelOrderQueryParams = z.infer<typeof CancelOrderQueryParams>

// Request Params Schema for DELETE /accounts/{accountNumber}/orders/{orderId} (merged path + query params)
export const CancelOrderParams = z.object(
	mergeShapes(CancelOrderQueryParams.shape, CancelOrderPathParams.shape),
)
export type CancelOrderParams = z.infer<typeof CancelOrderParams>

// Response Body Schema for DELETE /accounts/{accountNumber}/orders/{orderId}
export const CancelOrderResponse = z.object({}).passthrough()
export type CancelOrderResponse = z.infer<typeof CancelOrderResponse>

export const ReplaceOrderPathParams = GetOrderByIdPathParams
export type ReplaceOrderPathParams = z.infer<typeof ReplaceOrderPathParams>

export const ReplaceOrderRequestBody = OrderRequest
export type ReplaceOrderRequestBody = z.infer<typeof ReplaceOrderRequestBody>

export const ReplaceOrderParams = z.object(
	mergeShapes(ReplaceOrderPathParams.shape, ReplaceOrderRequestBody.shape),
)
export type ReplaceOrderParams = z.infer<typeof ReplaceOrderParams>

export const ReplaceOrderResponse = z.object({}).passthrough()
export type ReplaceOrderResponse = z.infer<typeof ReplaceOrderResponse>
