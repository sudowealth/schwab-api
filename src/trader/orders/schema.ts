import { z } from "zod";
import {
  Session,
  Duration,
  OrderType,
  ComplexOrderStrategyType,
  OrderStatus,
  Instruction,
  ActivityType,
  ExecutionType,
  OrderLegType,
  PositionEffect,
  QuantityType,
  DivCapGains,
  RequestedDestination,
  StopPriceLinkBasis,
  StopPriceLinkType,
  StopType,
  PriceLinkBasis,
  PriceLinkType,
  TaxLotMethod,
  SpecialInstruction,
  OrderStrategyType,
} from "../../schemas";

// Forward declaration for z.lazy, will be defined in accounts/schema.ts
// Assuming AccountsInstrument will be exported from there.
import type { AccountsInstrument as AccountsInstrumentType } from "../accounts/schema";
const AccountsInstrument: z.ZodType<AccountsInstrumentType> = z.lazy(
  () => (require("../accounts/schema") as any).AccountsInstrument
);

export const ExecutionLeg = z.object({
  legId: z.number().int(),
  price: z.number(),
  quantity: z.number(),
  mismarkedQuantity: z.number(),
  instrumentId: z.number().int(),
  time: z.string().datetime(),
});
export type ExecutionLeg = z.infer<typeof ExecutionLeg>;

export const OrderActivity = z.object({
  activityType: ActivityType,
  executionType: ExecutionType.optional(), // Optional based on activityType = EXECUTION
  quantity: z.number(),
  orderRemainingQuantity: z.number(),
  executionLegs: z.array(ExecutionLeg),
});
export type OrderActivity = z.infer<typeof OrderActivity>;

export const OrderLegCollection = z.object({
  orderLegType: OrderLegType,
  legId: z.number().int(),
  instrument: AccountsInstrument, // Using the lazy loaded schema
  instruction: Instruction,
  positionEffect: PositionEffect,
  quantity: z.number(),
  quantityType: QuantityType,
  divCapGains: DivCapGains.optional(), // Making optional as it might not always apply
  toSymbol: z.string().optional(), // Making optional
});
export type OrderLegCollection = z.infer<typeof OrderLegCollection>;

export const OrderSchema = z.object({
  session: Session,
  duration: Duration,
  orderType: OrderType,
  cancelTime: z.string().datetime().optional(),
  complexOrderStrategyType: ComplexOrderStrategyType,
  quantity: z.number(),
  filledQuantity: z.number(),
  remainingQuantity: z.number(),
  requestedDestination: RequestedDestination.optional(),
  destinationLinkName: z.string().optional(),
  releaseTime: z.string().datetime().optional(),
  stopPrice: z.number().optional(),
  stopPriceLinkBasis: StopPriceLinkBasis.optional(),
  stopPriceLinkType: StopPriceLinkType.optional(),
  stopPriceOffset: z.number().optional(),
  stopType: StopType.optional(),
  priceLinkBasis: PriceLinkBasis.optional(),
  priceLinkType: PriceLinkType.optional(),
  price: z.number().optional(),
  taxLotMethod: TaxLotMethod.optional(),
  orderLegCollection: z.array(OrderLegCollection),
  activationPrice: z.number().optional(),
  specialInstruction: SpecialInstruction.optional(),
  orderStrategyType: OrderStrategyType,
  orderId: z.number().int(),
  cancelable: z.boolean().default(false),
  editable: z.boolean().default(false),
  status: OrderStatus,
  enteredTime: z.string().datetime(),
  closeTime: z.string().datetime().optional(),
  tag: z.string().optional(),
  accountNumber: z.number().int(), // In MCP this was string for OrderRequest, number for Order. Standardizing to number.
  orderActivityCollection: z.array(OrderActivity).optional(),
  replacingOrderCollection: z.array(z.object({})).optional(), // Placeholder
  childOrderStrategies: z.array(z.object({})).optional(), // Placeholder
  statusDescription: z.string().optional(),
});
export type OrderSchema = z.infer<typeof OrderSchema>;

export const OrdersArraySchema = z.array(OrderSchema);
export type OrdersArraySchema = z.infer<typeof OrdersArraySchema>;

// Schema for GET /accounts/{accountId}/orders query parameters
export const OrdersQuerySchema = z
  .object({
    maxResults: z.number().int().optional(),
    fromEnteredTime: z.string().datetime().optional(),
    toEnteredTime: z.string().datetime().optional(),
    status: OrderStatus.optional(), // Use the imported OrderStatus enum
  })
  .optional();
export type OrdersQuerySchema = z.infer<typeof OrdersQuerySchema>;

// Also including OrderRequest from MCP schemas for completeness if needed later,
// but not exporting yet unless specified.
const OrderRequestSchema = z.object({
  session: Session.optional(),
  duration: Duration.optional(),
  orderType: OrderType, // Assuming OrderType from shared schemas is sufficient
  // orderType: orderTypeRequest, // MCP had a specific orderTypeRequest enum
  cancelTime: z.string().datetime().optional(),
  complexOrderStrategyType: ComplexOrderStrategyType.optional(),
  quantity: z.number().optional(),
  // filledQuantity: z.number(), // Typically not part of a request
  // remainingQuantity: z.number(), // Typically not part of a request
  destinationLinkName: z.string().optional(),
  releaseTime: z.string().datetime().optional(),
  stopPrice: z.number().optional(),
  stopPriceLinkBasis: StopPriceLinkBasis.optional(),
  stopPriceLinkType: StopPriceLinkType.optional(),
  stopPriceOffset: z.number().optional(),
  stopType: StopType.optional(),
  priceLinkBasis: PriceLinkBasis.optional(),
  priceLinkType: PriceLinkType.optional(),
  price: z.number().optional(),
  taxLotMethod: TaxLotMethod.optional(),
  orderLegCollection: z.array(OrderLegCollection),
  activationPrice: z.number().optional(),
  specialInstruction: SpecialInstruction.optional(),
  orderStrategyType: OrderStrategyType.optional(),
  // orderId: z.number().int(), // Optional for new orders, not usually in request body like this
  // cancelable: z.boolean().default(false), // Typically not part of a request
  // editable: z.boolean().default(false), // Typically not part of a request
  // status: OrderStatus, // Typically not part of a request
  // enteredTime: z.string().datetime(), // Typically set by server
  // closeTime: z.string().datetime(), // Typically set by server
  // accountNumber: z.string(), // Must match path param
  // orderActivityCollection: z.array(OrderActivity), // Typically not part of a request
  // replacingOrderCollection: z.array(z.object({})), // Placeholder
  // childOrderStrategies: z.array(z.object({})), // Placeholder
  // statusDescription: z.string(), // Typically not part of a request
});
// export type OrderRequestSchema = z.infer<typeof OrderRequestSchema>;

// Schemas like OrderBalance, OrderStrategy, OrderValidationDetail from MCP's schemas.ts
// were not directly part of the main 'Order' object in MCP.
// They might be part of other specific responses (e.g. preview order, or specific order detail calls)
// We can add them here if/when specific endpoints require them.
// For now, focusing on the main OrderSchema as derived from MCP's 'Order'.
