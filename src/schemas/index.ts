// Example skeleton
import { z } from "zod";

/* COMMON ENUMS */

// Session types for orders and market data
export const Session = z.enum(["NORMAL", "AM", "PM", "SEAMLESS"]);
export type Session = z.infer<typeof Session>;

// Duration for orders
export const Duration = z.enum([
  "DAY",
  "GOOD_TILL_CANCEL",
  "FILL_OR_KILL",
  "IMMEDIATE_OR_CANCEL",
  "END_OF_WEEK",
  "END_OF_MONTH",
  "NEXT_END_OF_MONTH",
  "UNKNOWN",
]);
export type Duration = z.infer<typeof Duration>;

// Order types
export const OrderType = z.enum([
  "MARKET",
  "LIMIT",
  "STOP",
  "STOP_LIMIT",
  "TRAILING_STOP",
  "CABINET",
  "NON_MARKETABLE",
  "MARKET_ON_CLOSE",
  "EXERCISE",
  "TRAILING_STOP_LIMIT",
  "NET_DEBIT",
  "NET_CREDIT",
  "NET_ZERO",
  "LIMIT_ON_CLOSE",
  "UNKNOWN",
]);
export type OrderType = z.infer<typeof OrderType>;

// Complex order strategy types
export const ComplexOrderStrategyType = z.enum([
  "NONE",
  "COVERED",
  "VERTICAL",
  "BACK_RATIO",
  "CALENDAR",
  "DIAGONAL",
  "STRADDLE",
  "STRANGLE",
  "COLLAR_SYNTHETIC",
  "BUTTERFLY",
  "CONDOR",
  "IRON_CONDOR",
  "VERTICAL_ROLL",
  "COLLAR_WITH_STOCK",
  "DOUBLE_DIAGONAL",
  "UNBALANCED_BUTTERFLY",
  "UNBALANCED_CONDOR",
  "UNBALANCED_IRON_CONDOR",
  "UNBALANCED_VERTICAL_ROLL",
  "MUTUAL_FUND_SWAP",
  "CUSTOM",
]);
export type ComplexOrderStrategyType = z.infer<typeof ComplexOrderStrategyType>;

// Order statuses
export const OrderStatus = z.enum([
  "AWAITING_PARENT_ORDER",
  "AWAITING_CONDITION",
  "AWAITING_STOP_CONDITION",
  "AWAITING_MANUAL_REVIEW",
  "ACCEPTED",
  "AWAITING_UR_OUT",
  "PENDING_ACTIVATION",
  "QUEUED",
  "WORKING",
  "REJECTED",
  "PENDING_CANCEL",
  "CANCELED",
  "PENDING_REPLACE",
  "REPLACED",
  "FILLED",
  "EXPIRED",
  "NEW",
  "AWAITING_RELEASE_TIME",
  "PENDING_ACKNOWLEDGEMENT",
  "PENDING_RECALL",
  "UNKNOWN",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

// Instruction types for order legs
export const Instruction = z.enum([
  "BUY",
  "SELL",
  "BUY_TO_COVER",
  "SELL_SHORT",
  "BUY_TO_OPEN",
  "BUY_TO_CLOSE",
  "SELL_TO_OPEN",
  "SELL_TO_CLOSE",
  "EXCHANGE",
  "SELL_SHORT_EXEMPT",
]);
export type Instruction = z.infer<typeof Instruction>;

// Asset types
export const AssetType = z.enum([
  "EQUITY",
  "MUTUAL_FUND",
  "OPTION",
  "FUTURE",
  "FOREX",
  "INDEX",
  "CASH_EQUIVALENT",
  "FIXED_INCOME",
  "PRODUCT",
  "CURRENCY",
  "COLLECTIVE_INVESTMENT",
]);
export type AssetType = z.infer<typeof AssetType>;

// Activity Type for Order Activity
export const ActivityType = z.enum(["EXECUTION", "ORDER_ACTION"]);
export type ActivityType = z.infer<typeof ActivityType>;

// Execution Type for Order Activity
export const ExecutionType = z.enum(["FILL"]);
export type ExecutionType = z.infer<typeof ExecutionType>;

// Order Leg Type
export const OrderLegType = z.enum([
  "EQUITY",
  "OPTION",
  "INDEX",
  "MUTUAL_FUND",
  "CASH_EQUIVALENT",
  "FIXED_INCOME",
  "CURRENCY",
  "COLLECTIVE_INVESTMENT",
]);
export type OrderLegType = z.infer<typeof OrderLegType>;

// Position Effect for Order Legs
export const PositionEffect = z.enum(["OPENING", "CLOSING", "AUTOMATIC"]);
export type PositionEffect = z.infer<typeof PositionEffect>;

// Quantity Type for Order Legs
export const QuantityType = z.enum(["ALL_SHARES", "DOLLARS", "SHARES"]);
export type QuantityType = z.infer<typeof QuantityType>;

// Dividend Capital Gains for Order Legs
export const DivCapGains = z.enum(["REINVEST", "PAYOUT"]);
export type DivCapGains = z.infer<typeof DivCapGains>;

// Requested Destination for Orders
export const RequestedDestination = z.enum([
  "INET",
  "ECN_ARCA",
  "CBOE",
  "AMEX",
  "PHLX",
  "ISE",
  "BOX",
  "NYSE",
  "NASDAQ",
  "BATS",
  "C2",
  "AUTO",
]);
export type RequestedDestination = z.infer<typeof RequestedDestination>;

// Stop Price Link Basis for Orders
export const StopPriceLinkBasis = z.enum([
  "MANUAL",
  "BASE",
  "TRIGGER",
  "LAST",
  "BID",
  "ASK",
  "ASK_BID",
  "MARK",
  "AVERAGE",
]);
export type StopPriceLinkBasis = z.infer<typeof StopPriceLinkBasis>;

// Stop Price Link Type for Orders
export const StopPriceLinkType = z.enum(["VALUE", "PERCENT", "TICK"]);
export type StopPriceLinkType = z.infer<typeof StopPriceLinkType>;

// Stop Type for Orders
export const StopType = z.enum(["STANDARD", "BID", "ASK", "LAST", "MARK"]);
export type StopType = z.infer<typeof StopType>;

// Price Link Basis for Orders
export const PriceLinkBasis = z.enum([
  "MANUAL",
  "BASE",
  "TRIGGER",
  "LAST",
  "BID",
  "ASK",
  "ASK_BID",
  "MARK",
  "AVERAGE",
]);
export type PriceLinkBasis = z.infer<typeof PriceLinkBasis>;

// Price Link Type for Orders
export const PriceLinkType = z.enum(["VALUE", "PERCENT", "TICK"]);
export type PriceLinkType = z.infer<typeof PriceLinkType>;

// Tax Lot Method for Orders
export const TaxLotMethod = z.enum([
  "FIFO",
  "LIFO",
  "HIGH_COST",
  "LOW_COST",
  "AVERAGE_COST",
  "SPECIFIC_LOT",
  "LOSS_HARVESTER",
]);
export type TaxLotMethod = z.infer<typeof TaxLotMethod>;

// Special Instruction for Orders
export const SpecialInstruction = z.enum([
  "ALL_OR_NONE",
  "DO_NOT_REDUCE",
  "ALL_OR_NONE_DO_NOT_REDUCE",
]);
export type SpecialInstruction = z.infer<typeof SpecialInstruction>;

// Order Strategy Type (distinct from ComplexOrderStrategyType)
export const OrderStrategyType = z.enum([
  "SINGLE",
  "CANCEL",
  "RECALL",
  "PAIR",
  "FLATTEN",
  "TWO_DAY_SWAP",
  "BLAST_ALL",
  "OCO",
  "TRIGGER",
]);
export type OrderStrategyType = z.infer<typeof OrderStrategyType>;

// API Currency Type for Option Deliverables
export const ApiCurrencyType = z.enum(['USD', 'CAD', 'EUR', 'JPY']);
export type ApiCurrencyType = z.infer<typeof ApiCurrencyType>;

// Transaction Types
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
]);
export type TransactionType = z.infer<typeof TransactionType>;

// Fee Types for transactions and order commissions
export const FeeType = z.enum([
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
]);
export type FeeType = z.infer<typeof FeeType>;

/* Re-export models needed by multiple resources */
export { OrderSchema } from "../trader/orders/schema";
export { TransactionSchema } from "../trader/transactions/schema";
// ...
