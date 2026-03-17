const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');
const { createNotification } = require('../services/notification.service');

const sendMessage = async (req, res) => {
  try {
    const { receiver_id, match_id, content } = req.body;
    const sender_id = req.user.id;

    const message = await prisma.message.create({
      data: {
        sender_id,
        receiver_id,
        match_id,
        content
      }
    });

    const sender = await prisma.user.findUnique({ where: { id: sender_id }, include: { student: true, company: true } });
    const senderName = sender.role === 'student' ? `${sender.student.first_name} ${sender.student.last_name}` : sender.company.company_name;

    createNotification(receiver_id, 'NEW_MESSAGE', 'Nouveau message reçu', `Vous avez reçu un nouveau message de ${senderName}`).catch(console.error);

    return successResponse(res, 201, 'Message sent', message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const matchesUserIsIn = await prisma.match.findMany({
      where: {
        OR: [
          { student: { user_id: userId } },
          { company: { user_id: userId } }
        ]
      },
      include: {
        student: { select: { first_name: true, last_name: true, user_id: true } },
        company: { select: { company_name: true, user_id: true } },
        offer: { select: { title: true } },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    const conversations = matchesUserIsIn.map(match => {
      const partner = req.user.role === 'student' 
        ? { id: match.company.user_id, name: match.company.company_name }
        : { id: match.student.user_id, name: `${match.student.first_name} ${match.student.last_name}` };

      return {
        match_id: match.id,
        offer_title: match.offer.title,
        partner,
        last_message: match.messages[0] || null
      };
    });

    return successResponse(res, 200, 'Conversations retrieved', conversations);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { match_id } = req.params;
    
    await prisma.message.updateMany({
      where: {
        match_id,
        receiver_id: req.user.id,
        is_read: false
      },
      data: { is_read: true }
    });

    const messages = await prisma.message.findMany({
      where: { match_id },
      orderBy: { created_at: 'asc' }
    });

    return successResponse(res, 200, 'Messages retrieved', messages);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.update({
      where: { id },
      data: { is_read: true }
    });
    return successResponse(res, 200, 'Message read', message);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  markMessageRead
};
