import z from "zod";
import { TripStatus } from "../../../generated/prisma/enums.js";

const CreateTripSchema = z
  .object({
    vehicleId: z.uuid(),
    driverId: z.uuid(),
    originAddress: z.string().min(1),
    destinationAddress: z.string().min(1),
    scheduledAt: z.iso.datetime(),
    notes: z
      .string()
      .nullish()
      .transform((val) => val ?? null),
  })
  .strict();

const GetTripsSchema = z.object({
  status: z.enum(TripStatus).optional(),
  vehicleId: z.uuid().optional(),
  driverId: z.uuid().optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
