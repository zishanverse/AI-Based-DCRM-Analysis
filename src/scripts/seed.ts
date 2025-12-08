import { db } from "@/lib/db";

async function main() {
  console.log("Start seeding...");

  // Clean the database
  await db.breakerComponent.deleteMany();
  await db.breaker.deleteMany();
  await db.station.deleteMany();
  await db.dataSource.deleteMany();
  console.log("🧹 Database cleaned");

  // 1. Create a DataSource entry.
  // This record represents the CSV file itself.
  const csvDataSource = await db.dataSource.create({
    data: {
      fileName: "initial_breaker_data.csv",
      fileUrl:
        "https://ik.imagekit.io/hckvycynl/109000055719_20241016172337.csv", // IMPORTANT: Replace with your actual file URL
      description: "Initial data load for circuit breakers and components",
    },
  });

  console.log(`✅ Created data source with id: ${csvDataSource.id}`);

  // 2. Create a Station.
  // A station is a physical location where breakers are installed.
  const station = await db.station.create({
    data: {
      name: "Central Power Station",
      location: "Industrial District, Block A",
      description: "Main power distribution station for the industrial zone",
    },
  });

  console.log(`✅ Created station with id: ${station.id}`);

  // 3. Create Breakers and link them to both the Station and the DataSource.
  const oilBreaker = await db.breaker.create({
    data: {
      name: "Oil Circuit Breaker 1",
      type: "Oil Circuit Breaker",
      manufacturer: "Siemens",
      model: "OCB-2000",
      voltage: 33.0,
      current: 1250.0,
      status: "Active",
      installationDate: new Date("2020-05-15"),
      stationId: station.id,
      dataSourceId: csvDataSource.id,
    },
  });

  const vacuumBreaker = await db.breaker.create({
    data: {
      name: "Vacuum Circuit Breaker 1",
      type: "Vacuum Circuit Breaker",
      manufacturer: "ABB",
      model: "VCB-12",
      voltage: 11.0,
      current: 630.0,
      status: "Active",
      installationDate: new Date("2021-08-22"),
      stationId: station.id,
      dataSourceId: csvDataSource.id,
    },
  });

  // --- NEW: Create an SF6 Circuit Breaker ---
  const sf6Breaker = await db.breaker.create({
    data: {
      name: "SF6 Circuit Breaker 1",
      type: "SF6 Circuit Breaker",
      manufacturer: "Schneider Electric",
      model: "SF6-220",
      voltage: 220.0,
      current: 2000.0,
      status: "Active",
      installationDate: new Date("2019-11-10"),
      stationId: station.id,
      dataSourceId: csvDataSource.id,
    },
  });

  console.log(`✅ Created 3 breakers (Oil, Vacuum, and SF6).`);

  // 4. Create Components for each Breaker.

  // Components for the Oil Circuit Breaker
  await db.breakerComponent.createMany({
    data: [
      {
        name: "Main Contact",
        type: "Contact",
        description: "Primary electrical contact for current interruption",
        partNumber: "OCB-MC-001",
        status: "Good",
        breakerId: oilBreaker.id,
      },
      {
        name: "Trip Coil",
        type: "Coil",
        description: "Electromagnetic coil that triggers breaker opening",
        partNumber: "OCB-TC-001",
        status: "Good",
        breakerId: oilBreaker.id,
      },
    ],
  });

  // --- NEW: Components for the Vacuum Circuit Breaker ---
  await db.breakerComponent.createMany({
    data: [
      {
        name: "Vacuum Interrupter",
        type: "Interrupter",
        description: "Sealed vacuum chamber for arc extinction",
        partNumber: "VCB-VI-001",
        status: "Good",
        breakerId: vacuumBreaker.id,
      },
      {
        name: "Operating Mechanism",
        type: "Mechanism",
        description: "Spring-charged mechanism for breaker operation",
        partNumber: "VCB-OM-001",
        status: "Good",
        breakerId: vacuumBreaker.id,
      },
    ],
  });

  // --- NEW: Components for the SF6 Circuit Breaker ---
  await db.breakerComponent.createMany({
    data: [
      {
        name: "SF6 Interrupter",
        type: "Interrupter",
        description: "SF6 gas-filled chamber for arc extinction",
        partNumber: "SF6-I-001",
        status: "Good",
        breakerId: sf6Breaker.id,
      },
      {
        name: "Gas Pressure Monitor",
        type: "Monitor",
        description: "Monitors SF6 gas pressure and density",
        partNumber: "SF6-GPM-001",
        status: "Good",
        breakerId: sf6Breaker.id,
      },
      {
        name: "Compressor Unit",
        type: "Compressor",
        description: "Compresses SF6 gas for operation",
        partNumber: "SF6-CU-001",
        status: "Needs Maintenance",
        breakerId: sf6Breaker.id,
      },
    ],
  });

  console.log(`✅ Created components for all breakers.`);
  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("SEEDING ERROR:", JSON.stringify(e, null, 2));
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect from the database to ensure the process exits cleanly
    await db.$disconnect();
  });
