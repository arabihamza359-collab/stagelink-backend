const app = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Basic DB connection test
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    await prisma.$disconnect();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log('DATABASE_URL detected:', process.env.DATABASE_URL ? 'YES' : 'NO');
    });
  } catch (err) {
    console.error('❌ Failed to start server - Database connection error:', err.message);
    process.exit(1);
  }
}

startServer();

