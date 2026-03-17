const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');
const { createNotification } = require('../services/notification.service');

const getStats = async (req, res) => {
  try {
    const total_students = await prisma.student.count();
    const total_companies = await prisma.company.count();
    const total_matches = await prisma.match.count();
    const active_subscriptions = await prisma.subscription.count({ where: { status: 'active' } });

    const revenue_this_month = 15000;
    const new_registrations_today = 5;
    const pending_cv_requests = await prisma.student.count({ where: { wants_premium_cv: true } });

    return successResponse(res, 200, 'Admin stats retrieved', {
      total_students,
      total_companies,
      total_matches,
      active_subscriptions,
      revenue_this_month,
      new_registrations_today,
      pending_cv_requests,
      cities_breakdown: {},
      recent_activity: []
    });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({ include: { user: true } });
    return successResponse(res, 200, 'Students retrieved', students);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({ include: { user: true, subscriptions: true } });
    return successResponse(res, 200, 'Companies retrieved', companies);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const toggleUserActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse(res, 404, 'User not found');

    const updated = await prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active }
    });
    return successResponse(res, 200, 'User activation toggled', { is_active: updated.is_active });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { is_approved: true }
    });
    return successResponse(res, 200, 'Testimonial approved', updated);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getMatches = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({ include: { student: true, company: true, offer: true } });
    return successResponse(res, 200, 'Matches retrieved', matches);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const sendBulkNotification = async (req, res) => {
  try {
    const { user_id, role, title, message } = req.body;
    let users = [];

    if (user_id) {
      users = [{ id: user_id }];
    } else if (role) {
      users = await prisma.user.findMany({ where: { role } });
    } else {
      users = await prisma.user.findMany();
    }

    let sent = 0;
    for (const u of users) {
      createNotification(u.id, 'SYSTEM', title, message).then(() => sent++).catch(() => {});
    }

    return successResponse(res, 200, 'Notifications dispatched', { expected: users.length });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  getStats, getStudents, getCompanies, toggleUserActivation, approveTestimonial, getMatches, sendBulkNotification
};
