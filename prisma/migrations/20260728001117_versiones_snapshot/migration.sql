/*
  Warnings:

  - You are about to drop the column `grupoId` on the `Cotizacion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Cotizacion_grupoId_idx";

-- AlterTable
ALTER TABLE "Cotizacion" DROP COLUMN "grupoId";

-- CreateTable
CREATE TABLE "VersionCotizacion" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nombre" TEXT,
    "autor" TEXT,
    "cliente" TEXT,
    "total" DOUBLE PRECISION,
    "fecha" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VersionCotizacion_cotizacionId_version_idx" ON "VersionCotizacion"("cotizacionId", "version");

-- AddForeignKey
ALTER TABLE "VersionCotizacion" ADD CONSTRAINT "VersionCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
