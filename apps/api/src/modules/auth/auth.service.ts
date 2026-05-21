import {
  createSession,
  generateSessionToken,
  generateSigningKey,
  hashPassword,
  verifyPassword,
} from "@retardmaxxing/auth";
import type { AuthSessionDto, SignInInput, SignUpInput } from "@retardmaxxing/contract";
import type { Database } from "@retardmaxxing/database";
import { TRPCError } from "@trpc/server";
import type { AppBindings } from "../../lib/bindings";
import type { Logger } from "../../lib/logger";
import type { UsersRepo } from "../users/users.repo";

export interface AuthService {
  signUp(input: SignUpInput): Promise<AuthSessionDto>;
  signIn(input: SignInInput): Promise<AuthSessionDto>;
}

export interface AuthServiceDeps {
  db: Database;
  env: AppBindings;
  usersRepo: UsersRepo;
  logger: Logger;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { db, usersRepo, logger } = deps;

  async function issueSession(user: {
    id: string;
    email: string;
    signingKey: string;
  }): Promise<AuthSessionDto> {
    const token = generateSessionToken();
    const session = await createSession(db, user.id, token);
    logger.info("session.issued", { userId: user.id, expiresAt: session.expiresAt.toISOString() });
    return {
      token,
      userId: user.id,
      email: user.email,
      signingKey: user.signingKey,
      expiresAt: session.expiresAt.getTime(),
    };
  }

  return {
    async signUp({ email, password, name }) {
      const existing = await usersRepo.findByEmail(email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const userId = `u_${crypto.randomUUID()}`;
      const passwordHash = await hashPassword(password);
      const signingKey = generateSigningKey();
      const now = new Date();

      try {
        await usersRepo.insertUser({
          id: userId,
          email,
          emailVerifiedAt: null,
          name: name ?? null,
          avatarUrl: null,
          passwordHash,
          signingKey,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE")) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }
        logger.error("signUp.insertUser failed", { err: msg });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sign up failed" });
      }

      logger.info("user.signedUp", { userId, email });
      return issueSession({ id: userId, email, signingKey });
    },

    async signIn({ email, password }) {
      const user = await usersRepo.findByEmail(email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      return issueSession({ id: user.id, email: user.email, signingKey: user.signingKey });
    },
  };
}
