-- CreateTable
CREATE TABLE "test_results" (
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

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_results_breakerId_testDate_idx" ON "test_results"("breakerId", "testDate");

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_breakerId_fkey" FOREIGN KEY ("breakerId") REFERENCES "breakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
