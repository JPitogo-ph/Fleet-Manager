import { VehicleStatus, VehicleType } from "../../../generated/prisma/enums.js";
import { z } from "zod";

export const CreateVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  type: z.enum(VehicleType),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().extend({
  status: z.enum(VehicleStatus).optional(),
}).strict(); //Silenty 200s with invalid key without strict mode.

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
