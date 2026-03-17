const { z } = require('zod');

const profileSchema = z.object({
  body: z.object({
    company_name: z.string().optional(),
    sector: z.string().optional(),
    size: z.string().optional(),
    city: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    contact_first_name: z.string().optional(),
    contact_last_name: z.string().optional(),
    contact_position: z.string().optional(),
    contact_phone: z.string().optional(),
    profile_searched: z.string().optional(),
    level_required: z.string().optional(),
    stage_duration: z.string().optional(),
    job_description: z.string().optional()
  })
});

const offerSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string().optional(),
    domain: z.string().optional(),
    level_required: z.string().optional(),
    duration: z.string().optional(),
    city: z.string().optional(),
    expires_at: z.string().optional()
  })
});

module.exports = {
  profileSchema,
  offerSchema
};
