"use server";

import { db } from "@/lib/db";

export async function getStations() {
  try {
    console.log("Fetching stations...");
    const stations = await db.station.findMany({
      orderBy: { name: "asc" },
    });
    console.log(`Fetched ${stations.length} stations`);
    if (stations.length === 0) {
      console.log("No stations found. Using fallback.");
      return {
        success: true,
        data: [
          { id: "STN-1234", name: "Demo Substation 400kV (Fallback)", status: "Active", description: "Fallback Station", createdAt: new Date(), updatedAt: new Date(), fileUrl: "", fileName: "" }
        ]
      };
    }
    return { success: true, data: stations };
  } catch (error) {
    console.error("Error fetching stations:", error);
    // Return fallback on error too
    return {
      success: true,
      data: [
        { id: "STN-1234", name: "Demo Substation 400kV (Fallback)", status: "Active", description: "Fallback Station", createdAt: new Date(), updatedAt: new Date(), fileUrl: "", fileName: "" }
      ]
    };
  }
}

export async function getBreakers(stationId: string) {
  try {
    console.log(`Fetching breakers for station: ${stationId}`);
    const breakers = await db.breaker.findMany({
      where: { stationId },
      include: { dataSource: true },
      orderBy: { name: "asc" },
    });
    console.log(`Fetched ${breakers.length} breakers`);

    if (breakers.length === 0) {
      console.log("No breakers found. Using fallback.");
      return {
        success: true,
        data: [
          {
            id: "brk-fallback-01",
            name: "Fallback Breaker 01",
            type: "SF6 Circuit Breaker",
            manufacturer: "Siemens",
            model: "3AP1 FG",
            voltage: 400,
            current: 3150,
            status: "Healthy",
            installationDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            stationId: stationId,
            dataSourceId: "ds-fallback-01",
            dataSource: {
              id: "ds-fallback-01",
              fileName: "402-B, 05-11-2019.csv",
              fileUrl: "https://res.cloudinary.com/deepcnbrz/raw/upload/v1765253904/dcrm/csv/402-B%2C%2005-11-2019-66845e4d.csv",
              fileType: "TEST",
              status: "READY",
              description: "Demo Data",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ]
      };
    }

    return { success: true, data: breakers };
  } catch (error) {
    console.error("Error fetching breakers:", error);
    return {
      success: true,
      data: [
        {
          id: "brk-fallback-01",
          name: "Fallback Breaker 01",
          type: "SF6 Circuit Breaker",
          manufacturer: "Siemens",
          model: "3AP1 FG",
          voltage: 400,
          current: 3150,
          status: "Healthy",
          installationDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          stationId: stationId,
          dataSourceId: "ds-fallback-01",
          dataSource: {
            id: "ds-fallback-01",
            fileName: "402-B, 05-11-2019.csv",
            fileUrl: "https://res.cloudinary.com/deepcnbrz/raw/upload/v1765253904/dcrm/csv/402-B%2C%2005-11-2019-66845e4d.csv",
            fileType: "TEST",
            status: "READY",
            description: "Demo Data",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ]
    };
  }
}

export async function getAllBreakers() {
  try {
    const breakers = await db.breaker.findMany({
      include: { dataSource: true, station: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data: breakers };
  } catch (error) {
    console.error("Error fetching breakers:", error);
    return { success: false, error: "Failed to fetch breakers" };
  }
}
