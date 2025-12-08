"use server";

import { db } from "@/lib/db";

export async function getStations() {
  try {
    const stations = await db.station.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: stations };
  } catch (error) {
    console.error("Error fetching stations:", error);
    return { success: false, error: "Failed to fetch stations" };
  }
}

export async function getBreakers(stationId: string) {
  try {
    const breakers = await db.breaker.findMany({
      where: { stationId },
      orderBy: { name: "asc" },
    });
    return { success: true, data: breakers };
  } catch (error) {
    console.error("Error fetching breakers:", error);
    return { success: false, error: "Failed to fetch breakers" };
  }
}
