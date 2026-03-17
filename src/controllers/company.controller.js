const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');

const getProfile = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { user_id: req.user.id }
    });
    if (!company) return errorResponse(res, 404, 'Profile not found');
    return successResponse(res, 200, 'Profile retrieved', company);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const updateProfile = async (req, res) => {
  try {
    const updated = await prisma.company.update({
      where: { user_id: req.user.id },
      data: req.body
    });
    return successResponse(res, 200, 'Profile updated', updated);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getDashboard = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    const offers_count = await prisma.internshipOffer.count({ where: { company_id: company.id, is_active: true } });
    
    const matches_count = await prisma.match.count({ where: { company_id: company.id } });

    const recent_candidates = await prisma.match.findMany({
      where: { company_id: company.id },
      take: 5,
      include: { student: true, offer: true },
      orderBy: { created_at: 'desc' }
    });

    return successResponse(res, 200, 'Dashboard loaded', {
      matched_profiles_count: matches_count,
      active_offers_count: offers_count,
      completed_internships: 0,
      subscription_status: company.subscription_status,
      recent_candidates,
      pending_requests: [],
      billing_history: []
    });
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const createOffer = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    if (company.subscription_status !== 'active') {
      return errorResponse(res, 403, 'Active subscription required to post offers');
    }

    const { title, description, domain, level_required, duration, city, expires_at } = req.body;
    
    const offer = await prisma.internshipOffer.create({
      data: {
        company_id: company.id,
        title,
        description,
        domain,
        level_required,
        duration,
        city,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });

    // Automatically triggering the matching service for the newly created offer
    const { matchOfferToStudents } = require('../services/matching.service');
    // Using loose coupling - run match asynchronously in background
    matchOfferToStudents(offer).catch(e => console.error("Matching error:", e));
    
    return successResponse(res, 201, 'Offer created successfully', offer);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getOffers = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    const offers = await prisma.internshipOffer.findMany({
      where: { company_id: company.id },
      orderBy: { created_at: 'desc' }
    });
    return successResponse(res, 200, 'Offers retrieved', offers);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const updateOffer = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.expires_at) data.expires_at = new Date(data.expires_at);

    const updated = await prisma.internshipOffer.update({
      where: { id: req.params.id },
      data
    });
    return successResponse(res, 200, 'Offer updated', updated);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const deleteOffer = async (req, res) => {
  try {
    await prisma.internshipOffer.update({
      where: { id: req.params.id },
      data: { is_active: false }
    });
    return successResponse(res, 200, 'Offer deleted (soft)');
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    
    const matches = await prisma.match.findMany({
      where: { company_id: company.id },
      include: { 
        student: { 
          select: { first_name: true, last_name: true, skills: true, city: true, availability: true, education_level: true, cv_file_url: true }
        },
        offer: { select: { title: true } }
      },
      orderBy: { match_score: 'desc' },
      skip,
      take: Number(limit)
    });

    return successResponse(res, 200, 'Candidates retrieved', matches);
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const contactCandidate = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    
    if (company.subscription_status !== 'active') {
      return errorResponse(res, 403, 'Active subscription required to contact candidates');
    }

    const match = await prisma.match.findFirst({
      where: { company_id: company.id, student_id }
    });

    if (!match) return errorResponse(res, 404, 'No valid match record found to initiate contact');

    const updatedMatch = await prisma.match.update({
      where: { id: match.id },
      data: { status: 'contacted' }
    });

    const { createNotification } = require('../services/notification.service');
    const student = await prisma.student.findUnique({ where: { id: student_id } });
    await createNotification(
      student.user_id,
      'COMPANY_CONTACT',
      'Une entreprise souhaite vous contacter',
      `${company.company_name} a réagi positivement à votre profil !`
    );

    return successResponse(res, 200, 'Candidate contacted successfully', updatedMatch);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getSubscription = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ 
      where: { user_id: req.user.id },
      include: { subscriptions: true }
    });
    return successResponse(res, 200, 'Subscription details retrieved', {
      subscription_status: company.subscription_status,
      subscription_start: company.subscription_start,
      subscription_end: company.subscription_end,
      billing_history: company.subscriptions
    });
  } catch (err) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  getProfile, updateProfile, getDashboard,
  createOffer, getOffers, updateOffer, deleteOffer,
  getCandidates, contactCandidate, getSubscription
};
