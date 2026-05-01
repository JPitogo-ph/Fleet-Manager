import { VehicleStatus, VehicleType } from "../../../generated/prisma/enums";
import { z } from "zod";

export const CreateVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  type: z.enum(VehicleType),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().extend({
  status: z.enum(VehicleStatus).optional(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
