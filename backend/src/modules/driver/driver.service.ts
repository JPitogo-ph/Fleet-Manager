import { prisma } from "../../lib/prisma.js";
import type { CreateDriverInput, UpdateDriverInput } from "./driver.types.js";
import { DriverStatus } from "../../../generated/prisma/enums.js";
import { AppError } from "../../types/error.types.js";
import { stripUndefinedKeys } from "../../utils/stripUndefinedKeys.js";

export const driverService = {
  async getAll(status?: DriverStatus) {
    return await prisma.driver.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new AppError(404, "Driver not found");

    return driver;
  },

  async create(input: CreateDriverInput) {
    return await prisma.driver.create({ data: input });
  },

  async update(id: string, input: UpdateDriverInput) {
    if (Object.keys(input).length === 0)
      throw new AppError(404, "Request body cannot be empty");
    await this.getById(id);
    const updateInput = stripUndefinedKeys(input);

    return await prisma.driver.update({ where: { id }, data: updateInput });
  },

  async remove(id: string) {
    await this.getById(id);

    const tripCount = await prisma.trip.count({
      where: { driverId: id },
    });
    if (tripCount > 0)
      throw new AppError(409, "Driver has trip history and cannot be deleted.");

    return await prisma.driver.delete({ where: { id } });
  },
};
