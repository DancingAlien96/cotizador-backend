/*
  Warnings:

  - The primary key for the `Counter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tipo` on the `Counter` table. All the data in the column will be lost.
  - Added the required column `clave` to the `Counter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Counter" DROP CONSTRAINT "Counter_pkey",
DROP COLUMN "tipo",
ADD COLUMN     "clave" TEXT NOT NULL,
ADD CONSTRAINT "Counter_pkey" PRIMARY KEY ("clave");
