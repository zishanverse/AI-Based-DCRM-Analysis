-- Database Initialization and Seeding Script
-- Generated from reset_db_and_seed.py

-- 1. Drop Legacy Tables
DROP TABLE IF EXISTS "test_results" CASCADE;
DROP TABLE IF EXISTS "breaker_components" CASCADE;
DROP TABLE IF EXISTS "breakers" CASCADE;
DROP TABLE IF EXISTS "data_sources" CASCADE;
DROP TABLE IF EXISTS "stations" CASCADE;

-- 2. Create Tables

-- Stations
CREATE TABLE "stations" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Unknown Station',
    "location" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lon" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" TEXT, -- Dynamic: No default, must be set on creation
    "role" TEXT NOT NULL DEFAULT 'engineer'
);

-- Data Sources
CREATE TABLE "data_sources" (
    "id" TEXT PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Breakers
CREATE TABLE "breakers" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "status" TEXT,
    "installationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stationId" TEXT NOT NULL REFERENCES "stations"("id") ON DELETE CASCADE,
    "dataSourceId" TEXT REFERENCES "data_sources"("id")
);

-- Test Results
CREATE TABLE "test_results" (
    "id" TEXT PRIMARY KEY,
    "breakerId" TEXT NOT NULL REFERENCES "breakers"("id") ON DELETE CASCADE,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testType" TEXT NOT NULL DEFAULT 'DCRM',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "referenceFileName" TEXT,
    "referenceFileUrl" TEXT,
    "testData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "componentHealth" JSONB,
    "travelT1Max" DOUBLE PRECISION,
    "velocityT1Max" DOUBLE PRECISION,
    "resistanceCH1Avg" DOUBLE PRECISION,
    "operator" TEXT,
    "notes" TEXT
);

-- 3. Seed Data

-- Station
INSERT INTO "stations" ("id", "name", "location", "role", "password", "createdAt", "updatedAt")
VALUES ('STD-1234', 'Demo Substation 400kV', 'New Delhi', 'engineer', '$2b$12$9s0xTd2M1vMOMNTxBTUhA00nFW.IfUP6', NOW(), NOW());

-- Data Sources
INSERT INTO "data_sources" ("id", "fileName", "fileUrl", "description", "status", "createdAt", "updatedAt")
VALUES ('ds-sample-01', 'sample_dcrm.csv', 'https://res.cloudinary.com/demo/image/upload/sample.csv', 'Sample DCRM Data', 'PROCESSED', NOW(), NOW());

-- Breakers
INSERT INTO "breakers" ("id", "name", "type", "manufacturer", "voltage", "current", "status", "stationId", "dataSourceId", "createdAt", "updatedAt")
VALUES ('brk-001', 'BRK-Main-01', 'SF6 Circuit Breaker', 'Siemens', 400.0, 2000.0, 'Healthy', 'STD-1234', 'ds-sample-01', NOW(), NOW());

-- Test Results (Sample JSON content simplified for SQL readability)
INSERT INTO "test_results" ("id", "breakerId", "testDate", "testType", "fileName", "testData", "componentHealth", "createdAt", "updatedAt")
VALUES ('tr-001', 'brk-001', NOW(), 'DCRM', 'test_run_1.csv', '{"travel": [1, 2, 3], "current": [10, 20, 30]}', '{"status": "Healthy", "score": 98}', NOW(), NOW());
