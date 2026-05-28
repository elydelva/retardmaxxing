import { UpdatePhoneInput } from "@retardmaxxing/contract";
import { protectedProcedure, router } from "../../trpc/context";

export const usersRouter = router({
  updatePhone: protectedProcedure
    .input(UpdatePhoneInput)
    .mutation(({ ctx, input }) =>
      ctx.cradle.usersRepo.updatePhoneNumber(ctx.userId, input.phoneNumber)
    ),
});
