import z from "zod";
import { DriverStatus } from "../../../generated/prisma/enums.js";

export const CreateDriverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.iso.datetime(),
  status: z.enum(DriverStatus).optional().default(DriverStatus.ACTIVE),
});

export const UpdateDriverSchema = CreateDriverSchema.partial().strict();

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;
