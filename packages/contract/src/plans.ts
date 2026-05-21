import { z } from "zod";

export const PlanTierSchema = z.enum(["free", "pro", "enterprise"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanDto = z.object({
  id: z.string(),
  tier: PlanTierSchema,
  name: z.string(),
  priceMonthlyCents: z.number().int().nonnegative(),
  active: z.boolean(),
});
export type PlanDto = z.infer<typeof PlanDto>;
