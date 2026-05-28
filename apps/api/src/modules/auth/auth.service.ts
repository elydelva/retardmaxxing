import {
  appleClient,
  createSession,
  generateSessionToken,
  generateSigningKey,
  googleClient,
  hashPassword,
  verifyPassword,
} from "@retardmaxxing/auth";
import type {
  AuthSessionDto,
  SignInInput,
  SignInWithProviderInput,
  SignUpInput,
} from "@retardmaxxing/contract";
import type { Database } from "@retardmaxxing/database";
import { TRPCError } from "@trpc/server";
import type { AppBindings } from "../../lib/bindings";
import type { Logger } from "../../lib/logger";
import type { UsersRepo } from "../users/users.repo";

export interface AuthService {
  signUp(input: SignUpInput): Promise<AuthSessionDto>;
  signIn(input: SignInInput): Promise<AuthSessionDto>;
  signInWithProvider(input: SignInWithProviderInput): Promise<AuthSessionDto>;
}

export interface AuthServiceDeps {
  db: Database;
  env: AppBindings;
  usersRepo: UsersRepo;
  logger: Logger;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const { db, env, usersRepo, logger } = deps;

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
      if (!user?.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      return issueSession({ id: user.id, email: user.email, signingKey: user.signingKey });
    },

    async signInWithProvider({ provider, code, codeVerifier }) {
      let providerUserId: string;
      let email: string;
      let name: string | null = null;

      try {
        if (provider === "google") {
          if (!codeVerifier) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "codeVerifier required for Google",
            });
          }
          const tokens = await googleClient(env).validateAuthorizationCode(code, codeVerifier);
          const payload = JSON.parse(atob(tokens.idToken().split(".")[1]!)) as {
            sub: string;
            email: string;
            name?: string;
          };
          providerUserId = payload.sub;
          email = payload.email;
          name = payload.name ?? null;
        } else {
          const tokens = await appleClient(env).validateAuthorizationCode(code);
          const payload = JSON.parse(atob(tokens.idToken().split(".")[1]!)) as {
            sub: string;
            email: string;
          };
          providerUserId = payload.sub;
          email = payload.email;
        }
      } catch (err) {
        logger.error("oauth.validateCode.failed", { provider, err: String(err) });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "OAuth failed" });
      }

      let user = await usersRepo.findByProviderIdentity(provider, providerUserId);

      if (!user) {
        const existing = await usersRepo.findByEmail(email);
        if (existing) {
          await usersRepo.insertIdentity({
            id: `id_${crypto.randomUUID()}`,
            userId: existing.id,
            provider,
            providerUserId,
          });
          user = existing;
        } else {
          const userId = `u_${crypto.randomUUID()}`;
          const signingKey = generateSigningKey();
          const now = new Date();
          await usersRepo.insertUser({
            id: userId,
            email,
            emailVerifiedAt: now,
            name,
            avatarUrl: null,
            passwordHash: null,
            signingKey,
            stripeCustomerId: null,
            phoneNumber: null,
            createdAt: now,
            updatedAt: now,
          });
          await usersRepo.insertIdentity({
            id: `id_${crypto.randomUUID()}`,
            userId,
            provider,
            providerUserId,
          });
          user = {
            id: userId,
            email,
            emailVerifiedAt: now,
            name,
            avatarUrl: null,
            passwordHash: null,
            signingKey,
            stripeCustomerId: null,
            phoneNumber: null,
            createdAt: now,
            updatedAt: now,
          };
        }
        logger.info("oauth.user.upserted", { provider, userId: user.id });
      }

      return issueSession({ id: user.id, email: user.email, signingKey: user.signingKey });
    },
  };
}
