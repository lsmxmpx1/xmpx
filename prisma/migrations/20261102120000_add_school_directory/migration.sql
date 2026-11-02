-- CreateTable
CREATE TABLE "SchoolDirectory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "authority" TEXT,
    "educationalContent" TEXT,
    "licenseNo" TEXT,
    "organizer" TEXT,
    "address" TEXT,
    "legalPerson" TEXT,
    "contact" TEXT,
    "lng" REAL,
    "lat" REAL,
    "district" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SchoolDirectory_status_idx" ON "SchoolDirectory"("status");
CREATE INDEX "SchoolDirectory_district_idx" ON "SchoolDirectory"("district");
CREATE INDEX "SchoolDirectory_name_idx" ON "SchoolDirectory"("name");
