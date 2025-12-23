-- DCRM DATABASE INITIALIZATION SCRIPT
-- This script contains the full table definitions matching the Prisma schema.

-- 1. STATIONS TABLE
CREATE TABLE IF NOT EXISTS "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Unknown Station',
    "location" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lon" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT DEFAULT '$2b$12$cq1...',
    "role" TEXT NOT NULL DEFAULT 'engineer',

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- 2. DATA SOURCES TABLE
CREATE TABLE IF NOT EXISTS "data_sources" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- Unique index on fileUrl
CREATE UNIQUE INDEX IF NOT EXISTS "data_sources_fileUrl_key" ON "data_sources"("fileUrl");


-- 3. BREAKERS TABLE
CREATE TABLE IF NOT EXISTS "breakers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "status" TEXT,
    "installationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stationId" TEXT NOT NULL,
    "dataSourceId" TEXT,

    CONSTRAINT "breakers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "breakers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "breakers_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. BREAKER COMPONENTS TABLE
CREATE TABLE IF NOT EXISTS "breaker_components" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "partNumber" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "breakerId" TEXT NOT NULL,

    CONSTRAINT "breaker_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "breaker_components_breakerId_fkey" FOREIGN KEY ("breakerId") REFERENCES "breakers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. TEST RESULTS TABLE
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

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_results_breakerId_fkey" FOREIGN KEY ("breakerId") REFERENCES "breakers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "test_results_breakerId_testDate_idx" ON "test_results"("breakerId", "testDate");
