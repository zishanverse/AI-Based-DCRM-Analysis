import { Pool } from "pg";
import "dotenv/config";
import dns from "dns";

const urlString = process.env.DATABASE_URL;
if (!urlString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

try {
  const parsed = new URL(urlString);
  console.log("Hostname:", parsed.hostname);
  console.log("Port:", parsed.port);

  dns.lookup(parsed.hostname, (err, address, family) => {
    if (err) console.error("DNS Lookup Error:", err);
    else console.log("DNS Lookup Success:", address, "Family:", family);
  });

  const pool = new Pool({
    connectionString: urlString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  pool
    .query("SELECT NOW()")
    .then((res) => {
      console.log("✅ Connection SUCCESS:", res.rows[0]);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Connection FAILED code:", err.code);
      console.error("❌ Connection FAILED message:", err.message);
      process.exit(1);
    });
} catch (e) {
  console.error("URL Parsing Error:", e);
}
