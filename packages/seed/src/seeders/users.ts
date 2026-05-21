import { generateSigningKey } from "@retardmaxxing/auth";
import { users } from "@retardmaxxing/database";
import { eq } from "drizzle-orm";
import type { Seeder } from "../core/types";

const DEMO_USERS = [
  { id: "u_demo_admin", email: "admin@demo.local", name: "Demo Admin" },
  { id: "u_demo_user", email: "user@demo.local", name: "Demo User" },
];

export const usersSeeder: Seeder = {
  name: "demo-users",
  description: "Demo accounts (local + staging only)",
  tags: ["demo-data"],
  envs: ["local", "staging"],
  async hash() {
    return JSON.stringify(DEMO_USERS);
  },
  async run(ctx) {
    for (const u of DEMO_USERS) {
      const existing = await ctx.db.select().from(users).where(eq(users.id, u.id)).get();
      if (existing) {
        ctx.log.info(`exists ${u.id}`);
        continue;
      }
      await ctx.db.insert(users).values({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: null,
        signingKey: generateSigningKey(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      ctx.log.info(`inserted ${u.id}`);
    }
  },
};
