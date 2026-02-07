-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'YIMU', 'OTHER');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "type" "BillType" NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(20),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "source" "DataSource" NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "BillType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(12,2) NOT NULL,
    "remark" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "categoryId" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_tags" (
    "billId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "bill_tags_pkey" PRIMARY KEY ("billId","tagId")
);

-- CreateIndex
CREATE INDEX "idx_category_parent" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "idx_category_deleted" ON "categories"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_tag_parent" ON "tags"("parentId");

-- CreateIndex
CREATE INDEX "idx_tag_deleted" ON "tags"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_bill_date" ON "bills"("date");

-- CreateIndex
CREATE INDEX "idx_bill_category" ON "bills"("categoryId");

-- CreateIndex
CREATE INDEX "idx_bill_type" ON "bills"("type");

-- CreateIndex
CREATE INDEX "idx_bill_deleted" ON "bills"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_bill_import_batch" ON "bills"("importBatchId");

-- CreateIndex
CREATE INDEX "idx_billtag_tag" ON "bill_tags"("tagId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_tags" ADD CONSTRAINT "bill_tags_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_tags" ADD CONSTRAINT "bill_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
