import type { PlanTier } from "@retardmaxxing/contract";

export const PLAN_LIMITS: Record<PlanTier, { maxProjects: number; supportTier: string }> = {
  free: { maxProjects: 3, supportTier: "community" },
  pro: { maxProjects: 50, supportTier: "email" },
  enterprise: { maxProjects: Number.POSITIVE_INFINITY, supportTier: "dedicated" },
};

export function canCreateProject(tier: PlanTier, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[tier].maxProjects;
}
