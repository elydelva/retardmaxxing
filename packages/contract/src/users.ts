import { z } from "zod";

export const UserDto = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  phoneNumber: z.string().nullable(),
});
export type UserDto = z.infer<typeof UserDto>;

export const UpdateUserInput = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;

export const UpdatePhoneInput = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/)
    .nullable(),
});
export type UpdatePhoneInput = z.infer<typeof UpdatePhoneInput>;
