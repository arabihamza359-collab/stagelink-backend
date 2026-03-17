const { z } = require('zod');

const subscribeSchema = z.object({
  body: z.object({
    plan: z.enum(['monthly', 'yearly']),
    payment_method: z.string().optional()
  })
});

const cvPremiumSchema = z.object({
  body: z.object({
    payment_method: z.string().optional()
  })
});

module.exports = { subscribeSchema, cvPremiumSchema };
