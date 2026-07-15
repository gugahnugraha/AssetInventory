import prisma from "./src/services/db.js";

async function main() {
  console.log("Starting database cleanup for Assets...");
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

    console.log("Database cleanup completed successfully.");
  } catch (error) {
    console.error("Error cleaning database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
