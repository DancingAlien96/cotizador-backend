-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'EN_CURSO', 'CONFIRMADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "estadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "motivoRechazo" TEXT;

-- CreateIndex
CREATE INDEX "Cotizacion_estado_updatedAt_idx" ON "Cotizacion"("estado", "updatedAt");
