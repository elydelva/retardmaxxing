import { SignInInput, SignUpInput } from "@retardmaxxing/contract";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc/context";

export const authRouter = router({
  signUp: publicProcedure
    .input(SignUpInput)
    .mutation(({ ctx, input }) => ctx.cradle.authService.signUp(input)),

  signIn: publicProcedure
    .input(SignInInput)
    .mutation(({ ctx, input }) => ctx.cradle.authService.signIn(input)),

  me: protectedProcedure.query(({ ctx }) => ({ userId: ctx.userId })),

  health: publicProcedure.input(z.void()).query(() => ({ ok: true, ts: Date.now() })),
});
