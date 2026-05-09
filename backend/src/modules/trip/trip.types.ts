import z from "zod";
import { TripStatus } from "../../../generated/prisma/enums.js";

//Basic CRUD
export const CreateTripSchema = z
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

export const GetTripsSchema = z.object({
  status: z.enum(TripStatus).optional(),
  vehicleId: z.uuid().optional(),
  driverId: z.uuid().optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;

//Domain Logic
export const StartTripSchema = z
  .object({
    odometerStartKm: z.number().positive(),
  })
  .strict();

export const CompleteTripSchema = z
  .object({
    odometerEndKm: z.number().positive(),
  })
  .strict();

export const CancelTripSchema = z
  .object({
    cancellationReason: z.string().min(1).optional(),
  })
  .strict();

export type StartTripInput = z.infer<typeof StartTripSchema>;
export type CompleteTripInput = z.infer<typeof CompleteTripSchema>;
export type CancelTripInput = z.infer<typeof CancelTripSchema>;
