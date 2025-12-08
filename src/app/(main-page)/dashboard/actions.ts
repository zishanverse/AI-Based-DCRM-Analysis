"use server";

import { db } from "@/lib/db";

export type StationStats = {
  critical: number;
  learning: number; // Mapping "Warning" or intermediate state to "Learning" or "Pending" if appropriate, or just "Warning"
  healthy: number;
  total: number;
};

export async function getStations() {
  try {
    const stations = await db.station.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return stations;
  } catch (error) {
    console.error("Error fetching stations:", error);
    return [];
  }
}

export async function getStationStats(
  stationId: string
): Promise<StationStats> {
  try {
    // defaults
    let critical = 0;
    let learning = 0; // Using "Learning" or "Warning" bucket
    let healthy = 0;

    const breakers = await db.breaker.findMany({
      where: {
        stationId: stationId,
      },
      select: {
        status: true,
      },
    });

    breakers.forEach((b) => {
      const status = b.status?.toLowerCase() || "";
      if (
        status.includes("critical") ||
        status.includes("failure") ||
        status.includes("bad")
      ) {
        critical++;
      } else if (
        status.includes("warning") ||
        status.includes("pending") ||
        status.includes("maintenance")
      ) {
        learning++;
      } else if (
        status.includes("healthy") ||
        status.includes("good") ||
        status.includes("active") ||
        status.includes("optimal")
      ) {
        healthy++;
      } else {
        // Default to learning/warning if unknown, or maybe healthy? Let's assume unknown is 'pending' -> learning
        learning++;
      }
    });

    return {
      critical,
      learning,
      healthy,
      total: breakers.length,
    };
  } catch (error) {
    console.error("Error fetching station stats:", error);
    return { critical: 0, learning: 0, healthy: 0, total: 0 };
  }
}
