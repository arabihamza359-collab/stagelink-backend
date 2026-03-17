const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['student', 'company']),
    // Optional profile fields
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    education_level: z.enum(['bac1', 'bac2', 'bac3', 'bac4', 'bac5']).optional(),
    field_of_study: z.string().optional(),
    company_name: z.string().optional(),
    sector: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().length(6),
    new_password: z.string().min(6)
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
