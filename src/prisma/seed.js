const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  // Check if users exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Deleting existing data...');
    // Be careful with deleteMany in production, but this is a seed script
    await prisma.testimonial.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.match.deleteMany();
    await prisma.internshipOffer.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.company.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create 3 Students
  const studentUsers = [];
  for (let i = 1; i <= 3; i++) {
    const s = await prisma.user.create({
      data: {
        email: `student${i}@stagelink.ma`,
        password_hash: passwordHash,
        role: 'student',
        is_verified: true,
        student: {
          create: {
            first_name: `Student${i}`,
            last_name: `Test${i}`,
            city: ["Casablanca", "Rabat", "Marrakech"][i-1],
            education_level: 'bac3',
            field_of_study: 'Informatique',
            skills: ['JavaScript', 'React', 'Node.js'],
            availability: 'immediate',
            profile_completion: 80
          }
        }
      },
      include: { student: true }
    });
    studentUsers.push(s);
  }

  // Create 3 Companies
  const companyUsers = [];
  for (let i = 1; i <= 3; i++) {
    const c = await prisma.user.create({
      data: {
        email: `company${i}@stagelink.ma`,
        password_hash: passwordHash,
        role: 'company',
        is_verified: true,
        company: {
          create: {
            company_name: `Entreprise ${i}`,
            sector: 'Technologies de l\'information',
            city: ["Casablanca", "Rabat", "Tanger"][i-1],
            subscription_status: 'active',
            contact_first_name: `RH${i}`,
            contact_last_name: `Test${i}`,
          }
        }
      },
      include: { company: true }
    });
    companyUsers.push(c);
  }

  // Create 5 Offers split among companies
  for (let i = 1; i <= 5; i++) {
    const company = companyUsers[i % 3].company;
    await prisma.internshipOffer.create({
      data: {
        company_id: company.id,
        title: `Stagiaire Développeur Web ${i}`,
        description: `Nous cherchons un stagiaire motivé pour le développement web.`,
        domain: 'Informatique',
        level_required: 'bac3',
        duration: '3 mois',
        city: company.city,
        is_active: true
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
