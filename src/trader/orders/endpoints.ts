import { createEndpoint } from "../../core/http";
import { OrdersArraySchema, OrdersQuerySchema } from "./schema";
import { z } from "zod";

export type GetOrdersRequestPathParams = {
  accountId: string; // Hashed Account ID
};
export type GetOrdersRequestQueryParams = z.infer<typeof OrdersQuerySchema>;
export type GetOrdersResponseBody = z.infer<typeof OrdersArraySchema>;

export const getOrders = createEndpoint<
  GetOrdersRequestPathParams,
  GetOrdersRequestQueryParams,
  never,
  GetOrdersResponseBody,
  "GET",
  any
>({
  method: "GET",
  path: "/trader/v1/accounts/:accountId/orders",
  pathSchema: z.object({ accountId: z.string() }),
  querySchema: OrdersQuerySchema,
  responseSchema: OrdersArraySchema,
  description: "Retrieves orders for a specific account.",
});

// Placeholder for placeOrder (typically a POST request)
// export const placeOrder = createEndpoint<...>;
