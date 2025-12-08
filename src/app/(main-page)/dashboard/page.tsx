import { getStations } from "./actions";
import { DashboardClient } from "./DashboardClient";

export default async function Page() {
  const stations = await getStations();

  return <DashboardClient initialStations={stations} />;
}
