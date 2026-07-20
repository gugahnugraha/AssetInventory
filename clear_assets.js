require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== STARTING ASSET TABLE CLEANUP ===");
  try {
    const deletedAttributes = await prisma.assetAttribute.deleteMany();
    console.log(`- Deleted ${deletedAttributes.count} asset attributes.`);

    const deletedHistory = await prisma.assetHistory.deleteMany();
    console.log(`- Deleted ${deletedHistory.count} asset history records.`);

    const deletedRecons = await prisma.assetReconciliation.deleteMany();
    console.log(`- Deleted ${deletedRecons.count} asset reconciliations.`);

    const deletedLogs = await prisma.auditLog.deleteMany();
    console.log(`- Deleted ${deletedLogs.count} audit logs.`);

    const deletedAssets = await prisma.asset.deleteMany();
    console.log(`- Deleted ${deletedAssets.count} assets.`);

    console.log("\n=== VERIFYING MASTER DATA (MUST BE INTACT) ===");
    const remainingAssets = await prisma.asset.count();
    const opdCount = await prisma.opd.count();
    const userCount = await prisma.user.count();
    const distCount = await prisma.distribution.count();
    const holderCount = await prisma.holder.count();
    const kibCount = await prisma.kib.count();
    const categoryCount = await prisma.category.count();

    console.log(`- Assets remaining: ${remainingAssets} (Expected: 0)`);
    console.log(`- OPD remaining: ${opdCount}`);
    console.log(`- Users remaining: ${userCount}`);
    console.log(`- Distributions remaining: ${distCount}`);
    console.log(`- Holders remaining: ${holderCount}`);
    console.log(`- KIBs remaining: ${kibCount}`);
    console.log(`- Categories remaining: ${categoryCount}`);

    console.log("\nAsset table successfully cleared!");
  } catch (error) {
    console.error("Error cleaning asset table:", error);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

main();
