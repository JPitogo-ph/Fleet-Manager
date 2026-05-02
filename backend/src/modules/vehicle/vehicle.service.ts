import { prisma } from "../../lib/prisma.js";
import { VehicleStatus } from "../../../generated/prisma/enums.js";
import { AppError } from "../../types/error.types.js";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "./vehicle.types.js";
import { stripUndefinedKeys } from "../../utils/stripUndefinedKeys.js";

//Service is just object of functions, absolutely blows my mind but makes sense as express does not have DI.
export const vehicleService = {
  async getAll(status?: VehicleStatus) {
    return prisma.vehicle.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new AppError(404, "Vehicle not found");

    return vehicle;
  },

  async create(input: CreateVehicleInput) {
    return prisma.vehicle.create({ data: input });
  },

  async update(id: string, input: UpdateVehicleInput) {
    await this.getById(id);
    const updateInput = stripUndefinedKeys(input);

    return prisma.vehicle.update({ where: { id }, data: updateInput });
  },

  async remove(id: string) {
    await this.getById(id);

    const tripCount = await prisma.trip.count({
      where: { vehicleId: id },
    });

    if (tripCount > 0)
      throw new AppError(409, "Vehicle has trip history and cannot be deleted");

    return prisma.vehicle.delete({ where: { id } });
  },
};
