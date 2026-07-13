const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL environment variable is required to run the seed script.");
    process.exit(1);
  }

  console.log("Seeding database...");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Create OPD
    const opd = await prisma.opd.upsert({
      where: { kode: "DISKOMINFO" },
      update: {},
      create: {
        nama: "Dinas Komunikasi, Informatika, dan Statistik Kabupaten Bandung",
        kode: "DISKOMINFO",
      },
    });
    console.log(`- Seeded OPD: ${opd.nama} (${opd.kode})`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

    // 2. Create Users (Admin, Operator, Manager)
    const admin = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        nama: "Administrator Utama",
        username: "admin",
        passwordHash: defaultPasswordHash,
        role: "ADMINISTRATOR",
        opdId: opd.id,
        isActive: true,
      },
    });
    console.log(`- Seeded User Admin: ${admin.username}`);

    const operator = await prisma.user.upsert({
      where: { username: "operator" },
      update: {},
      create: {
        nama: "Operator Aset",
        username: "operator",
        passwordHash: defaultPasswordHash,
        role: "OPERATOR",
        opdId: opd.id,
        isActive: true,
      },
    });
    console.log(`- Seeded User Operator: ${operator.username}`);

    const manager = await prisma.user.upsert({
      where: { username: "manager" },
      update: {},
      create: {
        nama: "Kepala OPD (Manager)",
        username: "manager",
        passwordHash: defaultPasswordHash,
        role: "MANAGER",
        opdId: opd.id,
        isActive: true,
      },
    });
    console.log(`- Seeded User Manager: ${manager.username}`);

    // 3. Create Distributions
    const distributionsData = [
      "Sekretariat",
      "Keuangan",
      "Aset",
      "Perencanaan",
      "Umum",
    ];

    const distributions = [];
    for (const name of distributionsData) {
      const dist = await prisma.distribution.upsert({
        where: { nama_opdId: { nama: name, opdId: opd.id } },
        update: {},
        create: {
          nama: name,
          opdId: opd.id,
        },
      });
      distributions.push(dist);
    }
    console.log(`- Seeded Distributions: ${distributionsData.join(", ")}`);

    // Find Specific Distributions for Holders
    const distAset = distributions.find(d => d.nama === "Aset");
    const distKeuangan = distributions.find(d => d.nama === "Keuangan");
    const distUmum = distributions.find(d => d.nama === "Umum");

    // 4. Create Holders
    const holdersData = [
      {
        nama: "H. Dadang, S.Kom., M.Si.",
        nip: "198203152008011003",
        jabatan: "Kepala Bidang Aset",
        distributionId: distAset.id,
      },
      {
        nama: "Hj. Siti Aminah, S.E.",
        nip: "198509202010022001",
        jabatan: "Bendahara Pengeluaran",
        distributionId: distKeuangan.id,
      },
      {
        nama: "Asep Wijaya, A.Md.",
        nip: "199011122015031002",
        jabatan: "Pengelola Barang Inventaris",
        distributionId: distUmum.id,
      },
    ];

    for (const holder of holdersData) {
      await prisma.holder.upsert({
        where: { nip: holder.nip },
        update: {
          nama: holder.nama,
          jabatan: holder.jabatan,
          distributionId: holder.distributionId,
        },
        create: holder,
      });
    }
    console.log("- Seeded sample Holders");
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
