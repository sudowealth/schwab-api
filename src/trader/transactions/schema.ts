import { z } from "zod";
import {
  AssetType,
  FeeType,
  PositionEffect,
  TransactionType,
  // Enums used by some instrument sub-types if they were defined in shared schemas
  // For now, assuming specific enums like Option 'putCall' or 'type' are defined locally if not shared
} from "../../schemas";

// --- User Details --- (Often part of Transaction context)
export const UserDetails = z.object({
  cdDomainId: z.string().optional(),
  login: z.string().optional(),
  type: z
    .enum([
      "ADVISOR_USER",
      "BROKER_USER",
      "CLIENT_USER",
      "SYSTEM_USER",
      "UNKNOWN",
    ])
    .optional(),
  userId: z.number().int().optional(),
  systemUserName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  brokerRepCode: z.string().optional(),
});
export type UserDetails = z.infer<typeof UserDetails>;

// --- Transaction Instrument Schemas ---

export const TransactionAPIOptionDeliverable = z.object({
  rootSymbol: z.string().optional(),
  strikePercent: z.number().int().optional(),
  deliverableNumber: z.number().int().optional(),
  deliverableUnits: z.number().optional(),
  deliverable: z.any().optional(), // Was any in MCP
  assetType: AssetType.optional(),
});
export type TransactionAPIOptionDeliverable = z.infer<
  typeof TransactionAPIOptionDeliverable
>;

// Base for all transaction instruments
export const TransactionBaseInstrument = z.object({
  assetType: AssetType,
  cusip: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  instrumentId: z.number().int().optional(),
  netChange: z.number().optional(), // From AccountsBaseInstrument, might not apply to all transactions
});
export type TransactionBaseInstrument = z.infer<
  typeof TransactionBaseInstrument
>;

export const TransactionCashEquivalent = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.CASH_EQUIVALENT),
  type: z
    .enum(["SWEEP_VEHICLE", "SAVINGS", "MONEY_MARKET_FUND", "UNKNOWN"])
    .optional(),
});
export type TransactionCashEquivalent = z.infer<
  typeof TransactionCashEquivalent
>;

export const CollectiveInvestment = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.COLLECTIVE_INVESTMENT),
  // MCP had instrumentId: z.any(), type: z.any() for this one
  instrumentId: z.any().optional(),
  type: z.any().optional(),
});
export type CollectiveInvestment = z.infer<typeof CollectiveInvestment>;

// Currency schema for use in Forex
export const CurrencySchema = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.CURRENCY),
});
export type CurrencySchema = z.infer<typeof CurrencySchema>;

export const TransactionEquity = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.EQUITY),
  type: z
    .enum([
      "COMMON_STOCK",
      "PREFERRED_STOCK",
      "DEPOSITORY_RECEIPT",
      "PREFERRED_DEPOSITORY_RECEIPT",
      "RESTRICTED_STOCK",
      "COMPONENT_UNIT",
      "RIGHT",
      "WARRANT",
      "CONVERTIBLE_PREFERRED_STOCK",
      "CONVERTIBLE_STOCK",
      "LIMITED_PARTNERSHIP",
      "WHEN_ISSUED",
      "UNKNOWN",
    ])
    .optional(),
});
export type TransactionEquity = z.infer<typeof TransactionEquity>;

export const TransactionFixedIncome = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FIXED_INCOME),
  type: z
    .enum([
      "BOND_UNIT",
      "CERTIFICATE_OF_DEPOSIT",
      "CONVERTIBLE_BOND",
      "COLLATERALIZED_MORTGAGE_OBLIGATION",
      "CORPORATE_BOND",
      "GOVERNMENT_MORTGAGE",
      "GNMA_BONDS",
      "MUNICIPAL_ASSESSMENT_DISTRICT",
      "MUNICIPAL_BOND",
      "OTHER_GOVERNMENT",
      "SHORT_TERM_PAPER",
      "US_TREASURY_BOND",
      "US_TREASURY_BILL",
      "US_TREASURY_NOTE",
      "US_TREASURY_ZERO_COUPON",
      "AGENCY_BOND",
      "WHEN_AS_AND_IF_ISSUED_BOND",
      "ASSET_BACKED_SECURITY",
      "UNKNOWN",
    ])
    .optional(),
  maturityDate: z.string().datetime().optional(),
  factor: z.number().optional(),
  multiplier: z.number().optional(),
  variableRate: z.number().optional(),
});
export type TransactionFixedIncome = z.infer<typeof TransactionFixedIncome>;

export const Forex = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FOREX),
  type: z.enum(["STANDARD", "NBBO", "UNKNOWN"]).optional(),
  baseCurrency: z.lazy(() => CurrencySchema).optional(),
  counterCurrency: z.lazy(() => CurrencySchema).optional(),
});
export type Forex = z.infer<typeof Forex>;

export const Future = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FUTURE),
  activeContract: z.boolean().default(false).optional(),
  type: z.enum(["STANDARD", "UNKNOWN"]).optional(),
  expirationDate: z.string().datetime().optional(),
  lastTradingDate: z.string().datetime().optional(),
  firstNoticeDate: z.string().datetime().optional(),
  multiplier: z.number().optional(),
});
export type Future = z.infer<typeof Future>;

export const Index = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.INDEX),
  activeContract: z.boolean().default(false).optional(),
  type: z.string().optional(), // MCP had 'Enum Array [ 3 ] unclear'
});
export type Index = z.infer<typeof Index>;

export const TransactionMutualFund = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.MUTUAL_FUND),
  fundFamilyName: z.string().optional(),
  fundFamilySymbol: z.string().optional(),
  fundGroup: z.string().optional(),
  type: z
    .enum([
      "NOT_APPLICABLE",
      "OPEN_END_NON_TAXABLE",
      "OPEN_END_TAXABLE",
      "NO_LOAD_NON_TAXABLE",
      "NO_LOAD_TAXABLE",
      "UNKNOWN",
    ])
    .optional(),
  exchangeCutoffTime: z.string().datetime().optional(),
  purchaseCutoffTime: z.string().datetime().optional(),
  redemptionCutoffTime: z.string().datetime().optional(),
});
export type TransactionMutualFund = z.infer<typeof TransactionMutualFund>;

export const TransactionOption = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.OPTION),
  expirationDate: z.string().datetime().optional(),
  optionDeliverables: z.array(TransactionAPIOptionDeliverable).optional(),
  optionPremiumMultiplier: z.number().int().optional(),
  putCall: z.enum(["PUT", "CALL", "UNKNOWN"]).optional(),
  strikePrice: z.number().optional(),
  type: z.enum(["VANILLA", "BINARY", "BARRIER", "UNKNOWN"]).optional(),
  underlyingSymbol: z.string().optional(),
  underlyingCusip: z.string().optional(),
  deliverable: z.any().optional(), // Was any in MCP
});
export type TransactionOption = z.infer<typeof TransactionOption>;

export const Product = TransactionBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.PRODUCT),
  type: z.enum(["TBD", "UNKNOWN"]).optional(),
});
export type Product = z.infer<typeof Product>;

// Discriminated union of all transaction instrument types
export const TransactionInstrument = z.discriminatedUnion("assetType", [
  TransactionCashEquivalent,
  CollectiveInvestment,
  CurrencySchema, // Using the specific Currency schema here
  TransactionEquity,
  TransactionFixedIncome,
  Forex,
  Future,
  Index,
  TransactionMutualFund,
  TransactionOption,
  Product,
]);
export type TransactionInstrument = z.infer<typeof TransactionInstrument>;

// --- Transfer Item --- (Part of a Transaction)
export const TransferItem = z.object({
  instrument: TransactionInstrument,
  amount: z.number().optional(),
  cost: z.number().optional(),
  price: z.number().optional(),
  feeType: FeeType.optional(), // Enum from shared schemas
  positionEffect: PositionEffect.optional(), // Enum from shared schemas
});
export type TransferItem = z.infer<typeof TransferItem>;

// --- Main Transaction Schema ---
export const TransactionSchema = z.object({
  activityId: z.number().int().optional(),
  time: z.string().datetime().optional(),
  user: UserDetails.optional(),
  description: z.string().optional(),
  accountNumber: z.string(), // Typically required
  type: TransactionType, // Enum from shared schemas
  status: z.enum(["VALID", "INVALID", "PENDING", "UNKNOWN"]).optional(),
  subAccount: z
    .enum(["CASH", "MARGIN", "SHORT", "DIV", "INCOME", "UNKNOWN"])
    .optional(),
  tradeDate: z.string().datetime().optional(),
  settlementDate: z.string().datetime().optional(),
  positionId: z.number().int().optional(),
  orderId: z.number().int().optional(),
  netAmount: z.number().optional(),
  activityType: z
    .enum([
      "ACTIVITY_CORRECTION",
      "EXECUTION",
      "ORDER_ACTION",
      "TRANSFER",
      "UNKNOWN",
    ])
    .optional(), // Note: shared schemas has ActivityType = z.enum(['EXECUTION', 'ORDER_ACTION'])
  transferItems: z.array(TransferItem).optional(),
});
export type TransactionSchema = z.infer<typeof TransactionSchema>;

export const TransactionsArraySchema = z.array(TransactionSchema);
export type TransactionsArraySchema = z.infer<typeof TransactionsArraySchema>;
