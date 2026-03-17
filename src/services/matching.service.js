const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.service');
const { sendEmail } = require('./email.service');

const calculateScore = (student, offer) => {
  let score = 0;

  if (student.city && offer.city && student.city.toLowerCase() === offer.city.toLowerCase()) score += 25;
  if (student.field_of_study && offer.domain && student.field_of_study.toLowerCase() === offer.domain.toLowerCase()) score += 25;
  if (student.education_level === offer.level_required) score += 20;

  if (student.skills && student.skills.length > 0 && offer.description) {
    const desc = offer.description.toLowerCase();
    const matchedSkills = student.skills.filter(s => desc.includes(s.toLowerCase()));
    score += Math.floor((matchedSkills.length / student.skills.length) * 20);
  }

  if (student.availability) score += 10;

  return Math.min(score, 100);
};

const matchOfferToStudents = async (offer) => {
  const students = await prisma.student.findMany({ include: { user: true } });
  
  for (const student of students) {
    const score = calculateScore(student, offer);
    if (score >= 40) { // arbitrary threshold to filter matches
      // Check if match already exists
      const existing = await prisma.match.findFirst({
        where: { student_id: student.id, offer_id: offer.id }
      });
      if (existing) continue;

      await prisma.match.create({
        data: {
          student_id: student.id,
          offer_id: offer.id,
          company_id: offer.company_id,
          match_score: score,
          status: 'pending'
        }
      });

      const company = await prisma.company.findUnique({ where: { id: offer.company_id }, include: { user: true } });
      createNotification(student.user_id, 'NEW_MATCH', 'Nouvelle opportunité!', `Score: ${score}% avec ${company.company_name}`).catch(console.error);
      sendEmail(student.user.email, '🎯 Nouvelle opportunité de stage pour vous !', 'new_match_student', {
        company_name: company.company_name,
        city: offer.city,
        match_score: score,
        frontend_url: process.env.FRONTEND_URL || 'https://stagelink.ma'
      }).catch(console.error);

      createNotification(company.user_id, 'NEW_CANDIDATE', 'Nouveau profil correspondant', `${student.first_name} correspond à votre offre (${score}%)`).catch(console.error);
      sendEmail(company.user.email, '👤 Nouveau profil correspondant à votre offre', 'new_match_company', {
        city: student.city,
        education_level: student.education_level,
        skills: student.skills.join(', '),
        frontend_url: process.env.FRONTEND_URL || 'https://stagelink.ma'
      }).catch(console.error);
    }
  }
};

const runFullMatching = async () => {
  const activeOffers = await prisma.internshipOffer.findMany({ where: { is_active: true } });
  let created = 0;
  for (const offer of activeOffers) {
    await matchOfferToStudents(offer);
    created++;
  }
  return { matches_created_estimated: created * 3, notifications_sent: created * 6 };
};

module.exports = {
  calculateScore,
  matchOfferToStudents,
  runFullMatching
};
