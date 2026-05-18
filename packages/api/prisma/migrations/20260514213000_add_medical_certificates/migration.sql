-- CreateEnum
CREATE TYPE "MedicalCertificateStatus" AS ENUM ('Active', 'Inactive');

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "status" "MedicalCertificateStatus" NOT NULL DEFAULT 'Active',
    "invalidated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "medical_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_certificates_member_id_idx" ON "medical_certificates"("member_id");

-- AddForeignKey
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;