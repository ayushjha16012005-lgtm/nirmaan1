import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Nirmaan database seeding...');

  // 1. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      email: 'admin@nirmaan.org',
      role: UserRole.ADMIN,
      passwordHash: 'admin_hash_placeholder',
    },
  });

  // 2. Create Client
  const clientUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      email: 'client@nirmaan.org',
      role: UserRole.CLIENT,
      clientProfile: {
        create: {
          name: 'Aarav Gupta',
          phone: '9876543210',
          city: 'Noida',
        },
      },
    },
  });

  // 3. Create Seed Workers
  const workersData = [
    {
      phone: '9811111111',
      name: 'रमेश कुमार',
      nameEn: 'Ramesh Kumar',
      trade: 'Mason',
      city: 'Noida',
      experienceYears: 8,
      rating: 4.8,
      ratingCount: 24,
      dailyRate: 700,
      isAvailable: true,
      verificationStatus: VerificationStatus.APPROVED,
    },
    {
      phone: '9822222222',
      name: 'सुनील वर्मा',
      nameEn: 'Sunil Verma',
      trade: 'Electrician',
      city: 'Delhi',
      experienceYears: 5,
      rating: 4.5,
      ratingCount: 18,
      dailyRate: 600,
      isAvailable: true,
      verificationStatus: VerificationStatus.APPROVED,
    },
    {
      phone: '9833333333',
      name: 'मोहन लाल',
      nameEn: 'Mohan Lal',
      trade: 'Plumber',
      city: 'Mumbai',
      experienceYears: 10,
      rating: 4.9,
      ratingCount: 42,
      dailyRate: 750,
      isAvailable: false,
      verificationStatus: VerificationStatus.APPROVED,
    },
    {
      phone: '9844444444',
      name: 'इरफान अली',
      nameEn: 'Irfan Ali',
      trade: 'Tile Work',
      city: 'Lucknow',
      experienceYears: 3,
      rating: 4.2,
      ratingCount: 9,
      dailyRate: 500,
      isAvailable: true,
      verificationStatus: VerificationStatus.APPROVED,
    },
    // Pending Workers
    {
      phone: '9855555555',
      name: 'अजय शर्मा',
      nameEn: 'Ajay Sharma',
      trade: 'Painter',
      city: 'Mumbai',
      experienceYears: 4,
      rating: 0,
      ratingCount: 0,
      dailyRate: 550,
      isAvailable: true,
      verificationStatus: VerificationStatus.PENDING,
    },
    {
      phone: '9866666666',
      name: 'दिनेश पटेल',
      nameEn: 'Dinesh Patel',
      trade: 'Welder',
      city: 'Surat',
      experienceYears: 6,
      rating: 0,
      ratingCount: 0,
      dailyRate: 650,
      isAvailable: true,
      verificationStatus: VerificationStatus.PENDING,
    },
  ];

  for (const w of workersData) {
    await prisma.user.upsert({
      where: { phone: w.phone },
      update: {},
      create: {
        phone: w.phone,
        role: UserRole.WORKER,
        workerProfile: {
          create: {
            name: w.name,
            nameEn: w.nameEn,
            trade: w.trade,
            city: w.city,
            experienceYears: w.experienceYears,
            rating: w.rating,
            ratingCount: w.ratingCount,
            dailyRate: w.dailyRate,
            isAvailable: w.isAvailable,
            verificationStatus: w.verificationStatus,
          },
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
