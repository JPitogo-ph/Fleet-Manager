import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { TripStatus } from "../../../generated/prisma/enums.js";
import type { CreateTripInput } from "./trip.types.js";
import { AppError } from "../../types/error.types.js";

export const TripService = {

    async getAll(filters: {status?: TripStatus, vehicleId?: string, driverId: string}) {
        const where: Prisma.TripWhereInput = {}

        //Online examples prefer inline && spreading, I think this is cleaner.
        if (filters.status) where.status = filters.status
        if (filters.vehicleId) where.vehicleId = filters.vehicleId
        if (filters.driverId) where.driverId = filters.driverId

        return await prisma.trip.findMany({where: where})
    }
}