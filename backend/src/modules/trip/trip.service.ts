import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { TripStatus } from "../../../generated/prisma/enums.js";
import type {
  CreateTripInput,
  StartTripInput,
  CreateTripSchema,
  CancelTripInput,
  CompleteTripInput,
} from "./trip.types.js";
import { AppError } from "../../types/error.types.js";

export const tripService = {
  //Basic CRUD
  async getAll(filters: {
    status?: TripStatus;
    vehicleId?: string;
    driverId?: string;
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
    const driverOnTrip = await prisma.trip.findFirst({
      where: { driverId: input.driverId, status: TripStatus.ACTIVE },
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
  //Business Logic
  async start(id: string, input: StartTripInput) {
    const trip = await this.getById(id);

    if (trip.status !== TripStatus.SCHEDULED)
      throw new AppError(409, "Trip must be SCHEDULED in order to start");

    //Vehicle and Driver still active
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: trip.vehicleId },
    });
    if (!vehicle || vehicle.status === "ACTIVE")
      throw new AppError(409, "Vehicle is not active");

    const vehicleOnTrip = await prisma.trip.findFirst({
      where: { vehicleId: trip.vehicleId, status: TripStatus.ACTIVE },
    });
    if (vehicleOnTrip)
      throw new AppError(409, "Vehicle is already in active trip");

    const driver = await prisma.driver.findUnique({
      where: { id: trip.driverId },
    });
    if (!driver || driver.status !== "ACTIVE")
      throw new AppError(409, "Driver is not active");

    if (driver.licenseExpiry < new Date())
      throw new AppError(409, "Driver license is expired");

    const driverOnTrip = await prisma.driver.findFirst({
      where: { driverId: trip.driverId, status: TripStatus.ACTIVE },
    });
    if (driverOnTrip)
      throw new AppError(409, "Driver is already on active trip");

    if (input.odometerStartKm < vehicle.currentOdometerKm)
      throw new AppError(
        409,
        "odometerStartKm cannot be less than vehicle's current odometer value",
      );

    return await prisma.trip.update({
      where: { id },
      data: {
        odometerStartKm: input.odometerStartKm,
        startedAt: new Date(),
        status: TripStatus.ACTIVE,
      },
    });
  },

  async complete(id: string, input: CompleteTripInput) {
    const trip = await this.getById(id)

    if (trip.status !== TripStatus.ACTIVE) throw new AppError(409, 'Trip must be ACTIVE to complete')
    if (input.odometerEndKm < (trip.odometerStartKm ?? 0)) throw new AppError(409, "odometerEndKm cannot be less than odometerStartKm")
    
    const actualDistanceKm = input.odometerEndKm - (trip.odometerStartKm ?? 0)
    const actualDurationInMin = (Date.now() - (trip.startedAt?.getTime() ?? 0)) / 60000 //60k not 6000 its in milliseconds don't forget again

    return await prisma.$transaction([
      prisma.trip.update({
        where: {id},
        data: {
          odometerEndKm: input.odometerEndKm,
          actualDistanceKm,
          actualDurationInMin,
          endedAt: new Date(),
          status: TripStatus.COMPLETED
        }
      }),
      prisma.vehicle.update({
        where: {id: trip.vehicleId},
        data: {currentOdometerKm: input.odometerEndKm}
      })
    ])
  },
  
  async cancel(id: string, input: CancelTripInput) {
    const trip = await this.getById(id)

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) throw new AppError(409, "Trip is already CANCELLED or COMPLETED") 
    
    return await prisma.trip.update({
      where: {id},
      data: {
        status: TripStatus.CANCELLED,
        cancellationReason: input.cancellationReason ?? null
      }
    })
  }
};
