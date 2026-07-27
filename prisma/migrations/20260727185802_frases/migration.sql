-- CreateTable
CREATE TABLE "Frase" (
    "id" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Frase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Frase_campo_usos_idx" ON "Frase"("campo", "usos");

-- CreateIndex
CREATE UNIQUE INDEX "Frase_campo_texto_key" ON "Frase"("campo", "texto");
