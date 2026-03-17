const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNotification = async (userId, type, title, message) => {
  try {
    return await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        is_read: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};
