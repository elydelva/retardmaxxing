# Docs index

How-tos for working in this monorepo. Read the one that matches your task — don't read all of them.

- **[backend-architecture.md](./backend-architecture.md)** — repo / service / router pattern, DI with Awilix, the cradle, conventions for new modules.
- **[adding-a-feature.md](./adding-a-feature.md)** — concrete recipe: contract → schema → repo → service → router → test.
- **[auth-flow.md](./auth-flow.md)** — signup/signin paths, password hashing, HMAC integrity for mobile, OAuth.
- **[testing.md](./testing.md)** — unit (mocked) vs integration (real D1) vs RTL component tests vs Cypress vs Maestro. Where each lives, how to run them.
- **[seeders.md](./seeders.md)** — extensible CLI: writing a `Seeder`, env switching, hash cache, prod safety.
- **[cloudflare.md](./cloudflare.md)** — wrangler bindings, provisioning D1/KV/R2/Queues, secrets, deploy.

The top-level **[CLAUDE.md](../CLAUDE.md)** is the entry point for AI agents and links here.
