import { z } from 'zod'

export const AccountNumberHash = z.object({
	accountNumber: z.string(),
	hashValue: z.string(),
})

export const session = z.enum(['NORMAL', 'AM', 'PM', 'SEAMLESS'])
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
const orderType = z.enum([
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
const stopPriceOffsetnumber = z.number()
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
const amountIndicator = z.enum([
	'DOLLARS',
	'SHARES',
	'ALL_SHARES',
	'PERCENTAGE',
	'UNKNOWN',
])
const settlementInstruction = z.enum(['REGULAR', 'CASH', 'NEXT_DAY', 'UNKNOWN'])
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
export const assetType = z.enum([
	'EQUITY',
	'MUTUAL_FUND',
	'OPTION',
	'FUTURE',
	'FOREX',
	'INDEX',
	'CASH_EQUIVALENT',
	'FIXED_INCOME',
	'PRODUCT',
	'CURRENCY',
	'COLLECTIVE_INVESTMENT',
])
const apiOrderStatus = z.enum([
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
const APIRuleAction = z.enum(['ACCEPT', 'ALERT', 'REJECT', 'REVIEW', 'UNKNOWN'])
const FeeType = z.enum([
	'COMMISSION',
	'SEC_FEE',
	'STR_FEE',
	'R_FEE',
	'CDSC_FEE',
	'OPT_REG_FEE',
	'ADDITIONAL_FEE',
	'MISCELLANEOUS_FEE',
	'FTT',
	'FUTURES_CLEARING_FEE',
	'FUTURES_DESK_OFFICE_FEE',
	'FUTURES_EXCHANGE_FEE',
	'FUTURES_GLOBEX_FEE',
	'FUTURES_NFA_FEE',
	'FUTURES_PIT_BROKERAGE_FEE',
	'FUTURES_TRANSACTION_FEE',
	'LOW_PROCEEDS_COMMISSION',
	'BASE_CHARGE',
	'GENERAL_CHARGE',
	'GST_FEE',
	'TAF_FEE',
	'INDEX_OPTION_FEE',
	'TEFRA_TAX',
	'STATE_TAX',
	'UNKNOWN',
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

// Remaining schemas
const OrderLeg = z.object({
	askPrice: z.number(),
	bidPrice: z.number(),
	lastPrice: z.number(),
	markPrice: z.number(),
	projectedCommission: z.number(),
	quantity: z.number(),
	finalSymbol: z.string(),
	legId: z.number().int(),
	assetType: assetType,
	instruction: instruction,
})

const OrderBalance = z.object({
	orderValue: z.number(),
	projectedAvailableFund: z.number(),
	projectedBuyingPower: z.number(),
	projectedCommission: z.number(),
})

const OrderStrategy = z.object({
	accountNumber: z.string(),
	advancedOrderType: z.enum([
		'NONE',
		'OTO',
		'OCO',
		'OTOCO',
		'OT2OCO',
		'OT3OCO',
		'BLAST_ALL',
		'OTA',
		'PAIR',
	]),
	closeTime: z.string().datetime(),
	enteredTime: z.string().datetime(),
	orderBalance: OrderBalance,
	orderStrategyType: orderStrategyType,
	orderVersion: z.number(),
	session: session,
	status: apiOrderStatus,
	allOrNone: z.boolean(),
	discretionary: z.boolean(),
	duration: duration,
	filledQuantity: z.number(),
	orderType: orderType,
	orderValue: z.number(),
	price: z.number(),
	quantity: z.number(),
	remainingQuantity: z.number(),
	sellNonMarginableFirst: z.boolean(),
	settlementInstruction: settlementInstruction,
	strategy: complexOrderStrategyType,
	amountIndicator: amountIndicator,
	orderLegs: z.array(OrderLeg),
})

const OrderValidationDetail = z.object({
	validationRuleName: z.string(),
	message: z.string(),
	activityMessage: z.string(),
	originalSeverity: APIRuleAction,
	overrideName: z.string(),
	overrideSeverity: APIRuleAction,
})

const OrderValidationResult = z.object({
	alerts: z.array(OrderValidationDetail),
	accepts: z.array(OrderValidationDetail),
	rejects: z.array(OrderValidationDetail),
	reviews: z.array(OrderValidationDetail),
	warns: z.array(OrderValidationDetail),
})

const CommissionValue = z.object({
	value: z.number(),
	type: FeeType,
})

const CommissionLeg = z.object({
	commissionValues: z.array(CommissionValue),
})

const Commission = z.object({
	commissionLegs: z.array(CommissionLeg),
})

const FeeValue = z.object({
	value: z.number(),
	type: FeeType,
})

const FeeLeg = z.object({
	feeValues: z.array(FeeValue),
})

const Fees = z.object({
	feeLegs: z.array(FeeLeg),
})

const CommissionAndFee = z.object({
	commission: Commission,
	fee: Fees,
	trueCommission: Commission,
})

const Position = z.object({
	shortQuantity: z.number(),
	averagePrice: z.number(),
	currentDayProfitLoss: z.number(),
	currentDayProfitLossPercentage: z.number(),
	longQuantity: z.number(),
	settledLongQuantity: z.number(),
	settledShortQuantity: z.number(),
	agedQuantity: z.number().optional(),
	instrument: z.lazy(() => AccountsInstrument), // Use lazy for potential circular dependency
	marketValue: z.number(),
	maintenanceRequirement: z.number(),
	averageLongPrice: z.number(),
	averageShortPrice: z.number().optional(),
	taxLotAverageLongPrice: z.number(),
	taxLotAverageShortPrice: z.number().optional(),
	longOpenProfitLoss: z.number(),
	shortOpenProfitLoss: z.number().optional(),
	previousSessionLongQuantity: z.number(),
	previousSessionShortQuantity: z.number().optional(),
	currentDayCost: z.number(),
})

export const ServiceError = z.object({
	message: z.string(),
	errors: z.array(z.any()).optional(), // Using z.any() for the nested array structure
})

const SecuritiesAccountBase = z.object({
	type: z.string(),
	accountNumber: z.string(),
	roundTrips: z.number().int(),
	isDayTrader: z.boolean().default(false),
	isClosingOnlyRestricted: z.boolean().default(false),
	pfcbFlag: z.boolean().default(false),
	positions: z.array(Position).default([]),
})

const MarginInitialBalance = z.object({
	accruedInterest: z.number(),
	availableFundsNonMarginableTrade: z.number(),
	bondValue: z.number(),
	buyingPower: z.number(),
	cashBalance: z.number(),
	cashAvailableForTrading: z.number(),
	cashReceipts: z.number(),
	dayTradingBuyingPower: z.number(),
	dayTradingBuyingPowerCall: z.number(),
	dayTradingEquityCall: z.number(),
	equity: z.number(),
	equityPercentage: z.number(),
	liquidationValue: z.number(),
	longMarginValue: z.number(),
	longOptionMarketValue: z.number(),
	longStockValue: z.number(),
	maintenanceCall: z.number(),
	maintenanceRequirement: z.number(),
	margin: z.number(),
	marginEquity: z.number(),
	moneyMarketFund: z.number(),
	mutualFundValue: z.number(),
	regTCall: z.number(),
	shortMarginValue: z.number(),
	shortOptionMarketValue: z.number(),
	shortStockValue: z.number(),
	totalCash: z.number(),
	isInCall: z.boolean(),
	unsettledCash: z.number(),
	pendingDeposits: z.number(),
	marginBalance: z.number(),
	shortBalance: z.number(),
	accountValue: z.number(),
})

const MarginBalance = z.object({
	availableFunds: z.number(),
	availableFundsNonMarginableTrade: z.number(),
	buyingPower: z.number(),
	buyingPowerNonMarginableTrade: z.number(),
	dayTradingBuyingPower: z.number(),
	dayTradingBuyingPowerCall: z.number(),
	equity: z.number(),
	equityPercentage: z.number(),
	longMarginValue: z.number(),
	maintenanceCall: z.number(),
	maintenanceRequirement: z.number(),
	marginBalance: z.number(),
	regTCall: z.number(),
	shortBalance: z.number(),
	shortMarginValue: z.number(),
	sma: z.number(),
	isInCall: z.boolean(),
	stockBuyingPower: z.number(),
	optionBuyingPower: z.number(),
})

const MarginAccount = SecuritiesAccountBase.extend({
	type: z.literal('MARGIN'),
	initialBalances: MarginInitialBalance,
	currentBalances: MarginBalance,
	projectedBalances: MarginBalance,
})

const CashInitialBalance = z.object({
	accruedInterest: z.number(),
	cashAvailableForTrading: z.number(),
	cashAvailableForWithdrawal: z.number(),
	cashBalance: z.number(),
	bondValue: z.number(),
	cashReceipts: z.number(),
	liquidationValue: z.number(),
	longOptionMarketValue: z.number(),
	longStockValue: z.number(),
	moneyMarketFund: z.number(),
	mutualFundValue: z.number(),
	shortOptionMarketValue: z.number(),
	shortStockValue: z.number(),
	isInCall: z.boolean(),
	unsettledCash: z.number(),
	cashDebitCallValue: z.number(),
	pendingDeposits: z.number(),
	accountValue: z.number(),
})

const CashBalance = z.object({
	cashAvailableForTrading: z.number(),
	cashAvailableForWithdrawal: z.number(),
	cashCall: z.number(),
	longNonMarginableMarketValue: z.number(),
	totalCash: z.number(),
	cashDebitCallValue: z.number(),
	unsettledCash: z.number(),
	accruedInterest: z.number(),
	cashBalance: z.number(),
	cashReceipts: z.number(),
	longOptionMarketValue: z.number(),
	liquidationValue: z.number(),
	longMarketValue: z.number(),
	moneyMarketFund: z.number(),
	savings: z.number(),
	shortMarketValue: z.number(),
	pendingDeposits: z.number(),
	mutualFundValue: z.number(),
	bondValue: z.number(),
	shortOptionMarketValue: z.number(),
})

const CashAccount = SecuritiesAccountBase.extend({
	type: z.literal('CASH'),
	initialBalances: CashInitialBalance,
	currentBalances: CashBalance,
	projectedBalances: z.object({
		cashAvailableForTrading: z.number(),
		cashAvailableForWithdrawal: z.number(),
	}),
})

export const SecuritiesAccount = z.discriminatedUnion('type', [
	MarginAccount,
	CashAccount,
])
export type SecuritiesAccount = z.infer<typeof SecuritiesAccount>

// New: Schema for GET /accounts query parameters
export const AccountsQueryParamsSchema = z
	.object({
		fields: z.enum(['positions', 'balances']).optional(), // Allow 'positions' or 'balances'
	})
	.optional()

const DateParam = z.object({
	date: z.string().datetime({
		message: "Valid ISO-8601 format is : yyyy-MM-dd'T'HH:mm:ss.SSSZ",
	}),
})

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

// Order status enum
enum OrderStatus {
	FILLED = 'FILLED',
	WORKING = 'WORKING',
	CANCELED = 'CANCELED',
	REJECTED = 'REJECTED',
	EXPIRED = 'EXPIRED',
	QUEUED = 'QUEUED',
	PENDING = 'PENDING',
}

// Order side enum
enum OrderSide {
	BUY = 'BUY',
	SELL = 'SELL',
	BUY_TO_COVER = 'BUY_TO_COVER',
	SELL_SHORT = 'SELL_SHORT',
}

// Order type enum
enum OrderType {
	MARKET = 'MARKET',
	LIMIT = 'LIMIT',
	STOP = 'STOP',
	STOP_LIMIT = 'STOP_LIMIT',
}

// Duration type enum
enum OrderDuration {
	DAY = 'DAY',
	GOOD_TILL_CANCEL = 'GOOD_TILL_CANCEL',
	FILL_OR_KILL = 'FILL_OR_KILL',
	IMMEDIATE_OR_CANCEL = 'IMMEDIATE_OR_CANCEL',
}

export const Order = z.object({
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

export const OrderRequest = z.object({
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

const PreviewOrder = z.object({
	orderId: z.number().int(),
	orderStrategy: OrderStrategy,
	orderValidationResult: OrderValidationResult,
	commissionAndFee: CommissionAndFee,
})

const AccountsBaseInstrument = z.object({
	assetType: assetType,
	cusip: z.string(),
	symbol: z.string(),
	description: z.string(),
	instrumentId: z.number().int().optional(), // Assuming int based on spec ($int64)
	netChange: z.number().optional(),
})

// Define placeholder schemas for the individual account instrument types
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

const AccountsInstrument = z.discriminatedUnion('assetType', [
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
	maturityDate: z.string().datetime(),
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
	expirationDate: z.string().datetime(),
	lastTradingDate: z.string().datetime(), // Assuming optional
	firstNoticeDate: z.string().datetime(), // Assuming optional
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
	exchangeCutoffTime: z.string().datetime(), // Not marked required
	purchaseCutoffTime: z.string().datetime(), // Not marked required
	redemptionCutoffTime: z.string().datetime(), // Not marked required
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
	expirationDate: z.string().datetime(),
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

export const ApiCurrencyType = z.enum(['USD', 'CAD', 'EUR', 'JPY'])

const AccountAPIOptionDeliverable = z.object({
	symbol: z.string(), // Removed optional, kept string
	deliverableUnits: z.number(), // Removed optional
	apiCurrencyType: ApiCurrencyType, // Removed optional
	assetType: assetType, // Removed optional
})

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

// New: Schema for GET /accounts/{accountNumber}/orders query parameters
export const OrdersQuerySchema = z.object({
	maxResults: z
		.number()
		.int()
		.default(3000)
		.optional()
		.describe(
			'Specifies the maximum number of orders to return. Default is 3000.',
		),
	fromEnteredTime: z
		.string()
		.datetime({ offset: true, precision: 3 })
		.describe(
			"Specifies that no orders entered before this time should be returned. Valid ISO-8601 format: yyyy-MM-dd'T'HH:mm:ss.SSSZ. Date must be within 60 days from today's date. 'toEnteredTime' must also be set.",
		)
		.default(() => {
			const date = new Date()
			date.setDate(date.getDate() - 59)
			return date.toISOString()
		}),
	toEnteredTime: z
		.string()
		.datetime({ offset: true, precision: 3 })
		.describe(
			"Specifies that no orders entered after this time should be returned. Valid ISO-8601 format: yyyy-MM-dd'T'HH:mm:ss.SSSZ. 'fromEnteredTime' must also be set.",
		)
		.default(() => {
			const date = new Date()
			return date.toISOString()
		}),
	status: status
		.optional()
		.describe(
			'Specifies that only orders of this status should be returned. Default is all.',
		),
})
export type OrdersQuerySchema = z.infer<typeof OrdersQuerySchema>

// New: Schema for path parameter {accountNumber}
export const AccountNumberPathSchema = z.object({ accountNumber: z.string() })

// New: Schema for Array of Order
export const OrdersArraySchema = z.array(Order)

// Define Transaction after its dependencies UserDetails and TransferItem
export const Transaction = z.object({
	activityId: z.number().int(),
	time: z.string().datetime(),
	user: UserDetails,
	description: z.string(),
	accountNumber: z.string(),
	type: TransactionType,
	status: z.enum(['VALID', 'INVALID', 'PENDING', 'UNKNOWN']),
	subAccount: z.enum(['CASH', 'MARGIN', 'SHORT', 'DIV', 'INCOME', 'UNKNOWN']),
	tradeDate: z.string().datetime(),
	settlementDate: z.string().datetime(),
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
export type Transaction = z.infer<typeof Transaction>

export const Transactions = z.array(Transaction)
export type Transactions = z.infer<typeof Transactions>

// New: Schema for the wrapper object returned by GET /accounts
const AccountWrapper = z.object({
	securitiesAccount: SecuritiesAccount,
	aggregatedBalance: z.object({
		currentLiquidationValue: z.number(),
		liquidationValue: z.number(),
	}),
})

// New: Schema for Array of SecuritiesAccount (Updated)
export const AccountsArraySchema = z.array(AccountWrapper)
