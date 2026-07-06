-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "cliente" TEXT,
ADD COLUMN     "fecha" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Cotizacion_updatedAt_idx" ON "Cotizacion"("updatedAt");
