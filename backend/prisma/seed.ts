import {
  PrismaClient,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  TripStatus,
} from "../generated/prisma/client.js";
import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Vehicle, Driver } from "../generated/prisma/client.js";
import "dotenv/config"

console.log(process.env.DATABASE_URL)
// Prisma Client
const connectionString = `${[process.env.DATABASE_URL]}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Config
const SEED = 7;
faker.seed(SEED);

const NUM_VEHICLES = 15;
const NUM_DRIVERS = 20;
const HISTORY_DAYS = 180; //Half year

// Local cities because why not
const CITIES = [
  "Makati",
  "Taguig",
  "Pasig",
  "Quezon City",
  "Manila",
  "Bacolod",
  "Mandaluyong",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Marikina",
  "Caloocan",
  "Valenzuela",
  "Malabon",
  "Navotas",
  "Pasay",
  "Dumaguete",
];

const STREET_TYPES = ["St", "Ave", "Blvd", "Road", "Highway"];

const VEHICLE_MAKES_MODELS: Record<string, string[]> = {
  Toyota: ["Hilux", "Hi-Ace", "Land Cruiser"],
  Mitsubishi: ["L300", "Strada", "Fuso"],
  Isuzu: ["Crosswind", "D-Max", "Elf"],
  Ford: ["Ranger", "Transit"],
  Nissan: ["Navara", "Urvan"],
};

// Helper Functions - Random Address, Set days ago, Add minutes, Pick Make and Model
function randomAddress(): string {
  const num = faker.number.int({ min: 1, max: 999 });
  const street = faker.person.lastName();
  const streetType = faker.helpers.arrayElement(STREET_TYPES);
  const city = faker.helpers.arrayElement(CITIES);

  return `${num} ${street} ${streetType} ${city}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function pickMakeModel(): { make: string; model: string } {
  const make = faker.helpers.arrayElement(Object.keys(VEHICLE_MAKES_MODELS));
  const model = faker.helpers.arrayElement(VEHICLE_MAKES_MODELS[make]!); //May explode someday

  return { make, model };
}

// Seed Vehicles
async function seedVehicles() {
  const vehicles = [];

  const plateLetters = () => faker.string.alpha({ length: 3, casing: "upper" });
  const plateNumbers = () =>
    faker.number.int({ min: 100, max: 999 }).toString();

  const usedPlates = new Set<string>();

  for (let i = 0; i < NUM_VEHICLES; i++) {
    const { make, model } = pickMakeModel();

    let plate;
    do {
      plate = `${plateLetters()} ${plateNumbers()}`;
    } while (usedPlates.has(plate));

    usedPlates.add(plate);

    //12 ACTIVE, 2 INACTIVE, 1 will be ACTIVE for trip
    let status: VehicleStatus = VehicleStatus.ACTIVE;
    if (i === 13 || i === 14) status = VehicleStatus.INACTIVE;

    const type = faker.helpers.arrayElement([
      VehicleType.TRUCK,
      VehicleType.VAN,
      VehicleType.MOTORCYCLE,
    ]);

    //Vehicles are not brand new
    const baseOdometer = faker.number.float({
      min: 5000,
      max: 40000,
      fractionDigits: 1,
    });

    vehicles.push(
      await prisma.vehicle.create({
        data: {
          plateNumber: plate,
          make,
          model,
          year: faker.number.int({ min: 2018, max: 2025 }),
          type,
          status,
          currentOdometerKm: baseOdometer,
        },
      }),
    );
  }

  console.log(`Seeded ${vehicles.length} number of vehicles`);
  return vehicles
}

// Seed Drivers
async function seedDrivers() {
  const drivers = []
  const usedLicenses = new Set<string>()

  for (let i = 0; i < NUM_DRIVERS; i++) {
    let license
    do {
      license = `${faker.string.alpha({ length: 1, casing: "upper" })}${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10, max: 99 })}-
      ${faker.number.int({ min: 100000, max: 999999 })}`;
    } while (usedLicenses.has(license))
    usedLicenses.add(license)

    // 16 ACTIVE, 2 INACTIVE, 2 ACTIVE with expired license
    let status: DriverStatus = DriverStatus.ACTIVE
    let licenseExpiry;

    if (i === 18 || i === 19) {
      status = DriverStatus.INACTIVE
      licenseExpiry = faker.date.future({years: 2})
    } else if (i === 16 || i === 17) {
      //Set driver ACTIVE but expired license
      status = DriverStatus.ACTIVE
      licenseExpiry = faker.date.past({years: 1})
    } else {
      status = DriverStatus.ACTIVE
      licenseExpiry = faker.date.future({years: 3})
    }

    drivers.push(
      await prisma.driver.create({
        data: {
          name: faker.person.fullName(),
          licenseNumber: license,
          licenseExpiry,
          status
        }
      })
    )
  }

  console.log(`Seeded ${drivers.length} number of drivers`)
  return drivers
}

// Seed Trips
async function seedTrips(vehicles: Vehicle[], drivers: Driver[]){
  //Setup ACTIVE vehicles and drivers with valid license
  const activeVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE)
  const eligibleDrivers = drivers.filter((d) => d.status === DriverStatus.ACTIVE && d.licenseExpiry > new Date())

  //Track odometer per vehicle and increase consistently
  const odometerMap: Record<string, number> = {}
  for (const v of vehicles) {
    odometerMap[v.id] = v.currentOdometerKm
  }

  //Track vehicles/drivers on ACTIVE trip
  const busyVehicles = new Set<string>()
  const busyDrivers = new Set<string>()

  let tripCount = 0

  //Historical completed/cancelled trips over 6 months
  const vehicleWeights = activeVehicles.map((_, i) =>  i < 4 ? 4 : i < 8 ? 2 : 1 //First 4 vehicles get 4x trips, next 4 get 2x
  )

  const totalWeight = vehicleWeights.reduce((a, b) => a + b, 0)

  const TARGET_HISTORICAL = 250

  for (let i = 0; i < TARGET_HISTORICAL; i++) {
    //Pick vehicle by weight
    const roll = faker.number.float({min: 0, max: totalWeight})
    let cumulative = 0
    let vehicleIndex = 0
    for (let j = 0; j < vehicleWeights.length; j++) {
      cumulative += vehicleWeights[j]!
      if (roll <= cumulative) {vehicleIndex = j; break}
    }
    const vehicle = activeVehicles[vehicleIndex]!
    const driver = faker.helpers.arrayElement(eligibleDrivers)

    //Spread scheduledAt field across 6 months
    const daysBack = faker.number.int({ min: 2, max: HISTORY_DAYS });
    const scheduledAt = daysAgo(daysBack);
    scheduledAt.setHours(
      faker.number.int({ min: 6, max: 18 }),
      faker.number.int({ min: 0, max: 59 }),
      0, 0
    );
 
    // ~85% completed, ~15% cancelled
    const isCancelled = faker.number.float() < 0.15;
 
    // Trip distances: short (5-30km), medium (30-100km), long (100-300km)
    const distanceType = faker.number.float();
    let plannedDistanceKm: number;
    if (distanceType < 0.5) plannedDistanceKm = faker.number.float({ min: 5, max: 30, fractionDigits: 1 });
    else if (distanceType < 0.85) plannedDistanceKm = faker.number.float({ min: 30, max: 100, fractionDigits: 1 });
    else plannedDistanceKm = faker.number.float({ min: 100, max: 300, fractionDigits: 1 });
 
    // ~35 km/h average speed for realistic duration
    const plannedDurationMin = Math.round((plannedDistanceKm / 35) * 60);
 
    if (isCancelled) {
      const cancelledAfterStart = faker.number.float() < 0.3; // 30% of cancels were already started
 
      if (cancelledAfterStart) {
        const startedAt = addMinutes(scheduledAt, faker.number.int({ min: 5, max: 30 }));
        const odomStart = odometerMap[vehicle.id];
        const partialKm = faker.number.float({ min: 1, max: plannedDistanceKm * 0.4, fractionDigits: 1 });
        odometerMap[vehicle.id] = odomStart! + partialKm;
 
        await prisma.trip.create({
          data: {
            vehicleId: vehicle.id,
            driverId: driver.id,
            originAddress: randomAddress(),
            destinationAddress: randomAddress(),
            plannedDistanceKm,
            plannedDurationMin,
            scheduledAt,
            startedAt,
            odometerStartKm: odomStart!,
            status: TripStatus.CANCELLED,
            cancellationReason: faker.helpers.arrayElement([
              "Vehicle breakdown",
              "Driver unavailable",
              "Client request",
              "Road closure",
              "Weather conditions",
            ]),
            notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          },
        });
      } else {
        await prisma.trip.create({
          data: {
            vehicleId: vehicle.id,
            driverId: driver.id,
            originAddress: randomAddress(),
            destinationAddress: randomAddress(),
            plannedDistanceKm,
            plannedDurationMin,
            scheduledAt,
            status: TripStatus.CANCELLED,
            cancellationReason: faker.helpers.arrayElement([
              "Vehicle breakdown",
              "Driver unavailable",
              "Client request",
              "Road closure",
              "Weather conditions",
            ]),
            notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          },
        });
      }
    } else {
      // Completed trip
      const startedAt = addMinutes(scheduledAt, faker.number.int({ min: 0, max: 20 }));
 
      // Actual slightly varies from planned (traffic, stops, etc.)
      const actualDistanceKm = faker.number.float({
        min: plannedDistanceKm * 0.9,
        max: plannedDistanceKm * 1.15,
        fractionDigits: 1,
      });
      const actualDurationMin = faker.number.float({
        min: plannedDurationMin * 0.85,
        max: plannedDurationMin * 1.4,
        fractionDigits: 1,
      });
      const endedAt = addMinutes(startedAt, actualDurationMin);
 
      const odomStart = odometerMap[vehicle.id];
      const odomEnd = odomStart! + actualDistanceKm;
      odometerMap[vehicle.id] = odomEnd;
 
      await prisma.trip.create({
        data: {
          vehicleId: vehicle.id,
          driverId: driver.id,
          originAddress: randomAddress(),
          destinationAddress: randomAddress(),
          plannedDistanceKm,
          plannedDurationMin,
          scheduledAt,
          startedAt,
          endedAt,
          odometerStartKm: odomStart!,
          odometerEndKm: odomEnd,
          actualDistanceKm,
          actualDurationMin,
          status: TripStatus.COMPLETED,
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        },
      });
    }
 
    tripCount++;
  }
 
  // ── Update vehicle odometers to match trip history ───────────────────────
  for (const vehicle of activeVehicles) {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { currentOdometerKm: odometerMap[vehicle.id]! },
    });
  }
 
  // ── 2 ACTIVE trips (in progress right now) ───────────────────────────────
  for (let i = 0; i < 2; i++) {
    const vehicle = activeVehicles.find((v) => !busyVehicles.has(v.id))!;
    const driver = eligibleDrivers.find((d) => !busyDrivers.has(d.id))!;
    busyVehicles.add(vehicle.id);
    busyDrivers.add(driver.id);
 
    const scheduledAt = daysAgo(0);
    scheduledAt.setHours(scheduledAt.getHours() - 2);
    const startedAt = addMinutes(scheduledAt, faker.number.int({ min: 5, max: 20 }));
 
    const plannedDistanceKm = faker.number.float({ min: 20, max: 80, fractionDigits: 1 });
    const plannedDurationMin = Math.round((plannedDistanceKm / 35) * 60);
    const odomStart = odometerMap[vehicle.id];
 
    await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        originAddress: randomAddress(),
        destinationAddress: randomAddress(),
        plannedDistanceKm,
        plannedDurationMin,
        scheduledAt,
        startedAt,
        odometerStartKm: odomStart!,
        status: TripStatus.ACTIVE,
        notes: null,
      },
    });
    tripCount++;
  }
 
  // ── 5 SCHEDULED trips (upcoming) ────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
 
  for (let i = 0; i < 5; i++) {
    const vehicle = activeVehicles.find((v) => !busyVehicles.has(v.id))!;
    const driver = eligibleDrivers.find((d) => !busyDrivers.has(d.id))!;
    busyVehicles.add(vehicle.id);
    busyDrivers.add(driver.id);
 
    const scheduledAt = new Date(tomorrow);
    scheduledAt.setHours(
      faker.number.int({ min: 7, max: 17 }),
      faker.number.int({ min: 0, max: 59 }),
      0, 0
    );
    scheduledAt.setDate(scheduledAt.getDate() + faker.number.int({ min: 0, max: 6 }));
 
    const plannedDistanceKm = faker.number.float({ min: 10, max: 150, fractionDigits: 1 });
    const plannedDurationMin = Math.round((plannedDistanceKm / 35) * 60);
 
    await prisma.trip.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        originAddress: randomAddress(),
        destinationAddress: randomAddress(),
        plannedDistanceKm,
        plannedDurationMin,
        scheduledAt,
        status: TripStatus.SCHEDULED,
        notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      },
    });
    tripCount++;
  }
 
  console.log(`✅ Seeded ${tripCount} trips (${TARGET_HISTORICAL} historical, 2 active, 5 scheduled)`);
}
 
// ─── Main ────────────────────────────────────────────────────────────────────
 
async function main() {
  console.log("🌱 Seeding database...\n");
 
  // Clean slate
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  console.log("🗑️  Cleared existing data\n");
 
  const vehicles = await seedVehicles();
  const drivers = await seedDrivers();
  await seedTrips(vehicles, drivers);
 
  console.log("\n🎉 Done!");
}
 
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
