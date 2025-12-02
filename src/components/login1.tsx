/* eslint-disable @next/next/no-img-element */
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api-client";

interface Login1Props {
  heading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  buttonText?: string;
  onSubmit?: (credentials: { stationId: string; password: string }) => void;
}

const STATION_ID_REGEX = /^STN-\d{4}$/;
const SCHEMA_HINT_ID = "station-schema-hint";

const Login1 = ({
  heading = "Station Login",
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg",
    alt: "logo",
    title: "DCRM - Portal",
  },
  buttonText = "Access Dashboard",
  onSubmit,
}: Login1Props) => {
  const [stationId, setStationId] = useState("STN-");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedStationId = stationId.trim().toUpperCase();
    if (!STATION_ID_REGEX.test(normalizedStationId)) {
      setError("Station ID must match the STN-0001 format defined in the stations schema.");
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        onSubmit({ stationId: normalizedStationId, password });
        return;
      }

      await login(normalizedStationId, password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-muted min-h-screen">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          <a href={logo.url}>
            <img src={logo.src} alt={logo.alt} title={logo.title} className="h-10 dark:invert" />
          </a>
          <form
            onSubmit={handleSubmit}
            className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md"
          >
            {heading && <h1 className="text-xl font-semibold">{heading}</h1>}
            <Input
              type="text"
              inputMode="text"
              autoComplete="username"
              placeholder="Station ID (e.g. STN-0001)"
              className="text-sm uppercase"
              required
              value={stationId}
              pattern="STN-[0-9]{4}"
              title="Expected format: STN-0001"
              aria-describedby={SCHEMA_HINT_ID}
              onChange={(e) => setStationId(e.target.value.toUpperCase())}
            />
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Station password"
              className="text-sm"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div id={SCHEMA_HINT_ID} className="w-full text-left text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Supabase stations schema</p>
              <p>
                <span className="font-semibold">station_id</span> · text · Matches the primary key stored in Supabase
                (format STN-0001).
              </p>
              <p>
                <span className="font-semibold">password_hash</span> · bcrypt · Enter the plain password that maps to the
                stored hash.
              </p>
            </div>
            {error && <p className="text-sm text-red-500 w-full text-left">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : buttonText}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export { Login1 };