import type { Seeder } from "../core/types";
import { plansSeeder } from "./plans";
import { usersSeeder } from "./users";

export const ALL_SEEDERS: Seeder[] = [plansSeeder, usersSeeder];
