import { schemas } from '@sudowealth/schwab-api'
import type { z } from 'zod'

const equity: 'EQUITY' = schemas.AssetTypeEnum.Enum.EQUITY
export const asset: z.infer<typeof schemas.AssetTypeEnum> = equity

// @ts-expect-error Only declared enum keys may be accessed.
schemas.AssetTypeEnum.Enum.NONEXISTENT
