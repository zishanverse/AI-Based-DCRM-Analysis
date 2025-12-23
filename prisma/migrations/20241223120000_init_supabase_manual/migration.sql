-- AlterTable
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Unknown Station';
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "location_lat" DOUBLE PRECISION;
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "location_lon" DOUBLE PRECISION;
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "stations" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'engineer';

-- CreateTable (If not exists)
CREATE TABLE IF NOT EXISTS "test_results" (
    "id" TEXT NOT NULL,
    "breakerId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testType" TEXT NOT NULL DEFAULT 'DCRM',
    "operator" TEXT,
    "notes" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "referenceFileName" TEXT,
    "referenceFileUrl" TEXT,
    "testData" JSONB NOT NULL,
    "travelT1Max" DOUBLE PRECISION,
    "velocityT1Max" DOUBLE PRECISION,
    "resistanceCH1Avg" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "componentHealth" JSONB,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- Add ForeignKey (example, if missing)
-- ALTER TABLE "test_results" ADD CONSTRAINT "test_results_breakerId_fkey" FOREIGN KEY ("breakerId") REFERENCES "breakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
