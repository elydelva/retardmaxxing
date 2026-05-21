# Adding a feature

Concrete recipe. Follow the order — each step depends on the previous.

We'll add a `projects` feature: users can list and create projects.

## 1. Schema (`packages/database/src/schema.ts`)

```ts
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

Generate migration:

```bash
bun run --cwd packages/database db:generate
```

Add the inferred types in `packages/database/src/types.ts`:

```ts
export type Project = typeof schema.projects.$inferSelect;
export type NewProject = typeof schema.projects.$inferInsert;
```

## 2. Contract (`packages/contract/src/projects.ts`)

```ts
import { z } from "zod";

export const ProjectDto = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  createdAt: z.date(),
});
export type ProjectDto = z.infer<typeof ProjectDto>;

export const CreateProjectInput = z.object({
  name: z.string().min(1).max(100),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
```

Re-export from `packages/contract/src/index.ts`.

## 3. Repository (`apps/api/src/modules/projects/projects.repo.ts`)

```ts
import { eq } from "drizzle-orm";
import { projects, type Database, type NewProject, type Project } from "@retardmaxxing/database";

export interface ProjectsRepo {
  listByOwner(ownerId: string): Promise<Project[]>;
  insert(values: NewProject): Promise<void>;
  countByOwner(ownerId: string): Promise<number>;
}

export function createProjectsRepo({ db }: { db: Database }): ProjectsRepo {
  return {
    async listByOwner(ownerId) {
      return db.select().from(projects).where(eq(projects.ownerId, ownerId)).all();
    },
    async insert(values) {
      await db.insert(projects).values(values);
    },
    async countByOwner(ownerId) {
      const rows = await db.select().from(projects).where(eq(projects.ownerId, ownerId)).all();
      return rows.length;
    },
  };
}
```

## 4. Service (`apps/api/src/modules/projects/projects.service.ts`)

```ts
import type { CreateProjectInput, ProjectDto } from "@retardmaxxing/contract";
import { canCreateProject } from "@retardmaxxing/domains";
import { TRPCError } from "@trpc/server";
import type { Logger } from "../../lib/logger";
import type { ProjectsRepo } from "./projects.repo";
import type { UsersRepo } from "../users/users.repo";

export interface ProjectsService {
  list(userId: string): Promise<ProjectDto[]>;
  create(userId: string, input: CreateProjectInput): Promise<ProjectDto>;
}

export interface ProjectsServiceDeps {
  projectsRepo: ProjectsRepo;
  usersRepo: UsersRepo;
  logger: Logger;
}

export function createProjectsService(deps: ProjectsServiceDeps): ProjectsService {
  const { projectsRepo, usersRepo, logger } = deps;
  return {
    async list(userId) {
      return projectsRepo.listByOwner(userId);
    },
    async create(userId, { name }) {
      const user = await usersRepo.findById(userId);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const count = await projectsRepo.countByOwner(userId);
      // domain rule lives in @retardmaxxing/domains
      if (!canCreateProject("free", count)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Plan limit reached" });
      }
      const project = {
        id: `proj_${crypto.randomUUID()}`,
        ownerId: userId,
        name,
        createdAt: new Date(),
      };
      await projectsRepo.insert(project);
      logger.info("project.created", { projectId: project.id, ownerId: userId });
      return project;
    },
  };
}
```

## 5. Register (`apps/api/src/container/register/projects.ts`)

```ts
import { asFunction, type AwilixContainer } from "awilix";
import { createProjectsRepo } from "../../modules/projects/projects.repo";
import { createProjectsService } from "../../modules/projects/projects.service";
import type { AppCradle } from "../cradle";

export function registerProjects(c: AwilixContainer<AppCradle>): void {
  c.register({
    projectsRepo: asFunction(createProjectsRepo).scoped(),
    projectsService: asFunction(createProjectsService).scoped(),
  });
}
```

Call it in `container/container.ts`:

```ts
import { registerProjects } from "./register/projects";
// ...
registerProjects(c);
```

Extend `AppCradle` in `container/cradle.ts`:

```ts
import type { ProjectsRepo } from "../modules/projects/projects.repo";
import type { ProjectsService } from "../modules/projects/projects.service";

export interface AppCradle {
  // ...
  projectsRepo: ProjectsRepo;
  projectsService: ProjectsService;
}
```

## 6. Router (`apps/api/src/modules/projects/projects.router.ts`)

```ts
import { CreateProjectInput } from "@retardmaxxing/contract";
import { protectedProcedure, router } from "../../trpc/context";

export const projectsRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.cradle.projectsService.list(ctx.userId)),
  create: protectedProcedure
    .input(CreateProjectInput)
    .mutation(({ ctx, input }) => ctx.cradle.projectsService.create(ctx.userId, input)),
});
```

Mount it in `trpc/root.ts`:

```ts
import { projectsRouter } from "../modules/projects/projects.router";

export const appRouter = router({
  auth: authRouter,
  projects: projectsRouter,
});
```

## 7. Tests

**Unit** (`apps/api/test/unit/projects/projects.service.unit.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { createProjectsService } from "../../../src/modules/projects/projects.service";
import { createFakeUsersRepo, makeUser, silentLogger } from "../../helpers/fakes";

describe("projectsService.create", () => {
  it("rejects when plan limit reached", async () => {
    const service = createProjectsService({
      projectsRepo: {
        listByOwner: async () => [],
        insert: async () => {},
        countByOwner: async () => 999, // way past free limit
      },
      usersRepo: createFakeUsersRepo({
        findById: async () => makeUser({ id: "u_1" }),
      }),
      logger: silentLogger,
    });
    await expect(service.create("u_1", { name: "X" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
```

**Integration** (`apps/api/test/integration/projects.repo.int.test.ts`) — same pattern as `users.repo.int.test.ts`.

## 8. Apply migration locally

```bash
cd apps/api && bunx wrangler d1 migrations apply retardmaxxing-db --local
```

## 9. Use it from the client

Web (`apps/app`):

```tsx
const projects = useQuery({
  queryKey: ["projects"],
  queryFn: () => trpcClient.projects.list.query(),
});
```

Mobile is identical because both apps import `AppRouter` from `@retardmaxxing/api/trpc`.

## Checklist

- [ ] schema → migration generated
- [ ] contract Zod schemas
- [ ] `<feature>.repo.ts` (factory + interface)
- [ ] `<feature>.service.ts` (factory + interface, deps typed)
- [ ] `register/<feature>.ts` registered in `container.ts`
- [ ] cradle interface extended in `cradle.ts`
- [ ] `<feature>.router.ts` mounted in `trpc/root.ts`
- [ ] unit test (service)
- [ ] integration test (repo)
- [ ] migration applied locally
