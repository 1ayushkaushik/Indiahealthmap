-- CreateTable
CREATE TABLE "Disease" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "totalDeaths" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "DiseaseData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "diseaseId" INTEGER NOT NULL,
    "stateName" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "cases" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DiseaseData_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Disease_name_key" ON "Disease"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DiseaseData_diseaseId_stateName_districtName_date_key" ON "DiseaseData"("diseaseId", "stateName", "districtName", "date");
