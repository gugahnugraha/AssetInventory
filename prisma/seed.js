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
        kodeNumeric: "21.02.01.01",
      },
    });
    console.log(`- Seeded OPD: ${opd.nama} (${opd.kode})`);

    // 1.2 Seed KIBs A-F
    const kibsData = [
      { kode: "A", nama: "Tanah", deskripsi: "Aset berupa tanah" },
      { kode: "B", nama: "Peralatan dan Mesin", deskripsi: "Aset berupa mesin, alat angkutan, alat kantor, dll" },
      { kode: "C", nama: "Gedung dan Bangunan", deskripsi: "Aset berupa bangunan gedung, monumen, dll" },
      { kode: "D", nama: "Jalan, Irigasi, dan Jaringan", deskripsi: "Aset berupa jalan, jembatan, instalasi, jaringan, dll" },
      { kode: "E", nama: "Aset Tetap Lainnya", deskripsi: "Aset berupa buku, barang kesenian, hewan, tumbuhan, dll" },
      { kode: "F", nama: "Konstruksi dalam Pengerjaan", deskripsi: "Aset yang sedang dalam proses pembangunan" },
    ];

    const kibMap = {};
    for (const kib of kibsData) {
      const createdKib = await prisma.kib.upsert({
        where: { kode: kib.kode },
        update: { nama: kib.nama, deskripsi: kib.deskripsi },
        create: { kode: kib.kode, nama: kib.nama, deskripsi: kib.deskripsi, isActive: true },
      });
      kibMap[kib.kode] = createdKib;
    }
    console.log("- Seeded KIBs A-F");

    // 1.5 Seed Categories and Category Attributes
    const categoriesData = [
      {
        nama: "Kendaraan",
        kibKode: "B",
        attributes: [
          { nama: "Nomor Polisi", required: true, fieldType: "TEXT", displayOrder: 1 },
          { nama: "Nomor Mesin", required: true, fieldType: "TEXT", displayOrder: 2 },
          { nama: "Nomor Rangka", required: true, fieldType: "TEXT", displayOrder: 3 },
        ],
      },
      {
        nama: "Peralatan Elektronik",
        kibKode: "B",
        attributes: [
          { nama: "Nomor Serial", required: true, fieldType: "TEXT", displayOrder: 1 },
        ],
      },
      {
        nama: "Furnitur",
        kibKode: "B",
        attributes: [],
      },
      {
        nama: "Peralatan Kantor",
        kibKode: "B",
        attributes: [],
      },
      {
        nama: "Peralatan Jaringan & IT",
        kibKode: "B",
        attributes: [
          { nama: "Nomor Serial", required: false, fieldType: "TEXT", displayOrder: 1 },
          { nama: "IP Address", required: false, fieldType: "TEXT", displayOrder: 2 },
        ],
      },
      {
        nama: "Lainnya",
        kibKode: "B",
        attributes: [],
      },
    ];

    for (const catData of categoriesData) {
      const kib = kibMap[catData.kibKode];
      const cat = await prisma.category.upsert({
        where: { nama_kibId: { nama: catData.nama, kibId: kib.id } },
        update: {},
        create: { nama: catData.nama, kibId: kib.id },
      });
      console.log(`- Seeded Category: ${cat.nama} (${kib.kode})`);

      for (const attr of catData.attributes) {
        await prisma.categoryAttribute.upsert({
          where: { categoryId_nama: { categoryId: cat.id, nama: attr.nama } },
          update: {
            required: attr.required,
            fieldType: attr.fieldType,
            displayOrder: attr.displayOrder,
          },
          create: {
            categoryId: cat.id,
            nama: attr.nama,
            required: attr.required,
            fieldType: attr.fieldType,
            displayOrder: attr.displayOrder,
          },
        });
      }
    }

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
      { nama: "Sekretariat", kode: 1 },
      { nama: "Aptika", kode: 2 },
      { nama: "Persandian", kode: 3 },
      { nama: "Informasi Komunikasi Publik (IKP)", kode: 4 },
      { nama: "Statistik", kode: 5 },
      { nama: "Teknologi Informasi Komunikasi (TIK)", kode: 6 },
    ];

    const distributions = [];
    for (const item of distributionsData) {
      const dist = await prisma.distribution.upsert({
        where: { nama_opdId: { nama: item.nama, opdId: opd.id } },
        update: { kode: item.kode },
        create: {
          nama: item.nama,
          kode: item.kode,
          opdId: opd.id,
        },
      });
      distributions.push(dist);
    }
    console.log("- Seeded new Distributions with Codes");

    // Find Specific Distributions for Holders & Mock Assets
    const distSekretariat = distributions.find(d => d.nama === "Sekretariat");
    const distAptika = distributions.find(d => d.nama === "Aptika");
    const distTik = distributions.find(d => d.nama === "Teknologi Informasi Komunikasi (TIK)");

    // 4. Create Holders
    const holdersData = [
      {
        nama: "H. Dadang, S.Kom., M.Si.",
        nip: "198203152008011003",
        jabatan: "Kepala Bidang Aplikasi Informatika",
        distributionId: distAptika.id,
      },
      {
        nama: "Hj. Siti Aminah, S.E.",
        nip: "198509202010022001",
        jabatan: "Bendahara Pengeluaran",
        distributionId: distSekretariat.id,
      },
      {
        nama: "Asep Wijaya, A.Md.",
        nip: "199011122015031002",
        jabatan: "Pengelola Barang Inventaris TIK",
        distributionId: distTik.id,
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

    // 5. Create Mock Assets
    const catKendaraan = await prisma.category.findFirst({ where: { nama: "Kendaraan" } });
    const catElektronik = await prisma.category.findFirst({ where: { nama: "Peralatan Elektronik" } });
    const holderDadang = await prisma.holder.findUnique({ where: { nip: "198203152008011003" } });
    const holderSiti = await prisma.holder.findUnique({ where: { nip: "198509202010022001" } });

    if (catKendaraan && catElektronik) {
      // Asset 1
      await prisma.asset.upsert({
        where: { kodeLengkap: "1.3.02.05.01.03.02.0001" },
        update: {},
        create: {
          kode1: "02",
          kode2: "05",
          kode3: "01",
          kode4: "03",
          kode5: "02",
          nomorRegister: 1,
          kodeLengkap: "1.3.02.05.01.03.02.0001",
          categoryId: catKendaraan.id,
          namaAset: "Mobil Toyota Avanza Veloz",
          merkType: "Toyota Veloz 1.5 M/T",
          harga: 250000000.0,
          tahunPembelian: 2022,
          distributionId: distAptika.id,
          holderId: holderDadang?.id || null,
          kondisi: "NORMAL",
          catatan: "Kendaraan operasional dinas dalam kondisi baik.",
          opdId: opd.id,
        }
      });

      // Asset 2
      await prisma.asset.upsert({
        where: { kodeLengkap: "1.3.02.05.01.03.02.0002" },
        update: {},
        create: {
          kode1: "02",
          kode2: "05",
          kode3: "01",
          kode4: "03",
          kode5: "02",
          nomorRegister: 2,
          kodeLengkap: "1.3.02.05.01.03.02.0002",
          categoryId: catElektronik.id,
          namaAset: "Laptop Lenovo ThinkPad L14",
          merkType: "Lenovo L14 Gen 3 Core i5",
          harga: 15500000.0,
          tahunPembelian: 2023,
          distributionId: distSekretariat.id,
          holderId: holderSiti?.id || null,
          kondisi: "NORMAL",
          catatan: "Laptop inventaris Bendahara Pengeluaran.",
          opdId: opd.id,
        }
      });
      console.log("- Seeded sample Assets");
    }

    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
