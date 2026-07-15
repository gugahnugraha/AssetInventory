import 'dotenv/config';
import prisma from "./src/services/db";

async function main() {
  console.log("Clearing assets and related data...");
  await prisma.document.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.reconciliationFinding.deleteMany({});
  await prisma.assetReconciliationChecklist.deleteMany({});
  await prisma.assetReconciliation.deleteMany({});
  await prisma.assetAttribute.deleteMany({});
  // Optional: clear audit logs to keep db clean
  await prisma.auditLog.deleteMany({
    where: { action: { in: ['CREATE', 'UPDATE', 'DELETE', 'IMPORT'] } }
  });
  await prisma.asset.deleteMany({});
  console.log("Database cleared successfully!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
