const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');
const { uploadFile } = require('../services/storage.service');

const getProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { user_id: req.user.id }
    });
    if (!student) return errorResponse(res, 404, 'Profile not found');
    return successResponse(res, 200, 'Profile retrieved', student);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.date_of_birth) data.date_of_birth = new Date(data.date_of_birth);

    const fieldsToCheck = [
      'first_name', 'last_name', 'phone_whatsapp', 'city', 'date_of_birth',
      'education_level', 'field_of_study', 'school', 'skills', 'availability',
      'cv_file_url'
    ];
    
    const updated = await prisma.student.update({
      where: { user_id: req.user.id },
      data
    });

    let filled = 0;
    fieldsToCheck.forEach(f => {
      if (updated[f] && (Array.isArray(updated[f]) ? updated[f].length > 0 : true)) {
        filled++;
      }
    });
    const profile_completion = Math.floor((filled / fieldsToCheck.length) * 100);

    const finalStudent = await prisma.student.update({
      where: { user_id: req.user.id },
      data: { profile_completion }
    });

    return successResponse(res, 200, 'Profile updated', finalStudent);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getDashboard = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
    if (!student) return errorResponse(res, 404, 'Student profile required');

    const matches_count = await prisma.match.count({ where: { student_id: student.id } });
    const unread_messages = await prisma.message.count({ where: { receiver_id: req.user.id, is_read: false } });
    
    const recent_matches = await prisma.match.findMany({
      where: { student_id: student.id },
      take: 5,
      include: { company: true, offer: true },
      orderBy: { created_at: 'desc' }
    });

    return successResponse(res, 200, 'Dashboard loaded', {
      matches_count,
      unread_messages,
      applications_sent: matches_count,
      profile_completion: student.profile_completion,
      recent_matches,
      recent_messages: [],
      timeline: [],
      cv_status: student.cv_file_url ? 'uploaded' : 'missing'
    });
  } catch (err) {
    return errorResponse(res, 500, 'Error loading dashboard');
  }
};

const getMatches = async (req, res) => {
  try {
    // Basic pagination simulation
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
    const matches = await prisma.match.findMany({
      where: { student_id: student.id },
      include: { company: true, offer: true },
      orderBy: { match_score: 'desc' },
      skip,
      take: Number(limit)
    });
    return successResponse(res, 200, 'Matches retrieved', matches);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const uploadCV = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file provided');
    const url = await uploadFile(req.file.buffer, req.file.originalname, 'cvs');
    
    await prisma.student.update({
      where: { user_id: req.user.id },
      data: { cv_file_url: url }
    });

    return successResponse(res, 200, 'CV uploaded', { cv_file_url: url });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file provided');
    const url = await uploadFile(req.file.buffer, req.file.originalname, 'photos');
    
    await prisma.student.update({
      where: { user_id: req.user.id },
      data: { profile_photo_url: url }
    });

    return successResponse(res, 200, 'Photo uploaded', { profile_photo_url: url });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const notifs = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit)
    });
    return successResponse(res, 200, 'Notifications retrieved', notifs);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true }
    });
    return successResponse(res, 200, 'Notification marked as read', updated);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getMatches,
  uploadCV,
  uploadPhoto,
  getNotifications,
  markNotificationRead
};
