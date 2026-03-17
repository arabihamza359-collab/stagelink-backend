const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');
const { sendEmail } = require('../services/email.service');

const subscribe = async (req, res) => {
  try {
    const { plan, payment_method } = req.body;
    const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
    
    if (!company) return errorResponse(res, 404, 'Company not found');

    const amount = plan === 'yearly' ? 5000 : 500;
    
    const started = new Date();
    const expires = new Date();
    if (plan === 'yearly') expires.setFullYear(expires.getFullYear() + 1);
    else expires.setMonth(expires.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        company_id: company.id,
        plan,
        amount,
        payment_method: payment_method || 'card_mock',
        status: 'active',
        started_at: started,
        expires_at: expires
      }
    });

    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscription_status: 'active',
        subscription_start: started,
        subscription_end: expires
      }
    });

    sendEmail(req.user.email, '✅ Abonnement StageLink activé', 'subscription_confirmation', {
      plan: plan === 'yearly' ? 'Annuel' : 'Mensuel',
      amount,
      start_date: started.toLocaleDateString(),
      end_date: expires.toLocaleDateString(),
      frontend_url: process.env.FRONTEND_URL || 'https://stagelink.ma'
    }).catch(console.error);

    return successResponse(res, 201, 'Subscription created successfully', subscription);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const requestCvPremium = async (req, res) => {
  try {
    await prisma.student.update({
      where: { user_id: req.user.id },
      data: { wants_premium_cv: true }
    });
    
    return successResponse(res, 200, 'Premium CV requested. Admin will contact you shortly.', { status: 'pending' });
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

const getHistory = async (req, res) => {
  try {
    if (req.user.role === 'company') {
      const company = await prisma.company.findUnique({ where: { user_id: req.user.id } });
      const subs = await prisma.subscription.findMany({ where: { company_id: company.id }, orderBy: { started_at: 'desc' } });
      return successResponse(res, 200, 'Billing history retrieved', subs);
    }
    return successResponse(res, 200, 'History retrieved', []);
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error');
  }
};

module.exports = {
  subscribe,
  requestCvPremium,
  getHistory
};
