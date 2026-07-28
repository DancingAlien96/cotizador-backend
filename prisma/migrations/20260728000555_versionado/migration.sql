-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "grupoId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Cotizacion_grupoId_idx" ON "Cotizacion"("grupoId");

-- Backfill: cada cotización existente se vuelve el origen de su propio grupo.
UPDATE "Cotizacion" SET "grupoId" = "id" WHERE "grupoId" IS NULL;
