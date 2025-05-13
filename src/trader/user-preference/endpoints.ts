import { createEndpoint } from "../../core/http";
import { UserPreferenceSchema } from "./schema";
import { z } from "zod";

export type GetUserPreferenceRequestPathParams = never;
export type GetUserPreferenceRequestQueryParams = never;
export type GetUserPreferenceResponseBody = z.infer<
  typeof UserPreferenceSchema
>;

export const getUserPreference = createEndpoint<
  GetUserPreferenceRequestPathParams,
  GetUserPreferenceRequestQueryParams,
  never,
  GetUserPreferenceResponseBody,
  "GET",
  any
>({
  method: "GET",
  path: "/trader/v1/userPreference",
  responseSchema: UserPreferenceSchema,
  description: "Retrieves user preferences.",
});
