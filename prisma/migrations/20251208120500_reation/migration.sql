-- AlterTable
ALTER TABLE "breakers" ADD COLUMN     "dataSourceId" TEXT;

-- AddForeignKey
ALTER TABLE "breakers" ADD CONSTRAINT "breakers_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
