import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { TripStatus } from "../../../generated/prisma/enums.js";
import type { CreateTripInput } from "./trip.types.js";
import { AppError } from "../../types/error.types.js";

export const TripService = {
  async getAll(filters: {
    status?: TripStatus;
    vehicleId?: string;
    driverId: string;
  }) {
    const where: Prisma.TripWhereInput = {};

    //Online examples prefer inline && spreading, I think this is cleaner.
    if (filters.status) where.status = filters.status;
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.driverId) where.driverId = filters.driverId;

    return await prisma.trip.findMany({
      where: where,
      include: {
        vehicle: {
          select: { id: true, plateNumber: true, make: true, model: true },
        },
        driver: { select: { id: true, name: true, licenseNumber: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  },

  async getById(id: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { id: true, plateNumber: true, make: true, model: true },
        },
        driver: { select: { id: true, name: true, licenseNumber: true } },
      },
    });
    if (!trip) throw new AppError(404, "Trip not found");

    return trip;
  },

  async create(input: CreateTripInput) {
    //Vehicle exists and active
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle) throw new AppError(404, "Vehicle not found");
    if (vehicle.status !== "ACTIVE")
      throw new AppError(409, "Vehicle not active");

    //Vehicle must not already be on active trip
    const vehicleOnTrip = await prisma.trip.findFirst({
      where: { vehicleId: input.vehicleId, status: TripStatus.ACTIVE },
    });
    if (vehicleOnTrip)
      throw new AppError(409, "Vehicle is already in active trip");

    //Driver exists and is active
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
    });
    if (!driver) throw new AppError(404, "Driver not found");
    if (driver.status !== "ACTIVE")
      throw new AppError(409, "Driver not active");

    //Driver license is not expired
    if (driver.licenseExpiry < new Date())
      throw new AppError(409, "Driver license is expired");

    //Driver must not already be on active trip
    const driverOnTrip = await prisma.driver.findFirst({
      where: { id: input.driverId, status: TripStatus.ACTIVE },
    });
    if (driverOnTrip)
      throw new AppError(409, "Driver is already in active trip");

    return await prisma.trip.create({ data: input });
  },

  async remove(id: string) {
    const trip = await this.getById(id);

    if (trip.status === TripStatus.ACTIVE)
      throw new AppError(409, "Cannot delete an active trip");

    return await prisma.trip.delete({ where: { id } });
  },
};
