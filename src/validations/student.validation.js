const { z } = require('zod');

const profileSchema = z.object({
  body: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_whatsapp: z.string().optional(),
    city: z.string().optional(),
    date_of_birth: z.string().optional(),
    education_level: z.enum(['bac1', 'bac2', 'bac3', 'bac4', 'bac5']).optional(),
    field_of_study: z.string().optional(),
    school: z.string().optional(),
    skills: z.array(z.string()).optional(),
    availability: z.enum(['immediate', '1month', '2months', '3months']).optional(),
    stage_type: z.string().optional(),
    sector_preference: z.string().optional(),
    motivation: z.string().optional()
  })
});

module.exports = {
  profileSchema
};
