import { plans } from "@retardmaxxing/database";
import { eq } from "drizzle-orm";
import type { Seeder } from "../core/types";

interface PlanFixture {
  id: string;
  tier: "free" | "pro" | "enterprise";
  name: string;
  priceMonthlyCents: number;
}

const FIXTURES: Record<"local" | "staging" | "production", PlanFixture[]> = {
  local: [
    { id: "plan_free", tier: "free", name: "Free (dev)", priceMonthlyCents: 0 },
    { id: "plan_pro", tier: "pro", name: "Pro (dev)", priceMonthlyCents: 100 },
    { id: "plan_ent", tier: "enterprise", name: "Enterprise (dev)", priceMonthlyCents: 500 },
  ],
  staging: [
    { id: "plan_free", tier: "free", name: "Free", priceMonthlyCents: 0 },
    { id: "plan_pro", tier: "pro", name: "Pro", priceMonthlyCents: 1900 },
    { id: "plan_ent", tier: "enterprise", name: "Enterprise", priceMonthlyCents: 9900 },
  ],
  production: [
    { id: "plan_free", tier: "free", name: "Free", priceMonthlyCents: 0 },
    { id: "plan_pro", tier: "pro", name: "Pro", priceMonthlyCents: 1900 },
    { id: "plan_ent", tier: "enterprise", name: "Enterprise", priceMonthlyCents: 14900 },
  ],
};

export const plansSeeder: Seeder = {
  name: "plans",
  description: "Subscription plan tiers (free/pro/enterprise) per environment",
  tags: ["subscription", "fixtures"],
  async hash(ctx) {
    return JSON.stringify(FIXTURES[ctx.env]);
  },
  async run(ctx) {
    const fixtures = FIXTURES[ctx.env];
    for (const f of fixtures) {
      const existing = await ctx.db.select().from(plans).where(eq(plans.id, f.id)).get();
      if (existing) {
        await ctx.db
          .update(plans)
          .set({
            tier: f.tier,
            name: f.name,
            priceMonthlyCents: f.priceMonthlyCents,
            active: true,
          })
          .where(eq(plans.id, f.id));
        ctx.log.info(`updated ${f.id}`);
      } else {
        await ctx.db.insert(plans).values({
          id: f.id,
          tier: f.tier,
          name: f.name,
          priceMonthlyCents: f.priceMonthlyCents,
          active: true,
          createdAt: new Date(),
        });
        ctx.log.info(`inserted ${f.id}`);
      }
    }
  },
};
