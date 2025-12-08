import { db } from "@/lib/db";

const STATIONS_DATA = [
  {
    name: "Northern Grid Substation",
    location: "Delhi, India",
    desc: "Key node for Northern Region transmission.",
  },
  {
    name: "Southern Grid Substation",
    location: "Bangalore, India",
    desc: "Primary distribution hub for Southern Region.",
  },
  {
    name: "Western Grid Substation",
    location: "Mumbai, India",
    desc: "Critical infrastructure for Western Industrial corridor.",
  },
  {
    name: "Eastern Grid Substation",
    location: "Kolkata, India",
    desc: "Gateway for Eastern Region power flow.",
  },
];

const BREAKER_TYPES = [
  "SF6 Circuit Breaker",
  "Vacuum Circuit Breaker",
  "Oil Circuit Breaker",
  "Air Blast Circuit Breaker",
];
const MANUFACTURERS = [
  "Siemens",
  "ABB",
  "Schneider Electric",
  "BHEL",
  "GE Grid Solutions",
];
const STATUSES = [
  "Active",
  "Healthy",
  "Good",
  "Optimal",
  "Warning",
  "Needs Maintenance",
  "Pending Inspection",
  "Critical",
  "Failure",
  "Bad",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomStatus(): string {
  const rand = Math.random();
  if (rand < 0.15) return "Critical (Failure)"; // 15% Critical
  if (rand < 0.45) return "Warning (Needs Maintenance)"; // 30% Warning
  return "Healthy (Active)"; // 55% Healthy
}

async function main() {
  console.log("🚀 Start seeding (APPEND MODE)...");

  // 1. Get or Create DataSource (re-use if exists to avoid clutter)
  let dataSource = await db.dataSource.findFirst({
    where: { fileName: "generated_bulk_data.csv" },
  });

  if (!dataSource) {
    dataSource = await db.dataSource.create({
      data: {
        fileName: "generated_bulk_data.csv",
        fileUrl: "https://example.com/bulk_data.csv",
        description: "Bulk generated data for stress testing",
      },
    });
    console.log(`✅ Created new Data Source: ${dataSource.id}`);
  } else {
    console.log(`ℹ️ Using existing Data Source: ${dataSource.id}`);
  }

  // 2. Create Stations and Breakers
  for (const stationInfo of STATIONS_DATA) {
    // Check if station exists to avoid duplicates if run multiple times,
    // or just create new ones slightly differently if user really wants "more" data.
    // User said "add in the new data", so let's check by name, if exists, append breakers to it.
    let station = await db.station.findFirst({
      where: { name: stationInfo.name },
    });

    if (!station) {
      station = await db.station.create({
        data: {
          name: stationInfo.name,
          location: stationInfo.location,
          description: stationInfo.desc,
        },
      });
      console.log(`✅ Created Station: ${station.name}`);
    } else {
      console.log(`ℹ️ Appending to Station: ${station.name}`);
    }

    // Generate 30 breakers per station
    const breakersPayload = [];
    for (let i = 0; i < 30; i++) {
      const type = getRandomItem(BREAKER_TYPES);
      const maker = getRandomItem(MANUFACTURERS);
      const status = getRandomStatus();

      breakersPayload.push({
        name: `${type} - ${station.name.substring(0, 3)}-${1000 + i}`,
        type: type,
        manufacturer: maker,
        model: `Gen-X-${Math.floor(Math.random() * 100)}`,
        voltage: Math.floor(Math.random() * 400) + 11, // 11kV to 400kV
        current: Math.floor(Math.random() * 2000) + 600, // 600A to 2600A
        status: status,
        installationDate: new Date(2015 + Math.floor(Math.random() * 9), 0, 1),
        stationId: station.id,
        dataSourceId: dataSource!.id,
      });
    }

    // Prisma createMany does not return created IDs easily for relations in all drivers,
    // but creates are fast. For components, we strictly need IDs.
    // So we loop create unless we use a nested write or separate query.
    // Loop create is safer for relations here.

    console.log(`   Detailed seeding for ${station.name}...`);
    for (const bData of breakersPayload) {
      await db.breaker.create({
        data: {
          ...bData,
          components: {
            create: [
              {
                name: "Main Contact",
                type: "Contact",
                status: bData.status.includes("Critical") ? "Worn" : "Good",
              },
              {
                name: "Operating Mechanism",
                type: "Mechanism",
                status: "Good",
              },
              {
                name: "Control Circuit",
                type: "Circuit",
                status: bData.status.includes("Warning")
                  ? "Check Required"
                  : "Good",
              },
            ],
          },
        },
      });
    }
  }

  console.log("🎉 Bulk data appended successfully!");
}

main()
  .catch((e) => {
    console.error("SEEDING ERROR:", JSON.stringify(e, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
