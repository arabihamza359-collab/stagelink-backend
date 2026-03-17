const { successResponse, errorResponse } = require('../utils/response.utils');
const { runFullMatching } = require('../services/matching.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const runMatching = async (req, res) => {
  try {
    const stats = await runFullMatching();
    return successResponse(res, 200, 'Matching algorithm executed manually', stats);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getSuggestionsForStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.student_id } });
    if (!student) return errorResponse(res, 404, 'Student not found');
    
    // Authorization check
    if (req.user.role === 'student' && req.user.id !== student.user_id) {
      return errorResponse(res, 403, 'Forbidden');
    }
    
    const matches = await prisma.match.findMany({
      where: { student_id: student.id },
      include: { offer: true, company: true },
      orderBy: { match_score: 'desc' },
      take: 10
    });
    
    return successResponse(res, 200, 'Suggestions retrieved', matches);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getCandidatesForOffer = async (req, res) => {
  try {
    const offer = await prisma.internshipOffer.findUnique({ where: { id: req.params.offer_id } });
    if (!offer) return errorResponse(res, 404, 'Offer not found');
    
    // Authorization check
    if (req.user.role === 'company') {
      const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
      if (offer.company_id !== company.id) return errorResponse(res, 403, 'Unauthorized access to this offer');
    }

    const matches = await prisma.match.findMany({
      where: { offer_id: offer.id },
      include: { 
        student: {
          select: { id: true, first_name: true, last_name: true, city: true, skills: true, education_level: true, cv_file_url: true }
        }
      },
      orderBy: { match_score: 'desc' },
      take: 10
    });
    
    return successResponse(res, 200, 'Candidates retrieved', matches);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  runMatching,
  getSuggestionsForStudent,
  getCandidatesForOffer
};
