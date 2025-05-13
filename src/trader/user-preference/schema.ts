import { z } from "zod";

export const UserPreferenceAccountSchema = z.object({
  accountNumber: z.string(),
  primaryAccount: z.boolean().default(false).optional(),
  type: z.string().optional(),
  nickName: z.string().optional(),
  accountColor: z.enum(["Green", "Blue"]).optional(),
  displayAcctId: z.string().optional(),
  autoPositionEffect: z.boolean().default(false).optional(),
});
export type UserPreferenceAccountSchema = z.infer<
  typeof UserPreferenceAccountSchema
>;

export const StreamerInfoSchema = z.object({
  streamerSocketUrl: z.string().optional(),
  schwabClientCustomerId: z.string().optional(),
  schwabClientCorrelId: z.string().optional(),
  schwabClientChannel: z.string().optional(),
  schwabClientFunctionId: z.string().optional(),
});
export type StreamerInfoSchema = z.infer<typeof StreamerInfoSchema>;

export const OfferSchema = z.object({
  level2Permissions: z.boolean().default(false).optional(),
  mktDataPermission: z.string().optional(),
});
export type OfferSchema = z.infer<typeof OfferSchema>;

export const UserPreferenceSchema = z.object({
  accounts: z.array(UserPreferenceAccountSchema).optional(),
  streamerInfo: z.array(StreamerInfoSchema).optional(),
  offers: z.array(OfferSchema).optional(),
});
export type UserPreferenceSchema = z.infer<typeof UserPreferenceSchema>;
