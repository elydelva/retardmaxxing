import { z } from "zod";

export const ProviderSchema = z.enum(["google", "apple"]);
export type Provider = z.infer<typeof ProviderSchema>;

const emailSchema = z
  .string()
  .email()
  .transform((s) => s.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .refine(
    (p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p),
    "Password must contain at least one letter and one number"
  );

export const SignUpInput = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});
export type SignUpInput = z.infer<typeof SignUpInput>;

export const SignInInput = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof SignInInput>;

export const SignInWithProviderInput = z.object({
  provider: ProviderSchema,
  code: z.string().min(1),
  state: z.string().min(1),
  codeVerifier: z.string().optional(),
});
export type SignInWithProviderInput = z.infer<typeof SignInWithProviderInput>;

export const AuthSessionDto = z.object({
  token: z.string(),
  userId: z.string(),
  email: z.string().email(),
  signingKey: z.string(),
  expiresAt: z.number(),
});
export type AuthSessionDto = z.infer<typeof AuthSessionDto>;
